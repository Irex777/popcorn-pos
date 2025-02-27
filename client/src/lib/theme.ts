import { atom, useAtom } from 'jotai';

const themeAtom = atom<'light' | 'dark'>('light');

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return { theme, toggleTheme };
}
