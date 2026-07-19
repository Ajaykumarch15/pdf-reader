import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, FileText } from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';

interface SearchMatch {
  id: string;
  pageNumber: number;
  paragraphIndex: number;
  text: string;
  preview: string;
}

export const SearchPanel: React.FC = () => {
  const { theme, parsedDoc, setCurrentPage } = useReaderStore();
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);

  // Perform search whenever the query or the document changes
  useEffect(() => {
    if (!parsedDoc || !query.trim() || query.length < 2) {
      setMatches([]);
      setCurrentMatchIdx(-1);
      return;
    }

    const searchResults: SearchMatch[] = [];
    const searchRegex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');

    parsedDoc.pages.forEach((page) => {
      page.paragraphs.forEach((para, paraIdx) => {
        if (searchRegex.test(para)) {
          // Extract a snippet containing the match
          const matchPos = para.toLowerCase().indexOf(query.toLowerCase());
          const start = Math.max(0, matchPos - 40);
          const end = Math.min(para.length, matchPos + query.length + 40);
          let snippet = para.substring(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < para.length) snippet = snippet + '...';

          searchResults.push({
            id: `${page.pageNumber}-${paraIdx}-${matchPos}`,
            pageNumber: page.pageNumber,
            paragraphIndex: paraIdx,
            text: para,
            preview: snippet,
          });
        }
      });
    });

    setMatches(searchResults);
    
    // Select first match if available
    if (searchResults.length > 0) {
      setCurrentMatchIdx(0);
    } else {
      setCurrentMatchIdx(-1);
    }
  }, [query, parsedDoc]);

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % matches.length;
    setCurrentMatchIdx(nextIdx);
    setCurrentPage(matches[nextIdx].pageNumber);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + matches.length) % matches.length;
    setCurrentMatchIdx(prevIdx);
    setCurrentPage(matches[prevIdx].pageNumber);
  };

  const handleMatchClick = (match: SearchMatch, idx: number) => {
    setCurrentMatchIdx(idx);
    setCurrentPage(match.pageNumber);
  };

  const highlightMatch = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-400 text-neutral-900 rounded-sm px-0.5 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-sm h-full overflow-hidden">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" style={{ color: theme.text }} />
        <input
          type="text"
          placeholder="Search document text..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-12 py-2 rounded-xl border text-xs bg-transparent focus:outline-none"
          style={{ borderColor: theme.border, color: theme.text }}
        />
        {matches.length > 0 && (
          <span className="absolute right-3 top-2.5 text-[10px] opacity-60 font-mono">
            {currentMatchIdx + 1}/{matches.length}
          </span>
        )}
      </div>

      {/* Navigator Controls */}
      {matches.length > 0 && (
        <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded-xl border" style={{ borderColor: theme.border }}>
          <span className="text-xs opacity-80 font-medium">Navigate Matches</span>
          <div className="flex gap-1.5">
            <button
              onClick={handlePrevMatch}
              className="p-1 rounded-lg border hover:bg-neutral-500/10 transition-colors"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMatch}
              className="p-1 rounded-lg border hover:bg-neutral-500/10 transition-colors"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <hr className="opacity-10 my-1" style={{ borderColor: theme.border }} />

      {/* Matches List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
        {!parsedDoc ? (
          <div className="text-center py-8 opacity-60 flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <span className="text-xs font-semibold">Document Not Loaded</span>
            <p className="text-[11px] max-w-xs px-4">Upload a document to search and index text.</p>
          </div>
        ) : query.length < 2 ? (
          <div className="text-center py-8 opacity-60 flex flex-col items-center gap-2">
            <Search className="w-8 h-8 text-neutral-400" />
            <span className="text-xs font-medium">Start Typing</span>
            <p className="text-[11px]">Type at least 2 characters to search page contents.</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 opacity-60 flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-neutral-400" />
            <span className="text-xs font-medium">No results found</span>
            <p className="text-[11px]">Try modifying your search keywords.</p>
          </div>
        ) : (
          matches.map((match, idx) => {
            const isSelected = idx === currentMatchIdx;
            return (
              <div
                key={match.id}
                onClick={() => handleMatchClick(match, idx)}
                className="group flex flex-col p-3 rounded-xl border border-transparent hover:border-neutral-500/20 cursor-pointer transition-all text-left"
                style={{
                  backgroundColor: isSelected ? `${theme.accent}15` : 'transparent',
                  borderColor: isSelected ? `${theme.accent}40` : undefined,
                }}
              >
                <div className="flex justify-between items-center mb-1.5 text-[10px] opacity-75 font-semibold">
                  <span className="text-amber-500">Page {match.pageNumber}</span>
                  <span className="opacity-60">Snippet {idx + 1}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90 break-words">
                  {highlightMatch(match.preview)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
