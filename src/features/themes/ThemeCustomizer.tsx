import React, { useState } from 'react';
import { Palette, EyeOff, Sun, Sparkles, Trash2, Plus } from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';
import { DEFAULT_THEMES } from './defaultThemes';

export const ThemeCustomizer: React.FC = () => {
  const {
    theme,
    setTheme,
    customThemes,
    addCustomTheme,
    deleteCustomTheme,
    filters,
    updateFilters,
    overlays,
    updateOverlays,
    autoBrightnessActive,
    adaptiveWarmthActive,
    setAutoBrightness,
    setAdaptiveWarmth,
  } = useReaderStore();

  const [customName, setCustomName] = useState('');
  const [customBg, setCustomBg] = useState('#F0E6D2');
  const [customText, setCustomText] = useState('#2C2518');
  const [customBorder, setCustomBorder] = useState('#DBC8A9');
  const [customAccent, setCustomAccent] = useState('#7F5F3F');
  const [customIsDark, setCustomIsDark] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  const handleCreateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newTheme = {
      id: `custom-${Date.now()}`,
      name: customName,
      bg: customBg,
      text: customText,
      border: customBorder,
      accent: customAccent,
      isDark: customIsDark,
      isCustom: true,
    };

    addCustomTheme(newTheme);
    setTheme(newTheme);
    setCustomName('');
    setShowCreator(false);
  };

  const allThemes = [...DEFAULT_THEMES, ...customThemes];

  return (
    <div className="flex flex-col gap-6 p-4 text-sm">
      {/* 1. Theme Presets */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>
          <Palette className="w-4 h-4 text-amber-500" />
          Reading Themes
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {allThemes.map((t) => {
            const isSelected = theme.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t)}
                className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isSelected ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: t.bg,
                  color: t.text,
                  borderColor: isSelected ? t.accent : t.border,
                  boxShadow: isSelected ? `0 0 12px ${t.accent}40` : 'none',
                  // Set ring-color dynamically
                  outline: isSelected ? `2px solid ${t.accent}` : 'none',
                }}
              >
                <span className="font-bold text-xs leading-none mb-1">{t.name}</span>
                <span className="text-[10px] opacity-75">
                  {t.isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
                {t.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomTheme(t.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-md text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Theme Creator */}
        {!showCreator ? (
          <button
            onClick={() => setShowCreator(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            <Plus className="w-4 h-4" /> Add Custom Theme
          </button>
        ) : (
          <form
            onSubmit={handleCreateTheme}
            className="p-4 rounded-xl border flex flex-col gap-3.5"
            style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#262626' : '#FAF9F6' }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-xs" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>Create Custom Theme</span>
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="text-xs hover:underline opacity-80"
              >
                Cancel
              </button>
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold mb-1 opacity-80">Theme Name</label>
              <input
                type="text"
                placeholder="e.g. Vintage Amber"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border text-xs bg-transparent focus:outline-none"
                style={{ borderColor: theme.border, color: theme.text }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold mb-1 opacity-80">Background</label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="color"
                    value={customBg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-neutral-300"
                  />
                  <span className="font-mono text-[10px]">{customBg}</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 opacity-80">Text Color</label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="color"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-neutral-300"
                  />
                  <span className="font-mono text-[10px]">{customText}</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 opacity-80">Border</label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="color"
                    value={customBorder}
                    onChange={(e) => setCustomBorder(e.target.value)}
                    className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-neutral-300"
                  />
                  <span className="font-mono text-[10px]">{customBorder}</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 opacity-80">Accent Color</label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-neutral-300"
                  />
                  <span className="font-mono text-[10px]">{customAccent}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isDark"
                checked={customIsDark}
                onChange={(e) => setCustomIsDark(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isDark" className="text-xs cursor-pointer select-none">
                This is a Dark Theme
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs transition-transform active:scale-[0.98] hover:bg-emerald-500 shadow-md"
            >
              Save Theme
            </button>
          </form>
        )}
      </div>

      <hr className="opacity-10" style={{ borderColor: theme.border }} />

      {/* 2. Intelligent Adjustments (Adaptive controls) */}
      <div>
        <h3 className="font-semibold mb-3.5 flex items-center gap-2" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Adaptive Eye Comfort
        </h3>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-xs">Auto Brightness</span>
              <p className="text-[10px] opacity-75">Dim light at night automatically</p>
            </div>
            <button
              onClick={() => setAutoBrightness(!autoBrightnessActive)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative`}
              style={{ backgroundColor: autoBrightnessActive ? theme.accent : '#9CA3AF' }}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                  autoBrightnessActive ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-xs">Adaptive Warmth</span>
              <p className="text-[10px] opacity-75">Sunset warmth blue-light shift</p>
            </div>
            <button
              onClick={() => setAdaptiveWarmth(!adaptiveWarmthActive)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative`}
              style={{ backgroundColor: adaptiveWarmthActive ? theme.accent : '#9CA3AF' }}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                  adaptiveWarmthActive ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <hr className="opacity-10" style={{ borderColor: theme.border }} />

      {/* 3. Screen Filters */}
      <div className="flex flex-col gap-5">
        <h3 className="font-semibold flex items-center gap-2" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>
          <Sun className="w-4 h-4 text-amber-500" />
          Brightness & Filter Overlays
        </h3>

        {/* Sliders using standard HTML ranges styled beautifully for absolute responsiveness */}
        <div className="flex flex-col gap-4">
          {/* Brightness */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-medium text-xs">
              <span>Brightness</span>
              <span className="opacity-80 font-mono">{filters.brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={filters.brightness}
              onChange={(e) => updateFilters({ brightness: parseInt(e.target.value) })}
              className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-medium text-xs">
              <span>Contrast</span>
              <span className="opacity-80 font-mono">{filters.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={filters.contrast}
              onChange={(e) => updateFilters({ contrast: parseInt(e.target.value) })}
              className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Warmth (Sepia) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-medium text-xs">
              <span>Warmth (Sepia)</span>
              <span className="opacity-80 font-mono">{filters.warmth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.warmth}
              onChange={(e) => updateFilters({ warmth: parseInt(e.target.value) })}
              className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Blue Light Reduction */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-medium text-xs">
              <span>Blue Light Blocking</span>
              <span className="opacity-80 font-mono">{filters.blueLight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.blueLight}
              onChange={(e) => updateFilters({ blueLight: parseInt(e.target.value) })}
              className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-medium text-xs">
              <span>Saturation</span>
              <span className="opacity-80 font-mono">{filters.saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={filters.saturation}
              onChange={(e) => updateFilters({ saturation: parseInt(e.target.value) })}
              className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-medium text-xs">
              <span>Canvas Opacity</span>
              <span className="opacity-80 font-mono">{filters.opacity}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={filters.opacity}
              onChange={(e) => updateFilters({ opacity: parseInt(e.target.value) })}
              className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <hr className="opacity-10" style={{ borderColor: theme.border }} />

      {/* 4. Canvas Overlays */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>
          <EyeOff className="w-4 h-4 text-violet-500" />
          Reading Overlays
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-xs">Soft Paper Texture</span>
              <p className="text-[10px] opacity-75">Simulate actual paper fibers</p>
            </div>
            <button
              onClick={() => updateOverlays({ paperTexture: !overlays.paperTexture })}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative`}
              style={{ backgroundColor: overlays.paperTexture ? theme.accent : '#9CA3AF' }}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                  overlays.paperTexture ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-xs">Subtle Grain Noise</span>
              <p className="text-[10px] opacity-75">Reduces high-contrast crisp glare</p>
            </div>
            <button
              onClick={() => updateOverlays({ subtleNoise: !overlays.subtleNoise })}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative`}
              style={{ backgroundColor: overlays.subtleNoise ? theme.accent : '#9CA3AF' }}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                  overlays.subtleNoise ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-xs">Reduced Glare Filter</span>
              <p className="text-[10px] opacity-75">Diffuses bright background rays</p>
            </div>
            <button
              onClick={() => updateOverlays({ reducedGlare: !overlays.reducedGlare })}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative`}
              style={{ backgroundColor: overlays.reducedGlare ? theme.accent : '#9CA3AF' }}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                  overlays.reducedGlare ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
