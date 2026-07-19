import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Highlighter, MessageSquare, BookOpen } from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';
import { parsePdf, parseTxt, parseMarkdown } from '../../utils/documentParser';
import type { ParsedDocument } from '../../utils/documentParser';

export const ReaderCanvas: React.FC = () => {
  const {
    file,
    fileName,
    currentPage,
    setNumPages,
    setTOC,
    reflowMode,
    parsedDoc,
    setParsedDoc,
    theme,
    readingMode,
    filters,
    typography,
    overlays,
    focusLine,
    updateFocusLine,
    notes,
    addNote,
    highlights,
    addHighlight,
    removeHighlight,
  } = useReaderStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reflowContainerRef = useRef<HTMLDivElement | null>(null);
  
  const [scale] = useState(1.4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [activeParagraphIdx, setActiveParagraphIdx] = useState<number | null>(null);
  const [highlightColor] = useState('rgba(253, 224, 71, 0.4)'); // default yellow
  const [highlightType, setHighlightType] = useState<'highlight' | 'underline' | 'strike'>('highlight');

  // Handle document parsing (PDF, TXT, MD)
  useEffect(() => {
    if (!file) {
      setPdfDoc(null);
      setParsedDoc(null);
      setNumPages(0);
      return;
    }

    const parseDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const fileExt = fileName?.split('.').pop()?.toLowerCase();
        
        if (fileExt === 'pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const parsed = await parsePdf(arrayBuffer, file.name);
          setParsedDoc(parsed);
          setTOC(parsed.outline);

          // Re-load PDF for standard canvas rendering
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
        } else {
          // Plain Text or Markdown
          const text = await file.text();
          let parsed: ParsedDocument;
          if (fileExt === 'md' || fileExt === 'markdown') {
            parsed = parseMarkdown(text, file.name);
          } else {
            parsed = parseTxt(text, file.name);
          }
          setParsedDoc(parsed);
          setNumPages(parsed.pages.length);
          setTOC(parsed.outline);
          setPdfDoc(null);
        }
      } catch (err: any) {
        console.error('Document parsing error:', err);
        setError(`Failed to parse file: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    parseDocument();
  }, [file, fileName, setParsedDoc, setNumPages, setTOC]);

  // Handle PDF Canvas page rendering
  useEffect(() => {
    if (reflowMode || !pdfDoc) return;

    let renderTask: any = null;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        // Account for Retina/High-DPI displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, reflowMode]);

  // Handle mouse moves for ADHD Focus Line positioning
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!focusLine.active) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relativeY = ((e.clientY - rect.top) / rect.height) * 100;
    updateFocusLine({ positionY: relativeY });
  };

  const handleParagraphClick = (idx: number) => {
    setActiveParagraphIdx(idx === activeParagraphIdx ? null : idx);
  };

  const handleApplyParagraphHighlight = (paraText: string, idx: number) => {
    const pageHighlight = highlights.find(h => h.pageNumber === currentPage && h.rects[0]?.y === idx);
    if (pageHighlight) {
      removeHighlight(pageHighlight.id);
    } else {
      addHighlight(
        currentPage,
        [{ x: 0, y: idx, width: 100, height: 100 }], // Mock bounding rect
        paraText,
        highlightColor,
        highlightType
      );
    }
  };

  const handleApplyNote = (idx: number) => {
    const noteText = prompt("Enter a note for this paragraph:");
    if (noteText) {
      addNote(currentPage, noteText, 'inline', 50, idx * 5);
    }
  };

  // Get paragraph highlight status
  const getParaDecorationStyle = (idx: number) => {
    const pageHighlight = highlights.find(h => h.pageNumber === currentPage && h.rects[0]?.y === idx);
    if (!pageHighlight) return {};

    if (pageHighlight.type === 'highlight') {
      return { backgroundColor: pageHighlight.color };
    }
    if (pageHighlight.type === 'underline') {
      return { borderBottom: `2px solid ${pageHighlight.color || '#F59E0B'}` };
    }
    if (pageHighlight.type === 'strike') {
      return { textDecoration: 'line-through', textDecorationColor: pageHighlight.color || '#EF4444' };
    }
    return {};
  };

  const getReflowFontStyles = () => {
    let fontName = 'Georgia, serif';
    if (typography.fontFamily === 'sans-serif') fontName = 'system-ui, sans-serif';
    else if (typography.fontFamily === 'mono') fontName = 'ui-monospace, monospace';
    else if (typography.fontFamily === 'dyslexic') fontName = '"Comic Sans MS", cursive, sans-serif';

    return {
      fontFamily: fontName,
      fontSize: `${typography.fontSize}px`,
      lineHeight: typography.lineSpacing,
      wordSpacing: `${typography.wordSpacing}px`,
      letterSpacing: `${typography.letterSpacing}px`,
      textAlign: typography.alignment,
      paddingLeft: `${typography.margins}px`,
      paddingRight: `${typography.margins}px`,
      maxWidth: `${typography.maxWidth}px`,
      color: theme.text,
    };
  };

  // Build the live filters CSS string
  const getFilterStyle = () => {
    const brightnessVal = filters.brightness / 100;
    const contrastVal = filters.contrast / 100;
    const sepiaVal = filters.warmth / 100;
    const saturateVal = filters.saturation / 100;
    const opacityVal = filters.opacity / 100;

    return {
      filter: `brightness(${brightnessVal}) contrast(${contrastVal}) sepia(${sepiaVal}) saturate(${saturateVal})`,
      opacity: opacityVal,
    };
  };

  if (!file) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 text-center h-[calc(100vh-140px)]"
        style={{ color: theme.text }}
      >
        <BookOpen className="w-16 h-16 opacity-30 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">No Document Active</h2>
        <p className="text-sm opacity-80 max-w-sm">
          Please upload a PDF, EPUB, TXT, or Markdown document using the sidebar or dropzone to begin reading.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="flex-1 flex flex-col items-center justify-start overflow-y-auto relative py-10 px-4 min-h-[calc(100vh-140px)] select-text select-none cursor-default"
      style={{
        backgroundColor: theme.bg,
        transition: 'background-color 0.4s ease, color 0.4s ease',
      }}
    >
      {/* 1. OVERLAY EFFECTS */}
      {/* Soft Glare Diffuser */}
      {overlays.reducedGlare && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-radial-gradient from-transparent to-black/10 mix-blend-soft-light" />
      )}

      {/* Subtle Noise Texture */}
      {overlays.subtleNoise && (
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Paper Fiber Texture */}
      {overlays.paperTexture && (
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* Amber Blue-Light Filtering */}
      {filters.blueLight > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-20 mix-blend-multiply transition-opacity duration-300"
          style={{
            backgroundColor: `rgba(251, 191, 36, ${filters.blueLight * 0.0035})`, // Amber-400 tint overlay
          }}
        />
      )}

      {/* 2. LOADING STATE */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-40">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
          <span className="text-sm font-semibold opacity-75" style={{ color: theme.text }}>
            Parsing layout...
          </span>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {error && (
        <div className="max-w-md p-6 rounded-2xl border bg-red-500/10 text-red-500 flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10" />
          <span className="font-bold text-sm">Error Loading Page</span>
          <p className="text-xs text-center opacity-90">{error}</p>
        </div>
      )}

      {/* 4. MAIN CANVAS RENDERS */}
      {!loading && !error && (
        <div style={getFilterStyle()} className="relative transition-opacity duration-300">
          
          {/* STANDARD LAYOUT (Pixel Perfect PDF Canvas) */}
          {!reflowMode && pdfDoc && (
            <div className="shadow-2xl rounded-lg overflow-hidden border relative" style={{ borderColor: theme.border }}>
              <canvas ref={canvasRef} className="block select-none" />
              
              {/* Sticky Notes indicators drawn absolutely */}
              {notes
                .filter(n => n.pageNumber === currentPage && n.type === 'sticky')
                .map(note => (
                  <div
                    key={note.id}
                    className="absolute p-2 bg-amber-200 text-amber-950 rounded-lg text-[10px] max-w-[120px] shadow-md border border-amber-300 select-text"
                    style={{ left: `${note.x || 10}%`, top: `${note.y || 10}%` }}
                  >
                    {note.text}
                  </div>
                ))}
            </div>
          )}

          {/* SMART REFLOW LAYOUT (Kindle / E-book Mode) */}
          {(reflowMode || !pdfDoc) && parsedDoc && parsedDoc.pages[currentPage - 1] && (
            <motion.div
              ref={reflowContainerRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-1.5 select-text"
              style={getReflowFontStyles()}
            >
              {parsedDoc.pages[currentPage - 1].paragraphs.map((paraText, idx) => {
                const isFocused = activeParagraphIdx === idx;
                const isDimmed = readingMode === 'focus' && activeParagraphIdx !== null && !isFocused;
                const decoratorStyles = getParaDecorationStyle(idx);

                return (
                  <div
                    key={idx}
                    onClick={() => handleParagraphClick(idx)}
                    className={`relative p-3.5 rounded-xl transition-all cursor-pointer select-text ${
                      isDimmed ? 'opacity-25' : 'opacity-100'
                    } ${isFocused ? 'bg-black/5 dark:bg-white/5 ring-1 ring-neutral-400/20' : ''}`}
                    style={{
                      marginBottom: `${typography.paragraphSpacing}px`,
                      ...decoratorStyles,
                    }}
                  >
                    {paraText}

                    {/* Paragraph Control popover when clicked/focused */}
                    <AnimatePresence>
                      {isFocused && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute -top-11 left-4 flex gap-1.5 p-1 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl z-30 pointer-events-auto"
                        >
                          {/* Highlight Actions */}
                          <button
                            onClick={() => { setHighlightType('highlight'); handleApplyParagraphHighlight(paraText, idx); }}
                            className="p-1.5 hover:bg-neutral-800 rounded-lg text-yellow-400"
                            title="Highlight Text"
                          >
                            <Highlighter className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => { setHighlightType('underline'); handleApplyParagraphHighlight(paraText, idx); }}
                            className="p-1.5 hover:bg-neutral-800 rounded-lg text-emerald-400 text-xs font-bold underline"
                            title="Underline text"
                          >
                            U
                          </button>

                          <button
                            onClick={() => { setHighlightType('strike'); handleApplyParagraphHighlight(paraText, idx); }}
                            className="p-1.5 hover:bg-neutral-800 rounded-lg text-red-400 text-xs font-bold line-through"
                            title="Strike text"
                          >
                            S
                          </button>

                          <div className="w-[1px] bg-neutral-800 my-1" />

                          {/* Sticky Note */}
                          <button
                            onClick={() => handleApplyNote(idx)}
                            className="p-1.5 hover:bg-neutral-800 rounded-lg text-blue-400"
                            title="Add note"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Inline notes display under the paragraph */}
                    {notes
                      .filter(n => n.pageNumber === currentPage && n.type === 'inline' && n.y === idx * 5)
                      .map(note => (
                        <div
                          key={note.id}
                          className="mt-2 p-2.5 rounded-lg border text-[11px] bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300 font-sans italic"
                        >
                          <strong>Note:</strong> {note.text}
                        </div>
                      ))}
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* 5. ADHD FOCUS LINE (Ruler overlay) */}
      {focusLine.active && (
        <div
          className="fixed left-0 right-0 pointer-events-none z-30 bg-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all ease-out"
          style={{
            top: `${focusLine.positionY}vh`,
            height: `${focusLine.thickness}px`,
            mixBlendMode: 'multiply',
          }}
        />
      )}
    </div>
  );
};
