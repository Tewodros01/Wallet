export const themeConfig = {
  colors: {
    light: {
      // Primary colors
      primary: '#10b981', // emerald-500
      primaryHover: '#059669', // emerald-600
      secondary: '#8b5cf6', // purple-500
      
      // Background colors
      background: '#ffffff',
      surface: '#f8fafc', // slate-50
      card: '#ffffff',
      
      // Text colors
      textPrimary: '#1e293b', // slate-800
      textSecondary: '#64748b', // slate-500
      textMuted: '#94a3b8', // slate-400
      
      // Border colors
      border: '#e2e8f0', // slate-200
      borderLight: '#f1f5f9', // slate-100
      
      // State colors
      success: '#22c55e', // green-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      info: '#3b82f6', // blue-500
      
      // Game specific
      bingoCard: '#ffffff',
      bingoCardBorder: '#e2e8f0',
      bingoNumber: '#1e293b',
      bingoNumberMarked: '#10b981',
      
      // Overlay
      overlay: 'rgba(15, 23, 42, 0.5)',
    },
    dark: {
      // Primary colors
      primary: '#10b981', // emerald-500
      primaryHover: '#059669', // emerald-600
      secondary: '#8b5cf6', // purple-500
      
      // Background colors
      background: '#030712', // gray-950
      surface: '#1e293b', // slate-800
      card: '#334155', // slate-700
      
      // Text colors
      textPrimary: '#f8fafc', // slate-50
      textSecondary: '#cbd5e1', // slate-300
      textMuted: '#64748b', // slate-500
      
      // Border colors
      border: 'rgba(255, 255, 255, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      
      // State colors
      success: '#22c55e', // green-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      info: '#3b82f6', // blue-500
      
      // Game specific
      bingoCard: '#334155',
      bingoCardBorder: 'rgba(255, 255, 255, 0.1)',
      bingoNumber: '#f8fafc',
      bingoNumberMarked: '#10b981',
      
      // Overlay
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
  },
  
  shadows: {
    light: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    dark: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    },
  },
  
  animations: {
    transition: {
      fast: '150ms ease',
      normal: '200ms ease',
      slow: '300ms ease',
    },
    spring: {
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type ThemeConfig = typeof themeConfig;