import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, readStoredTheme, storeTheme, systemTheme } from '../lib/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || readStoredTheme() || systemTheme());

  useEffect(() => { applyTheme(theme); }, [theme]);

  // Follow the system setting until the visitor picks a theme themselves.
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;
    const follow = event => { if (!readStoredTheme()) setTheme(event.matches ? 'dark' : 'light'); };
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, []);

  const next = theme === 'dark' ? 'light' : 'dark';
  const toggle = () => {
    storeTheme(next);
    setTheme(next);
  };

  return <button className="theme-toggle" type="button" onClick={toggle}
    aria-label={next === 'dark' ? 'Switch to dark mode' : 'Switch to light mode'} title={next === 'dark' ? 'Dark mode' : 'Light mode'}>
    {theme === 'dark' ? <Sun aria-hidden="true" strokeWidth={1.9} /> : <Moon aria-hidden="true" strokeWidth={1.9} />}
  </button>;
}
