import { useEffect, useState } from 'react';

/** Reactive CSS media query, for the few places JS needs the breakpoint. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/** Tailwind's `lg` breakpoint. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
