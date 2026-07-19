import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flame, Calendar, SlidersHorizontal, Type, StickyNote } from 'lucide-react';
import { useReaderStore } from '../stores/readerStore';
import { useAdaptiveControls } from '../hooks/useAdaptiveControls';
import { useReadingTimer } from '../hooks/useReadingTimer';
import { TopToolbar } from '../features/toolbar/TopToolbar';
import { ThemeCustomizer } from '../features/themes/ThemeCustomizer';
import { TypographyControls } from '../features/toolbar/TypographyControls';
import { BookmarksPanel } from '../features/bookmarks/BookmarksPanel';
import { NotesPanel } from '../features/notes/NotesPanel';
import { SearchPanel } from '../features/search/SearchPanel';
import { ReaderCanvas } from '../features/reader/ReaderCanvas';
import { ComfortReminders } from '../components/ComfortReminders';

interface MainLayoutProps {
  onBackHome: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onBackHome }) => {
  const {
    theme,
    currentPage,
    numPages,
    setCurrentPage,
    toc,
    stats,
  } = useReaderStore();

  // Run adaptive eye-care settings and timers
  useAdaptiveControls();
  const { activeAlert, dismissAlert } = useReadingTimer();

  const [activeLeftPanel, setActiveLeftPanel] = useState<'toc' | 'bookmarks' | 'search' | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [rightTab, setRightTab] = useState<'theme' | 'typography' | 'notes'>('theme');

  const handleToggleLeftPanel = (panel: 'toc' | 'bookmarks' | 'search' | null) => {
    setActiveLeftPanel(panel);
  };

  const handleToggleRightSidebar = () => {
    setRightSidebarOpen((isOpen) => !isOpen);
  };

  // Calculate estimated completion time
  // Assume an average reader takes ~60 seconds per page
  const getEstimatedTimeRemaining = () => {
    if (!numPages) return '0 min';
    const remainingPages = Math.max(0, numPages - currentPage);
    const minutes = Math.ceil(remainingPages * 1.2); // 1.2 min per page average
    if (minutes > 60) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hrs} hr ${mins} min`;
    }
    return `${minutes} min`;
  };

  const handlePageScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(parseInt(e.target.value));
  };

  const progressPercentage = numPages > 0 ? (currentPage / numPages) * 100 : 0;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setActiveLeftPanel('search');
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentPage(currentPage - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentPage(currentPage + 1);
      } else if (event.key === 'Escape') {
        setActiveLeftPanel(null);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [currentPage, setCurrentPage]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden font-sans antialiased select-none"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        transition: 'background-color 0.4s ease, color 0.4s ease',
      }}
    >
      {/* 1. TOP TOOLBAR — always available */}
      <TopToolbar
        onToggleLeftSidebar={handleToggleLeftPanel}
        onToggleRightSidebar={handleToggleRightSidebar}
        onBackHome={onBackHome}
        activeLeftPanel={activeLeftPanel}
        rightSidebarOpen={rightSidebarOpen}
      />

      {/* 2. BODY COMPONENT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR (TOC / Bookmarks / Search) */}
        {activeLeftPanel && (
          <div
            className="w-72 border-r flex flex-col shrink-0 overflow-hidden transition-all duration-300"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.isDark ? '#1C1C1E' : '#FAF9F5',
            }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
              <span className="font-bold text-xs uppercase tracking-wider" style={{ color: theme.isDark ? '#FFF' : '#333' }}>
                {activeLeftPanel === 'toc' && 'Table of Contents'}
                {activeLeftPanel === 'bookmarks' && 'Saved Bookmarks'}
                {activeLeftPanel === 'search' && 'Document Index'}
              </span>
              <button
                onClick={() => setActiveLeftPanel(null)}
                className="text-[10px] hover:underline"
              >
                Close
              </button>
            </div>

            {/* Left Side Content */}
            <div className="flex-1 overflow-y-auto">
              {activeLeftPanel === 'toc' && (
                <div className="p-3 flex flex-col gap-1.5">
                  {toc.length === 0 ? (
                    <div className="text-center py-8 opacity-60 text-xs">
                      No document outlines detected.
                    </div>
                  ) : (
                    toc.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => item.pageNumber && setCurrentPage(item.pageNumber)}
                        disabled={!item.pageNumber}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex justify-between items-center ${
                          item.pageNumber === currentPage ? 'font-bold bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        style={{ color: theme.text }}
                      >
                        <span className="truncate pr-4">{item.title}</span>
                        {item.pageNumber && (
                          <span className="text-[10px] opacity-60 shrink-0 font-mono">P. {item.pageNumber}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
              {activeLeftPanel === 'bookmarks' && <BookmarksPanel />}
              {activeLeftPanel === 'search' && <SearchPanel />}
            </div>
          </div>
        )}

        {/* MAIN CANVA AREA */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <ReaderCanvas />
        </div>

        {/* RIGHT SIDEBAR (Visual Settings / Spacing / Notes) */}
        {rightSidebarOpen && (
          <aside
            className="w-80 border-l flex flex-col shrink-0 overflow-hidden shadow-[-14px_0_30px_rgba(0,0,0,0.035)] transition-all duration-300"
            style={{
              borderColor: theme.border,
              background: theme.isDark
                ? 'linear-gradient(180deg, #222225 0%, #1C1C1E 100%)'
                : 'linear-gradient(180deg, #FFFEFC 0%, #F7F4EE 100%)',
            }}
          >
            {/* Sidebar header and tabs */}
            <div className="px-4 pt-5 pb-3 shrink-0 border-b" style={{ borderColor: theme.border }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500">Reading studio</p>
              <div className="mt-1 flex items-baseline justify-between">
                <h2 className="text-base font-bold tracking-tight" style={{ color: theme.text }}>Fine-tune your read</h2>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ backgroundColor: `${theme.accent}18`, color: theme.accent }}>LIVE</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl p-1.5" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.055)' : 'rgba(45,35,20,0.055)' }}>
                {[
                  { id: 'theme' as const, label: 'Display', icon: SlidersHorizontal },
                  { id: 'typography' as const, label: 'Type', icon: Type },
                  { id: 'notes' as const, label: 'Notes', icon: StickyNote },
                ].map(({ id, label, icon: Icon }) => {
                  const selected = rightTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setRightTab(id)}
                      aria-pressed={selected}
                      className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-all duration-200 hover:-translate-y-px"
                      style={{
                        backgroundColor: selected ? theme.bg : 'transparent',
                        boxShadow: selected ? '0 3px 10px rgba(0,0,0,0.08)' : 'none',
                        color: selected ? theme.accent : theme.text,
                        opacity: selected ? 1 : 0.62,
                      }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={selected ? 2.5 : 2} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side Contents */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {rightTab === 'theme' && <ThemeCustomizer />}
              {rightTab === 'typography' && <TypographyControls />}
              {rightTab === 'notes' && <NotesPanel />}
            </div>
          </aside>
        )}
      </div>

      {/* 3. BOTTOM PANEL (Progress, Pages, Streaks) */}
      <div
          className="h-14 border-t px-6 flex items-center justify-between shrink-0 select-none text-xs"
          style={{
            backgroundColor: theme.bg,
            borderColor: theme.border,
            color: theme.text,
            transition: 'background-color 0.4s ease, border-color 0.4s ease',
          }}
        >
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border hover:bg-neutral-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ borderColor: theme.border }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold select-none">
              Page {currentPage} of {numPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-1.5 rounded-lg border hover:bg-neutral-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ borderColor: theme.border }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Slider Bar */}
          <div className="flex-1 max-w-xl mx-8 flex items-center gap-3">
            <input
              type="range"
              min="1"
              max={numPages || 1}
              value={currentPage}
              onChange={handlePageScrub}
              className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono text-[10px] font-bold opacity-75">{progressPercentage.toFixed(0)}%</span>
          </div>

          {/* Statistics and streak */}
          <div className="flex items-center gap-5 font-semibold text-[11px]">
            <span className="flex items-center gap-1 opacity-85">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Remaining: <strong className="font-bold">{getEstimatedTimeRemaining()}</strong>
            </span>
            <span className="flex items-center gap-1 opacity-85" title="Consecutive days read">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              Streak: <strong className="font-bold text-red-500">{stats.streak || 1} day</strong>
            </span>
            <span className="flex items-center gap-1 opacity-85">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Read: <strong className="font-bold">{stats.pagesRead.length} pgs</strong>
            </span>
          </div>
      </div>

      {/* 4. COMFORT REMINDERS MODAL */}
      <ComfortReminders activeAlert={activeAlert} onDismiss={dismissAlert} />
    </div>
  );
};
export default MainLayout;
