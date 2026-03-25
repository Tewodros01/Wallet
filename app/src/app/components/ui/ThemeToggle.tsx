import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle = ({ className = '', showLabel = true }: ThemeToggleProps) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDark ? 'Dark' : 'Light'} Mode
        </span>
      )}
      
      <button
        onClick={toggleTheme}
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-gray-700"
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle theme"
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform"
          animate={{
            x: isDark ? 24 : 4,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
        
        {/* Icons */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          <motion.div
            className="text-xs"
            animate={{
              opacity: isDark ? 0 : 1,
              scale: isDark ? 0.8 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            ☀️
          </motion.div>
          <motion.div
            className="text-xs"
            animate={{
              opacity: isDark ? 1 : 0,
              scale: isDark ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
          >
            🌙
          </motion.div>
        </div>
      </button>
    </div>
  );
};