import * as pdfjs from 'pdfjs-dist';

// Set up the worker source using a CDN that matches the library version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface ParsedPage {
  pageNumber: number;
  paragraphs: string[];
}

export interface ParsedDocument {
  title: string;
  pages: ParsedPage[];
  outline: { title: string; dest?: any; pageNumber?: number }[];
}

/**
 * Parses PDF text page-by-page. Reconstructs lines by grouping elements that share similar vertical coordinates,
 * then groups lines into paragraphs.
 */
export async function parsePdf(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
  // PDF.js transfers its input to its worker, which detaches the supplied buffer.
  // Keep the caller's bytes intact because the reader also needs them for canvas
  // rendering after text extraction completes.
  const parserData = new Uint8Array(arrayBuffer.slice(0));
  const loadingTask = pdfjs.getDocument({ data: parserData });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: ParsedPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Type assertion to helper extract items
    const items = content.items as any[];
    
    if (items.length === 0) {
      pages.push({ pageNumber: i, paragraphs: [] });
      continue;
    }

    // Sort items vertically (top to bottom), then horizontally (left to right)
    // transform[5] is the Y coordinate, transform[4] is the X coordinate.
    // PDF coordinates start from the bottom-left, so higher Y means higher up on page.
    const sortedItems = [...items].sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      const xA = a.transform[4];
      const xB = b.transform[4];
      
      // Allow slight delta for floating-point lines
      if (Math.abs(yA - yB) < 3) {
        return xA - xB;
      }
      return yB - yA; // Sort descending vertically
    });

    const lines: string[][] = [];
    let currentLineY = sortedItems[0].transform[5];
    let currentLine: string[] = [];

    for (const item of sortedItems) {
      const itemY = item.transform[5];
      const itemText = item.str;

      if (Math.abs(itemY - currentLineY) < 3) {
        currentLine.push(itemText);
      } else {
        if (currentLine.join('').trim().length > 0) {
          lines.push(currentLine);
        }
        currentLine = [itemText];
        currentLineY = itemY;
      }
    }
    if (currentLine.join('').trim().length > 0) {
      lines.push(currentLine);
    }

    // Assemble lines into paragraphs
    // A line that ends with a period, question mark, or exclamation mark followed by a space,
    // or a line with a large gap to the next line, marks a paragraph boundary.
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const lineStr = lines[idx].join(' ').replace(/\s+/g, ' ').trim();
      if (!lineStr) continue;

      currentParagraph.push(lineStr);

      const isLastLine = idx === lines.length - 1;
      const isParagraphEnd = /[.!?]$/.test(lineStr) || lineStr.length < 40;

      if (isLastLine || isParagraphEnd) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    }

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }

    pages.push({
      pageNumber: i,
      paragraphs: paragraphs.filter(p => p.trim().length > 0),
    });
  }

  // Extract Outline (Table of Contents)
  let outline: any[] = [];
  try {
    const rawOutline = await pdf.getOutline();
    if (rawOutline) {
      outline = await Promise.all(
        rawOutline.map(async (item: any) => {
          let pageNum: number | undefined;
          if (item.dest) {
            try {
              const ref = typeof item.dest === 'string' ? JSON.parse(item.dest) : item.dest;
              const pageIdx = await pdf.getPageIndex(ref[0]);
              pageNum = pageIdx + 1;
            } catch (_) {}
          }
          return {
            title: item.title,
            pageNumber: pageNum,
          };
        })
      );
    }
  } catch (err) {
    console.warn('Could not parse PDF outline:', err);
  }

  return {
    title: fileName.replace(/\.[^/.]+$/, ""),
    pages,
    outline,
  };
}

/**
 * Splits plain text files into paragraphs and distributes them into paginated nodes
 * (roughly 1500 characters per page for consistent reading rhythm).
 */
export function parseTxt(text: string, fileName: string): ParsedDocument {
  const rawParagraphs = text.split(/\n\s*\n+/);
  const paragraphs = rawParagraphs.map(p => p.replace(/\s+/g, ' ').trim()).filter(p => p.length > 0);
  
  const pages: ParsedPage[] = [];
  let currentPageParagraphs: string[] = [];
  let currentLength = 0;
  let pageCounter = 1;

  for (const para of paragraphs) {
    currentPageParagraphs.push(para);
    currentLength += para.length;

    if (currentLength >= 1800) {
      pages.push({
        pageNumber: pageCounter++,
        paragraphs: currentPageParagraphs,
      });
      currentPageParagraphs = [];
      currentLength = 0;
    }
  }

  if (currentPageParagraphs.length > 0) {
    pages.push({
      pageNumber: pageCounter,
      paragraphs: currentPageParagraphs,
    });
  }

  return {
    title: fileName.replace(/\.[^/.]+$/, ""),
    pages,
    outline: pages.map(p => ({ title: `Page ${p.pageNumber}`, pageNumber: p.pageNumber })),
  };
}

/**
 * Simple Markdown parser. Splits headers and text blocks and distributes them into paginated nodes.
 */
export function parseMarkdown(mdText: string, fileName: string): ParsedDocument {
  // We can treat markdown paragraphs similarly to txt, keeping lists and headers.
  // Strips simple markdown symbols or keeps them for custom CSS.
  const lines = mdText.split('\n');
  const paragraphs: string[] = [];
  let buffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      if (buffer.length > 0) {
        paragraphs.push(buffer.join(' '));
        buffer = [];
      }
      paragraphs.push(trimmed); // Header is its own paragraph
    } else if (trimmed === '') {
      if (buffer.length > 0) {
        paragraphs.push(buffer.join(' '));
        buffer = [];
      }
    } else {
      buffer.push(trimmed);
    }
  }

  if (buffer.length > 0) {
    paragraphs.push(buffer.join(' '));
  }

  // Paginate paragraphs
  const pages: ParsedPage[] = [];
  let currentPageParagraphs: string[] = [];
  let currentLength = 0;
  let pageCounter = 1;

  for (const para of paragraphs) {
    currentPageParagraphs.push(para);
    currentLength += para.length;

    if (currentLength >= 1800) {
      pages.push({
        pageNumber: pageCounter++,
        paragraphs: currentPageParagraphs,
      });
      currentPageParagraphs = [];
      currentLength = 0;
    }
  }

  if (currentPageParagraphs.length > 0) {
    pages.push({
      pageNumber: pageCounter,
      paragraphs: currentPageParagraphs,
    });
  }

  // Create outline from headers
  const outline: { title: string; pageNumber: number }[] = [];
  
  pages.forEach(p => {
    p.paragraphs.forEach(para => {
      if (para.startsWith('#')) {
        const title = para.replace(/^#+\s*/, '');
        outline.push({ title, pageNumber: p.pageNumber });
      }
    });
  });

  // Fallback to page links if no headers found
  if (outline.length === 0) {
    pages.forEach(p => {
      outline.push({ title: `Page ${p.pageNumber}`, pageNumber: p.pageNumber });
    });
  }

  return {
    title: fileName.replace(/\.[^/.]+$/, ""),
    pages,
    outline,
  };
}
