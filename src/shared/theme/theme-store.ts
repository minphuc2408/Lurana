import { useSyncExternalStore } from 'react';
import { normalizeTheme, readTheme, saveTheme, themes, themeStorageKey, themeTokens, type ThemeId } from './themes.ts';

let current: ThemeId = 'original';
let initialized = false;
let appliedTokens: string[] = [];
const listeners = new Set<() => void>();
function storage() {
  try { return window.localStorage; } catch { return undefined; }
}
function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  for (const token of appliedTokens) root.style.removeProperty(token);
  const tokens = themeTokens(themes.find(theme => theme.id === id)!);
  for (const [token, value] of Object.entries(tokens)) root.style.setProperty(token, value);
  appliedTokens = Object.keys(tokens);
  root.dataset.lunaraTheme = id;
  current = id;
  listeners.forEach(listener => listener());
}
/** Runs before createRoot, so the first rendered storefront has its saved colors. */
export function initializeTheme() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  applyTheme(readTheme(storage()));
  window.addEventListener('storage', event => {
    if ((event.key === themeStorageKey || event.key === null) && event.storageArea === storage()) applyTheme(normalizeTheme(event.newValue));
  });
}
export function setTheme(value: string) {
  const id = normalizeTheme(value);
  applyTheme(id);
  saveTheme(id, storage());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current, () => 'original' as ThemeId);
  return { theme, setTheme };
}
