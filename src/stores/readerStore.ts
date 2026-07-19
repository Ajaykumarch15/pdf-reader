import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ReadingMode,
  Theme,
  FilterSettings,
  TypographySettings,
  OverlaySettings,
  Bookmark,
  Note,
  Highlight,
  ReadingStats,
  PomodoroState,
} from '../types';
import { DEFAULT_THEMES } from '../features/themes/defaultThemes';

import type { ParsedDocument } from '../utils/documentParser';

interface ReaderState {
  // Document state (non-persistent)
  file: File | null;
  fileName: string | null;
  numPages: number;
  currentPage: number;
  reflowMode: boolean;
  toc: { title: string; dest?: any; pageNumber?: number; items?: any[] }[];
  parsedDoc: ParsedDocument | null;

  // Persistent settings and annotations
  readingMode: ReadingMode;
  theme: Theme;
  customThemes: Theme[];
  filters: FilterSettings;
  typography: TypographySettings;
  overlays: OverlaySettings;
  bookmarks: Bookmark[];
  notes: Note[];
  highlights: Highlight[];
  stats: ReadingStats;
  focusLine: {
    active: boolean;
    positionY: number; // percentage from top of page/screen (e.g. 50)
    thickness: number; // in px
  };
  blinkReminderActive: boolean;
  rule202020Active: boolean;
  autoBrightnessActive: boolean;
  adaptiveWarmthActive: boolean;
  pomodoroActive: boolean; // pomodoro option enabled

  // Transient pomodoro state (non-persistent)
  pomodoro: PomodoroState;

  // Actions
  setFile: (file: File | null, fileName: string | null) => void;
  setParsedDoc: (doc: ParsedDocument | null) => void;
  setNumPages: (numPages: number) => void;
  setCurrentPage: (page: number) => void;
  setTOC: (toc: any[]) => void;
  toggleReflowMode: () => void;
  setReadingMode: (mode: ReadingMode) => void;
  setTheme: (theme: Theme) => void;
  addCustomTheme: (theme: Theme) => void;
  deleteCustomTheme: (id: string) => void;
  updateFilters: (filters: Partial<FilterSettings>) => void;
  updateTypography: (typography: Partial<TypographySettings>) => void;
  updateOverlays: (overlays: Partial<OverlaySettings>) => void;
  
  // Bookmarks
  addBookmark: (pageNumber: number, label: string) => void;
  removeBookmark: (id: string) => void;
  
  // Notes
  addNote: (pageNumber: number, text: string, type: 'sticky' | 'margin' | 'inline', x?: number, y?: number) => void;
  updateNote: (id: string, text: string) => void;
  removeNote: (id: string) => void;
  
  // Highlights
  addHighlight: (pageNumber: number, rects: any[], text: string, color: string, type: 'highlight' | 'underline' | 'strike') => void;
  removeHighlight: (id: string) => void;
  
  // Stats
  addReadingTime: (seconds: number) => void;
  markPageRead: (pageNumber: number) => void;
  resetStats: () => void;

  // Focus line
  updateFocusLine: (focusLine: Partial<{ active: boolean; positionY: number; thickness: number }>) => void;
  
  // Reminders
  setBlinkReminder: (active: boolean) => void;
  setRule202020: (active: boolean) => void;
  setAutoBrightness: (active: boolean) => void;
  setAdaptiveWarmth: (active: boolean) => void;
  setPomodoroActive: (active: boolean) => void;
  updatePomodoro: (state: Partial<PomodoroState>) => void;
  resetReaderState: () => void;
}

const defaultFilters: FilterSettings = {
  brightness: 100,
  contrast: 100,
  warmth: 0,
  saturation: 100,
  blueLight: 0,
  gamma: 1.0,
  opacity: 100,
};

const defaultTypography: TypographySettings = {
  fontFamily: 'serif',
  fontSize: 18,
  lineSpacing: 1.6,
  paragraphSpacing: 24,
  margins: 48,
  maxWidth: 800,
  wordSpacing: 1,
  letterSpacing: 0,
  alignment: 'left',
};

