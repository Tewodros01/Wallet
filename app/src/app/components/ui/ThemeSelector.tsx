import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../../hooks/useTheme';

export const ThemeSelector = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center gap-3 w-full px-4 py-3.5 transition-colors text-left ${
        isDark ? 'hover:bg-white/4' : 'hover:bg-slate-100'
      }`}
    >
      <span className={`text-sm shrink-0 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
        {isDark ? <FiMoon /> : <FiSun />}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </p>
        <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        </p>
      </div>
      <div className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${
        isDark ? 'bg-emerald-500' : 'bg-slate-200'
      }`}>
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
            isDark ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </div>
    </button>
  );
};