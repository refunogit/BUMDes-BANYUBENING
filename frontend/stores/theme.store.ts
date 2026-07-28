'use client';
import { create } from 'zustand';

export type ThemeType = 'DEFAULT' | 'INDEPENDENCE_DAY' | 'CHINESE_NEW_YEAR' | 'RAMADAN_EID';

interface ThemeState {
  activeTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  getThemeClasses: () => string;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeTheme: 'DEFAULT',
  setTheme: (theme) => {
    set({ activeTheme: theme });
    if (typeof document !== 'undefined') {
      document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, '').trim();
      document.documentElement.classList.add(`theme-${theme.toLowerCase()}`);
    }
  },
  getThemeClasses: () => {
    const theme = get().activeTheme;
    switch (theme) {
      case 'INDEPENDENCE_DAY':
        return 'theme-independence';
      case 'CHINESE_NEW_YEAR':
        return 'theme-chinese';
      case 'RAMADAN_EID':
        return 'theme-ramadan';
      default:
        return 'theme-default';
    }
  },
}));
