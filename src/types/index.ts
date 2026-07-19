export type ReadingMode = 'standard' | 'focus' | 'zen' | 'night' | 'study';

export interface Theme {
  id: string;
  name: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
  isDark: boolean;
  isCustom?: boolean;
}

export interface FilterSettings {
  brightness: number;     // 50 to 150 (percentage)
  contrast: number;       // 50 to 150 (percentage)
  warmth: number;         // 0 to 100 (percentage sepia/warmth overlay)
  saturation: number;     // 0 to 200 (percentage)
  blueLight: number;      // 0 to 100 (percentage blue light block)
  gamma: number;          // 0.5 to 1.5
  opacity: number;        // 50 to 100 (canvas opacity)
}

export interface TypographySettings {
  fontFamily: 'serif' | 'sans-serif' | 'dyslexic' | 'mono';
  fontSize: number;         // in px, e.g., 14 to 32
  lineSpacing: number;      // line-height multiplier, e.g., 1.2 to 2.5
  paragraphSpacing: number; // margin-bottom in px, e.g., 8 to 40
  margins: number;          // padding left/right in px, e.g., 16 to 128
  maxWidth: number;         // max width of reading line, e.g., 600 to 1200 px
  wordSpacing: number;      // extra spacing in px, e.g., 0 to 10
  letterSpacing: number;    // extra letter spacing in px, e.g., -1 to 5
  alignment: 'left' | 'justify' | 'center';
}

export interface OverlaySettings {
  paperTexture: boolean;
  subtleNoise: boolean;
  reducedGlare: boolean;
  adaptiveBrightness: boolean;
  adaptiveWarmth: boolean;
}

export interface Bookmark {
  id: string;
  pageNumber: number;
  label: string;
  createdAt: number;
}

export interface Note {
  id: string;
  pageNumber: number;
  text: string;
  x?: number; // relative percentage coordinates for PDF placement
  y?: number;
  type: 'sticky' | 'margin' | 'inline';
  createdAt: number;
}

export interface Highlight {
  id: string;
  pageNumber: number;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
  text: string;
  color: string; // hex or tailwind class
  type: 'highlight' | 'underline' | 'strike';
  createdAt: number;
}

export interface ReadingStats {
  totalSeconds: number;
  pagesRead: number[]; // array of page numbers read
  streak: number;
  lastReadDate: string; // YYYY-MM-DD
}

export interface PomodoroState {
  isActive: boolean;
  mode: 'focus' | 'break';
  timeLeft: number; // in seconds
  duration: number; // in seconds
}
