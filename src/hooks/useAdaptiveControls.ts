import { useEffect } from 'react';
import { useReaderStore } from '../stores/readerStore';
import { DEFAULT_THEMES } from '../features/themes/defaultThemes';

export function useAdaptiveControls() {
  const {
    autoBrightnessActive,
    adaptiveWarmthActive,
    updateFilters,
    theme,
    setTheme,
    customThemes,
  } = useReaderStore();

  useEffect(() => {
    if (!autoBrightnessActive && !adaptiveWarmthActive) return;

    const adjustSettings = () => {
      const now = new Date();
      const hour = now.getHours();
      const isNight = hour < 6 || hour >= 19; // 7 PM to 6 AM is night

      // 1. Adaptive Warmth (reduce blue light / increase warmth at night)
      if (adaptiveWarmthActive) {
        if (isNight) {
          updateFilters({ warmth: 40, blueLight: 50 }); // Higher warmth, high blue light reduction
        } else {
          updateFilters({ warmth: 5, blueLight: 0 }); // Low warmth during the day
        }
      }

      // 2. Adaptive Brightness (reduce brightness at night, increase during day)
      if (autoBrightnessActive) {
        if (isNight) {
          updateFilters({ brightness: 80, contrast: 95 }); // dimmer
          // Auto switch to dark theme if not already
          if (!theme.isDark) {
            const darkTheme = DEFAULT_THEMES.find(t => t.id === 'dark') || DEFAULT_THEMES[4];
            setTheme(darkTheme);
          }
        } else {
          updateFilters({ brightness: 100, contrast: 100 });
          // Auto switch to warm paper or cream theme during day if dark
          if (theme.isDark) {
            const dayTheme = DEFAULT_THEMES.find(t => t.id === 'warm-paper') || DEFAULT_THEMES[0];
            setTheme(dayTheme);
          }
        }
      }
    };

    // Run immediately
    adjustSettings();

    // Check every minute
    const interval = setInterval(adjustSettings, 60000);
    return () => clearInterval(interval);
  }, [autoBrightnessActive, adaptiveWarmthActive, theme, setTheme, updateFilters]);

  // Optional: System Color Scheme integration
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-switch themes if adaptive settings are active and the user hasn't pinned a specific theme
      if (autoBrightnessActive) {
        const targetThemeId = e.matches ? 'dark' : 'warm-paper';
        const targetTheme = [...DEFAULT_THEMES, ...customThemes].find(t => t.id === targetThemeId);
        if (targetTheme) {
          setTheme(targetTheme);
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [autoBrightnessActive, setTheme, customThemes]);

  // Optional: Ambient Light Sensor API (where supported, e.g. Chrome behind flags)
  useEffect(() => {
    if (!autoBrightnessActive) return;

    if ('AmbientLightSensor' in window) {
      try {
        // @ts-ignore
        const sensor = new AmbientLightSensor();
        sensor.onreading = () => {
          // lux levels: low (< 50) => dim reader, high (> 400) => bright reader
          const lux = sensor.illuminance;
          if (lux < 50) {
            updateFilters({ brightness: 75, contrast: 90 });
          } else if (lux > 400) {
            updateFilters({ brightness: 110, contrast: 105 });
          } else {
            updateFilters({ brightness: 100, contrast: 100 });
          }
        };
        sensor.start();
        return () => sensor.stop();
      } catch (err) {
        console.warn('AmbientLightSensor initialization failed', err);
      }
    }
  }, [autoBrightnessActive, updateFilters]);
}
