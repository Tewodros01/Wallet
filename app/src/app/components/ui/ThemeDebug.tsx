import { useTheme } from '../../../hooks/useTheme';

export const ThemeDebug = () => {
  const { isDark, currentTheme, toggleTheme } = useTheme();
  
  return (
    <div className="fixed top-4 right-4 z-50 p-3 bg-red-500 text-white rounded-lg text-xs">
      <div>Theme: {currentTheme}</div>
      <div>isDark: {isDark ? 'true' : 'false'}</div>
      <div>HTML class: {document.documentElement.className}</div>
      <button 
        onClick={toggleTheme}
        className="mt-2 px-2 py-1 bg-white text-black rounded text-xs"
      >
        Toggle Theme
      </button>
    </div>
  );
};