'use client';

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setTheme('light')}
        title="Light Mode"
        className={`p-1.5 rounded-lg transition-all ${
          theme === 'light'
            ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('system')}
        title="System Default (ตามอุปกรณ์ของคุณ)"
        className={`p-1.5 rounded-lg transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        title="Dark Mode"
        className={`p-1.5 rounded-lg transition-all ${
          theme === 'dark'
            ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-sm'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
