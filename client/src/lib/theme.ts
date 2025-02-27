import { atom, useAtom } from 'jotai';

type Theme = 'light' | 'dark';
const themeAtom = atom<Theme>('light');

// Initialize theme from system preference
if (typeof window !== 'undefined') {
  const darkModePreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', darkModePreferred);
}

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return { theme, toggleTheme };
}