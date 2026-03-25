import { useEffect } from 'react';
import { usePreferencesStore } from '../store/preferences.store';
import { setCSSThemeProperties } from '../lib/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const darkModeEnabled = usePreferencesStore((s) => s.darkModeEnabled);
  const setDarkModeEnabled = usePreferencesStore((s) => s.setDarkModeEnabled);

  const setTheme = (mode: ThemeMode) => {
    if (mode === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkModeEnabled(systemPrefersDark);
    } else {
      setDarkModeEnabled(mode === 'dark');
    }
  };

  const toggleTheme = () => {
    setDarkModeEnabled(!darkModeEnabled);
  };

  const currentTheme: ThemeMode = darkModeEnabled ? 'dark' : 'light';

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('app-theme-light', 'app-theme-dark');
    
    // Add current theme class
    if (!darkModeEnabled) {
      root.classList.add('app-theme-light');
    }
    
    // Set color scheme for native browser elements
    root.style.colorScheme = darkModeEnabled ? 'dark' : 'light';
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', darkModeEnabled ? '#030712' : '#ffffff');
    }
    
    // Set CSS custom properties
    setCSSThemeProperties(darkModeEnabled);
  }, [darkModeEnabled]);

  return {
    currentTheme,
    isDark: darkModeEnabled,
    isLight: !darkModeEnabled,
    setTheme,
    toggleTheme,
  };
};