const defaultOverlays: OverlaySettings = {
  paperTexture: false,
  subtleNoise: false,
  reducedGlare: false,
  adaptiveBrightness: false,
  adaptiveWarmth: false,
};

const defaultStats: ReadingStats = {
  totalSeconds: 0,
  pagesRead: [],
  streak: 0,
  lastReadDate: '',
};

const defaultPomodoro: PomodoroState = {
  isActive: false,
  mode: 'focus',
  timeLeft: 25 * 60,
  duration: 25 * 60,
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      // Non-persistent initial state
      file: null,
      fileName: null,
      numPages: 0,
      currentPage: 1,
      reflowMode: false,
      toc: [],
      parsedDoc: null,
      pomodoro: defaultPomodoro,

      // Persistent properties
      readingMode: 'standard',
      theme: DEFAULT_THEMES[0],
      customThemes: [],
      filters: defaultFilters,
      typography: defaultTypography,
      overlays: defaultOverlays,
      bookmarks: [],
      notes: [],
      highlights: [],
      stats: defaultStats,
      focusLine: {
        active: false,
        positionY: 40,
        thickness: 40,
      },
      blinkReminderActive: true,
      rule202020Active: false,
      autoBrightnessActive: false,
      adaptiveWarmthActive: false,
      pomodoroActive: false,

      // Actions
      setFile: (file, fileName) => set({ file, fileName, currentPage: 1, reflowMode: false, toc: [], parsedDoc: null }),
      setParsedDoc: (parsedDoc) => set({ parsedDoc }),
      setNumPages: (numPages) => set({ numPages }),
      setCurrentPage: (currentPage) => {
        const { numPages } = get();
        const clampedPage = Math.max(1, Math.min(currentPage, numPages || 1));
        set({ currentPage: clampedPage });
        get().markPageRead(clampedPage);
      },
      setTOC: (toc) => set({ toc }),
      toggleReflowMode: () => set((state) => ({ reflowMode: !state.reflowMode })),
      setReadingMode: (readingMode) => {
        set({ readingMode });
        // Auto-configure features based on mode
        if (readingMode === 'night') {
          // Find dark mode theme
          const darkTheme = DEFAULT_THEMES.find(t => t.id === 'dark') || DEFAULT_THEMES[4];
          set({ theme: darkTheme });
        } else if (readingMode === 'zen') {
          // Zen mode doesn't change theme, but hides UI
        }
      },
      setTheme: (theme) => set({ theme }),
      addCustomTheme: (newTheme) => set((state) => ({ customThemes: [...state.customThemes, newTheme] })),
      deleteCustomTheme: (id) => set((state) => ({
        customThemes: state.customThemes.filter((t) => t.id !== id),
        theme: state.theme.id === id ? DEFAULT_THEMES[0] : state.theme,
      })),
      updateFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      updateTypography: (newTypography) => set((state) => ({ typography: { ...state.typography, ...newTypography } })),
      updateOverlays: (newOverlays) => set((state) => ({ overlays: { ...state.overlays, ...newOverlays } })),
      
      // Bookmarks
      addBookmark: (pageNumber, label) => set((state) => {
        // Prevent duplicate bookmark for the same page
        if (state.bookmarks.some(b => b.pageNumber === pageNumber)) return {};
        const newBookmark: Bookmark = {
          id: Math.random().toString(36).substring(2, 9),
          pageNumber,
          label: label || `Page ${pageNumber}`,
          createdAt: Date.now(),
        };
        return { bookmarks: [...state.bookmarks, newBookmark].sort((a, b) => a.pageNumber - b.pageNumber) };
      }),
      removeBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      })),

      // Notes
      addNote: (pageNumber, text, type, x, y) => set((state) => {
        const newNote: Note = {
          id: Math.random().toString(36).substring(2, 9),
          pageNumber,
          text,
          type,
          x,
          y,
          createdAt: Date.now(),
        };
        return { notes: [...state.notes, newNote] };
      }),
      updateNote: (id, text) => set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, text } : n)),
      })),
      removeNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      })),

      // Highlights
      addHighlight: (pageNumber, rects, text, color, type) => set((state) => {
        const newHighlight: Highlight = {
          id: Math.random().toString(36).substring(2, 9),
          pageNumber,
          rects,
          text,
          color,
          type,
          createdAt: Date.now(),
        };
        return { highlights: [...state.highlights, newHighlight] };
      }),
      removeHighlight: (id) => set((state) => ({
        highlights: state.highlights.filter((h) => h.id !== id),
      })),

      // Stats
      addReadingTime: (seconds) => set((state) => {
        const updatedSeconds = state.stats.totalSeconds + seconds;
        
        // Handle streaks
        const today = new Date().toISOString().split('T')[0];
        let newStreak = state.stats.streak;
        
        if (state.stats.lastReadDate !== today) {
          if (state.stats.lastReadDate === '') {
            newStreak = 1;
          } else {
            const lastDate = new Date(state.stats.lastReadDate);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              newStreak += 1;
            } else if (diffDays > 1) {
              newStreak = 1; // Streak broken
            }
          }
        }
        
        return {
          stats: {
            ...state.stats,
            totalSeconds: updatedSeconds,
            streak: newStreak,
            lastReadDate: today,
          },
        };
      }),
      markPageRead: (pageNumber) => set((state) => {
        if (state.stats.pagesRead.includes(pageNumber)) return {};
        return {
          stats: {
            ...state.stats,
            pagesRead: [...state.stats.pagesRead, pageNumber],
          },
        };
      }),
      resetStats: () => set({ stats: defaultStats }),

      // Focus line
      updateFocusLine: (updates) => set((state) => ({
        focusLine: { ...state.focusLine, ...updates },
      })),

      // Reminders
      setBlinkReminder: (blinkReminderActive) => set({ blinkReminderActive }),
      setRule202020: (rule202020Active) => set({ rule202020Active }),
      setAutoBrightness: (autoBrightnessActive) => set({ autoBrightnessActive }),
      setAdaptiveWarmth: (adaptiveWarmthActive) => set({ adaptiveWarmthActive }),
      setPomodoroActive: (pomodoroActive) => set({ pomodoroActive }),
      updatePomodoro: (pomodoroUpdates) => set((state) => ({
        pomodoro: { ...state.pomodoro, ...pomodoroUpdates },
      })),

      resetReaderState: () => set({
        readingMode: 'standard',
        theme: DEFAULT_THEMES[0],
        filters: defaultFilters,
        typography: defaultTypography,
        overlays: defaultOverlays,
        bookmarks: [],
        notes: [],
        highlights: [],
        stats: defaultStats,
        focusLine: { active: false, positionY: 40, thickness: 40 },
        blinkReminderActive: true,
        rule202020Active: false,
        autoBrightnessActive: false,
        adaptiveWarmthActive: false,
        pomodoroActive: false,
        pomodoro: defaultPomodoro,
      }),
    }),
    {
      name: 'comfort-reader-storage',
      storage: createJSONStorage(() => localStorage),
      // Partialize state to ONLY persist configurations, statistics, and annotations.
      // Exclude File handle, total page count, current document, TOC, and active timer ticking.
      partialize: (state) => ({
        readingMode: state.readingMode,
        theme: state.theme,
        customThemes: state.customThemes,
        filters: state.filters,
        typography: state.typography,
        overlays: state.overlays,
        bookmarks: state.bookmarks,
        notes: state.notes,
        highlights: state.highlights,
        stats: state.stats,
        focusLine: state.focusLine,
        blinkReminderActive: state.blinkReminderActive,
        rule202020Active: state.rule202020Active,
        autoBrightnessActive: state.autoBrightnessActive,
        adaptiveWarmthActive: state.adaptiveWarmthActive,
        pomodoroActive: state.pomodoroActive,
      }),
    }
  )
);
