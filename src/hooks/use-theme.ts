import { useEffect } from 'react';

import { useData } from '@/contexts/DataContext';

/**
 * Applies the stored theme to <html>. "system" follows the OS setting and
 * keeps following it as the user changes it, rather than sampling once.
 */
export function useTheme() {
  const { preferences, setTheme } = useData();
  const theme = preferences.theme;

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', dark);
      root.style.colorScheme = dark ? 'dark' : 'light';
    };

    apply();
    if (theme !== 'system') return;

    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return { theme, setTheme };
}
