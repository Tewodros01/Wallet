import { themeConfig } from '../config/theme';

export const getThemeClasses = (isDark: boolean) => ({
  // Background classes
  background: isDark ? 'bg-gray-950' : 'bg-white',
  surface: isDark ? 'bg-slate-800' : 'bg-slate-50',
  card: isDark ? 'bg-slate-700 border-white/10' : 'bg-white border-slate-200 shadow-sm',
  
  // Text classes
  textPrimary: isDark ? 'text-slate-50' : 'text-slate-800',
  textSecondary: isDark ? 'text-slate-300' : 'text-slate-500',
  textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
  
  // Border classes
  border: isDark ? 'border-white/10' : 'border-slate-200',
  borderLight: isDark ? 'border-white/5' : 'border-slate-100',
  
  // Interactive classes
  hover: isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50',
  active: isDark ? 'active:bg-white/10' : 'active:bg-slate-100',
  
  // Input classes
  input: isDark 
    ? 'bg-slate-800 border-white/10 text-slate-50 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20',
  
  // Button classes
  buttonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  buttonSecondary: isDark 
    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-white/10'
    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
  
  // Game specific
  bingoCard: isDark 
    ? 'bg-slate-700 border-white/10'
    : 'bg-white border-slate-200 shadow-sm',
  bingoNumber: isDark ? 'text-slate-50' : 'text-slate-800',
  bingoNumberMarked: 'bg-emerald-500 text-white',
  
  // Status classes
  success: 'bg-green-500/10 text-green-600 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  error: 'bg-red-500/10 text-red-600 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
});

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Theme-aware component variants
export const createThemeVariants = <T extends Record<string, any>>(
  variants: T,
  isDark: boolean
): T => {
  const result = {} as T;
  
  for (const [key, value] of Object.entries(variants)) {
    if (typeof value === 'object' && value.light && value.dark) {
      result[key as keyof T] = isDark ? value.dark : value.light;
    } else {
      result[key as keyof T] = value;
    }
  }
  
  return result;
};

// CSS custom properties for theme
export const setCSSThemeProperties = (isDark: boolean) => {
  const colors = isDark ? themeConfig.colors.dark : themeConfig.colors.light;
  const shadows = isDark ? themeConfig.shadows.dark : themeConfig.shadows.light;
  
  const root = document.documentElement;
  
  // Set color properties
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Set shadow properties
  Object.entries(shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
};