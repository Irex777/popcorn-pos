import React from 'react';
import { atom, useAtom } from 'jotai';

type Theme = 'light' | 'dark';
const themeAtom = atom<Theme>('light');

const initialThemeAtom = atom<Theme | null>(null);

function initializeTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [initialized, setInitialized] = useAtom(initialThemeAtom);

  React.useEffect(() => {
    if (!initialized) {
      const initialTheme = initializeTheme();
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
      setInitialized(initialTheme);
    }
  }, [initialized, setTheme, setInitialized]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return { theme, toggleTheme };
}
