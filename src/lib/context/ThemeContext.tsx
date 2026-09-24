'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // โหลด Theme จาก localStorage หรือใช้ System เป็นค่าเริ่มต้น
  useEffect(() => {
    const saved = localStorage.getItem('party_theme') as ThemeMode | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      setThemeState(saved);
    } else {
      setThemeState('system');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let active: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = isDark ? 'dark' : 'light';
      } else {
        active = theme;
      }

      setResolvedTheme(active);

      if (active === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // ฟังการเปลี่ยน preferences ของ OS ถ้าเลือกเป็น system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('party_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
