// Thème jour/nuit. Priorité : préférence sauvegardée > préférence système.
// Le `meta[name=theme-color]` suit, pour que la barre du navigateur mobile
// ne jure pas avec la page.

const STORAGE_KEY = 'portfolio_theme';
const listeners = new Set();

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('btn-theme');
  if (icon) icon.textContent = theme === 'dark' ? '○' : '◐';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d1013' : '#f5f4f0');
  listeners.forEach((fn) => fn(theme));
}

export const getTheme = () => document.documentElement.getAttribute('data-theme') || 'light';
export function onThemeChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem(STORAGE_KEY, next);
  apply(next);
  return next;
}

export function toggleTheme() {
  return setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  apply(saved || system);

  // Sans préférence explicite, on suit le système même s'il change en cours
  // de route (bascule automatique au coucher du soleil, par exemple).
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) apply(e.matches ? 'dark' : 'light');
  });

  document.getElementById('btn-theme')?.addEventListener('click', () => toggleTheme());
}
