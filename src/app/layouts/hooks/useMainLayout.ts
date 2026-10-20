import { useCart } from '@/features/cart';
import { useCatalog } from '@/features/shop';
import { useLocation, useNavigate } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useTheme } from '@/shared/theme/theme-store';

export function useMainLayout() {
  const { itemCount } = useCart();
  const catalog = useCatalog();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unavailableFeature, setUnavailableFeature] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const noticeTriggerRef = useRef<HTMLElement | null>(null);
  const searchQuery = new URLSearchParams(location.search).get('q') || '';

  useEffect(() => {
    const header = headerRef.current;
    const layout = header?.parentElement;
    if (!header || !layout) return;
    const updateHeight = () => layout.style.setProperty('--lunara-storefront-header-height', `${header.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => { observer.disconnect(); layout.style.removeProperty('--lunara-storefront-header-height'); };
  }, []);

  useEffect(() => { setMenuOpen(false); setSearchTerm(searchQuery); }, [location.key, searchQuery]);
  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!navigationRef.current?.contains(target) && !menuButtonRef.current?.contains(target)
        && !target.closest('[data-storefront-submenu]')) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      setMenuOpen(false);
      menuButtonRef.current?.focus({ preventScroll: true });
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const collapse = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    desktop.addEventListener('change', collapse);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      desktop.removeEventListener('change', collapse);
    };
  }, [menuOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) { searchInputRef.current?.focus(); return; }
    navigate({ pathname: '/shop', search: '?' + new URLSearchParams({ q: query }).toString() });
  };
  const showUnavailable = (feature: string) => {
    // Menu items disappear on close; restore focus to the owning trigger instead.
    const active = document.activeElement as HTMLElement | null;
    const popup = active?.closest('[data-storefront-submenu]');
    noticeTriggerRef.current = popup
      ? document.getElementById(popup.getAttribute('aria-labelledby') || '') : active;
    setMenuOpen(false);
    setUnavailableFeature(feature);
  };
  const restoreNoticeFocus = () => {
    const trigger = noticeTriggerRef.current;
    if (trigger?.isConnected && trigger.getClientRects().length) trigger.focus({ preventScroll: true });
    else menuButtonRef.current?.focus({ preventScroll: true });
  };
  const categoryHref = (code: string) => '/shop?' + new URLSearchParams({ category: code }).toString();
  const giftCategory = catalog.categories.find(category => category.code === 'gift-sets');
  const activeCategory = new URLSearchParams(location.search).get('category');
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  return {
    searchTerm, setSearchTerm, searchInputRef, submitSearch, itemCount, headerRef,
    menuOpen, toggleMenu: () => setMenuOpen(previous => !previous), menuButtonRef, navigationRef,
    categories: catalog.categories, catalogLoading: catalog.loading, catalogError: catalog.error, reloadCatalog: catalog.reload,
    giftHref: giftCategory ? categoryHref(giftCategory.code) : undefined, categoryHref, activeCategory, isActive,
    unavailableFeature, showUnavailable, closeUnavailable: () => setUnavailableFeature(null), restoreNoticeFocus,
    theme, setTheme,
  };
}
export type MainLayoutModel = ReturnType<typeof useMainLayout>;
