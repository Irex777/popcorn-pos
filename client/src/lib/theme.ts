import { atom, useAtom } from 'jotai';

type Theme = 'light' | 'dark' | 'system';
const themeAtom = atom<Theme>('system');

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);

  const setThemeAndUpdateDOM = (newTheme: Theme) => {
    setTheme(newTheme);

    // Remove both classes first
    document.documentElement.classList.remove('light', 'dark');

    // Determine the actual theme
    let effectiveTheme: 'light' | 'dark' = newTheme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : newTheme;

    // Add the appropriate class
    document.documentElement.classList.add(effectiveTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeAndUpdateDOM(newTheme);
  };

  return { theme, toggleTheme };
}