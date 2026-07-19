import React, { useRef } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Layout,
  Focus,
  Settings,
  Bookmark,
  Search,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  FileUp
} from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';

interface TopToolbarProps {
  onToggleLeftSidebar: (panel: 'toc' | 'bookmarks' | 'search' | null) => void;
  onToggleRightSidebar: () => void;
  onBackHome: () => void;
  activeLeftPanel: 'toc' | 'bookmarks' | 'search' | null;
  rightSidebarOpen: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onBackHome,
  activeLeftPanel,
  rightSidebarOpen,
}) => {
  const {
    file,
    fileName,
    setFile,
    reflowMode,
    toggleReflowMode,
    readingMode,
    setReadingMode,
    theme,
    focusLine,
    updateFocusLine,
    pomodoroActive,
    setPomodoroActive,
    pomodoro,
    updatePomodoro,
  } = useReaderStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tick Pomodoro timer locally or sync actions
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile, selectedFile.name);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const togglePomodoroActiveState = () => {
    updatePomodoro({ isActive: !pomodoro.isActive });
  };

  const resetPomodoroState = () => {
    updatePomodoro({
      isActive: false,
      mode: 'focus',
      timeLeft: 25 * 60,
      duration: 25 * 60,
    });
  };

  return (
    <div
      className="h-16 border-b px-6 flex items-center justify-between gap-4 select-none shrink-0"
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.border,
        color: theme.text,
        transition: 'background-color 0.4s ease, border-color 0.4s ease',
      }}
    >
      {/* 1. Brand / File Loading */}
      <div className="flex items-center gap-3 min-w-[200px] max-w-[30%]">
        <button
          type="button"
          onClick={onBackHome}
          className="flex items-center justify-center p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95 shrink-0"
          style={{ borderColor: theme.border, color: theme.text }}
          title="Back to home"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={triggerUpload}
          className="flex items-center justify-center p-2 rounded-xl border cursor-pointer transition-all active:scale-95 shrink-0"
          style={{
            borderColor: `${theme.accent}80`,
            backgroundColor: `${theme.accent}14`,
            color: theme.accent,
          }}
          title="Upload a PDF"
        >
          <FileUp className="w-4 h-4" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf,.pdf"
          className="hidden"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm tracking-tight truncate leading-none" style={{ color: theme.text }}>
            {fileName || 'ComfortReader'}
          </span>
          <span className="text-[10px] opacity-75 truncate mt-1">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Effortless reading'}
          </span>
        </div>
      </div>

      {/* 2. Reading Options (Standard vs Reflow, ADHD ruler, Pomodoro) */}
      <div className="flex items-center gap-3">
        {/* Reflow Toggle */}
        {file && (
          <button
            onClick={toggleReflowMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              borderColor: reflowMode ? theme.accent : theme.border,
              backgroundColor: reflowMode ? `${theme.accent}15` : 'transparent',
              color: reflowMode ? theme.accent : theme.text,
            }}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>{reflowMode ? 'Smart Reflow Active' : 'Pixel-Perfect view'}</span>
          </button>
        )}

        {/* ADHD Focus Line Control */}
        {file && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ borderColor: theme.border }}>
            <button
              onClick={() => updateFocusLine({ active: !focusLine.active })}
              className="text-xs font-semibold hover:opacity-85 transition-opacity flex items-center gap-1"
              style={{ color: focusLine.active ? theme.accent : theme.text }}
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Ruler</span>
            </button>
            {focusLine.active && (
              <input
                type="range"
                min="20"
                max="80"
                value={focusLine.thickness}
                onChange={(e) => updateFocusLine({ thickness: parseInt(e.target.value) })}
                className="w-12 h-1 accent-amber-500 rounded bg-neutral-300 dark:bg-neutral-700 cursor-pointer ml-1"
                title="Ruler height"
              />
            )}
          </div>
        )}

        {/* Pomodoro Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: theme.border }}>
          <button
            onClick={() => setPomodoroActive(!pomodoroActive)}
            className="text-xs font-semibold hover:opacity-85 transition-opacity"
            style={{ color: pomodoroActive ? theme.accent : theme.text }}
          >
            Pomodoro
          </button>

          {pomodoroActive && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-300 dark:border-neutral-700 text-xs">
              <span
                className={`font-mono font-bold ${
                  pomodoro.mode === 'break' ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {formatTime(pomodoro.timeLeft)}
              </span>
              <button
                onClick={togglePomodoroActiveState}
                className="p-0.5 rounded hover:bg-neutral-500/10 text-neutral-400"
              >
                {pomodoro.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                onClick={resetPomodoroState}
                className="p-0.5 rounded hover:bg-neutral-500/10 text-neutral-400"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Zen Mode Button */}
        {file && (
          <button
            onClick={() => setReadingMode(readingMode === 'zen' ? 'standard' : 'zen')}
            className={`p-2 rounded-xl border hover:scale-[1.02] active:scale-[0.98] transition-all`}
            style={{
              borderColor: readingMode === 'zen' ? theme.accent : theme.border,
              backgroundColor: readingMode === 'zen' ? `${theme.accent}15` : 'transparent',
              color: readingMode === 'zen' ? theme.accent : theme.text,
            }}
            title="Toggle Zen Mode"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Panel toggles */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleLeftSidebar(activeLeftPanel === 'toc' ? null : 'toc')}
          className={`p-2 rounded-xl border transition-all ${
            activeLeftPanel === 'toc' ? 'ring-1' : ''
          }`}
          style={{
            borderColor: activeLeftPanel === 'toc' ? theme.accent : theme.border,
            color: activeLeftPanel === 'toc' ? theme.accent : theme.text,
          }}
          title="Table of Contents"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        <button
          onClick={() => onToggleLeftSidebar(activeLeftPanel === 'bookmarks' ? null : 'bookmarks')}
          className={`p-2 rounded-xl border transition-all ${
            activeLeftPanel === 'bookmarks' ? 'ring-1' : ''
          }`}
          style={{
            borderColor: activeLeftPanel === 'bookmarks' ? theme.accent : theme.border,
            color: activeLeftPanel === 'bookmarks' ? theme.accent : theme.text,
          }}
          title="Bookmarks"
        >
          <Bookmark className="w-4 h-4" />
        </button>

        <button
          onClick={() => onToggleLeftSidebar(activeLeftPanel === 'search' ? null : 'search')}
          className={`p-2 rounded-xl border transition-all ${
            activeLeftPanel === 'search' ? 'ring-1' : ''
          }`}
          style={{
            borderColor: activeLeftPanel === 'search' ? theme.accent : theme.border,
            color: activeLeftPanel === 'search' ? theme.accent : theme.text,
          }}
          title="Search Text"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="w-[1px] bg-neutral-300 dark:bg-neutral-800 h-6 mx-1" />

        <button
          onClick={onToggleRightSidebar}
          className={`p-2 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
            rightSidebarOpen ? 'ring-1' : ''
          }`}
          style={{
            borderColor: rightSidebarOpen ? theme.accent : theme.border,
            color: rightSidebarOpen ? theme.accent : theme.text,
          }}
          title="Toggle reader settings"
        >
          <Settings className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
