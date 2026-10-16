// The theme lives on <html data-theme>; index.html sets it before first paint.
export const THEME_KEY = 'across-theme';

export function readStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#131516' : '#ffffff');
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private browsing can block storage; the choice then lasts for this visit only.
  }
}
