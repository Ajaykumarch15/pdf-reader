import React from 'react';
import { Type, AlignLeft, AlignJustify, AlignCenter, Minus, Plus } from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';

export const TypographyControls: React.FC = () => {
  const { theme, typography, updateTypography, reflowMode } = useReaderStore();

  const fontFamilies = [
    { id: 'serif', name: 'Elegant Serif' },
    { id: 'sans-serif', name: 'Modern Sans' },
    { id: 'mono', name: 'Monospace Code' },
    { id: 'dyslexic', name: 'Open Dyslexia' },
  ] as const;

  const alignments = [
    { id: 'left', icon: AlignLeft, label: 'Left align' },
    { id: 'justify', icon: AlignJustify, label: 'Justify' },
    { id: 'center', icon: AlignCenter, label: 'Center' },
  ] as const;

  if (!reflowMode) {
    return (
      <div className="p-6 text-center opacity-70 flex flex-col items-center justify-center h-48 gap-3">
        <Type className="w-10 h-10 text-neutral-400" />
        <span className="font-semibold text-xs text-neutral-500">Typography Settings Locked</span>
        <p className="text-[11px] max-w-xs">
          Enable <strong>Smart Reflow Mode</strong> in the top toolbar to adjust fonts, spacing, margins, and layout widths.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 text-sm">
      {/* 1. Font Selection */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>
          <Type className="w-4 h-4 text-amber-500" />
          Typeface
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {fontFamilies.map((font) => {
            const isSelected = typography.fontFamily === font.id;
            return (
              <button
                key={font.id}
                onClick={() => updateTypography({ fontFamily: font.id })}
                className={`py-2 px-3 rounded-xl border text-center transition-all font-medium text-xs hover:scale-[1.02] active:scale-[0.98] ${
                  isSelected ? 'border-amber-500 ring-1 ring-amber-500/55' : ''
                }`}
                style={{
                  backgroundColor: isSelected ? `${theme.accent}15` : 'transparent',
                  borderColor: isSelected ? theme.accent : theme.border,
                  color: theme.text,
                  fontFamily:
                    font.id === 'serif'
                      ? 'Georgia, serif'
                      : font.id === 'sans-serif'
                      ? 'system-ui, sans-serif'
                      : font.id === 'mono'
                      ? 'monospace'
                      : '"Comic Sans MS", cursive, sans-serif',
                }}
              >
                {font.name}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="opacity-10" style={{ borderColor: theme.border }} />

      {/* 2. Text Alignment */}
      <div>
        <h3 className="font-semibold mb-3" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>Alignment</h3>
        <div className="flex gap-2">
          {alignments.map((align) => {
            const isSelected = typography.alignment === align.id;
            const Icon = align.icon;
            return (
              <button
                key={align.id}
                onClick={() => updateTypography({ alignment: align.id })}
                title={align.label}
                className={`flex-1 py-2 rounded-xl border flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]`}
                style={{
                  backgroundColor: isSelected ? `${theme.accent}15` : 'transparent',
                  borderColor: isSelected ? theme.accent : theme.border,
                  color: theme.text,
                }}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      <hr className="opacity-10" style={{ borderColor: theme.border }} />

      {/* 3. Slider Controls */}
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>Sizing & Spacing</h3>

        {/* Font Size */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-medium text-xs">
            <span>Font Size</span>
            <span className="opacity-80 font-mono">{typography.fontSize}px</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateTypography({ fontSize: Math.max(14, typography.fontSize - 1) })}
              className="p-1 rounded-lg border hover:bg-neutral-500/10"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="14"
              max="36"
              value={typography.fontSize}
              onChange={(e) => updateTypography({ fontSize: parseInt(e.target.value) })}
              className="flex-1 accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <button
              onClick={() => updateTypography({ fontSize: Math.min(36, typography.fontSize + 1) })}
              className="p-1 rounded-lg border hover:bg-neutral-500/10"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Line Spacing */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-medium text-xs">
            <span>Line Spacing</span>
            <span className="opacity-80 font-mono">{typography.lineSpacing.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.2"
            max="2.6"
            step="0.1"
            value={typography.lineSpacing}
            onChange={(e) => updateTypography({ lineSpacing: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Paragraph Spacing */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-medium text-xs">
            <span>Paragraph Gap</span>
            <span className="opacity-80 font-mono">{typography.paragraphSpacing}px</span>
          </div>
          <input
            type="range"
            min="8"
            max="48"
            value={typography.paragraphSpacing}
            onChange={(e) => updateTypography({ paragraphSpacing: parseInt(e.target.value) })}
            className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Margins */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-medium text-xs">
            <span>Side Margins</span>
            <span className="opacity-80 font-mono">{typography.margins}px</span>
          </div>
          <input
            type="range"
            min="16"
            max="128"
            value={typography.margins}
            onChange={(e) => updateTypography({ margins: parseInt(e.target.value) })}
            className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Max Reading Width */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-medium text-xs">
            <span>Maximum Line Width</span>
            <span className="opacity-80 font-mono">{typography.maxWidth}px</span>
          </div>
          <input
            type="range"
            min="500"
            max="1100"
            value={typography.maxWidth}
            onChange={(e) => updateTypography({ maxWidth: parseInt(e.target.value) })}
            className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Word Spacing */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-medium text-xs">
            <span>Word Spacing</span>
            <span className="opacity-80 font-mono">+{typography.wordSpacing}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={typography.wordSpacing}
            onChange={(e) => updateTypography({ wordSpacing: parseInt(e.target.value) })}
            className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Letter Spacing */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-medium text-xs">
            <span>Letter Spacing</span>
            <span className="opacity-80 font-mono">{typography.letterSpacing >= 0 ? `+${typography.letterSpacing}` : typography.letterSpacing}px</span>
          </div>
          <input
            type="range"
            min="-1"
            max="6"
            step="0.5"
            value={typography.letterSpacing}
            onChange={(e) => updateTypography({ letterSpacing: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
