import { useCart } from '@/features/cart';
import { useLocation, useNavigate } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { featureFlags } from '@/shared/config/features';
export function useMainLayout() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchQuery = new URLSearchParams(location.search).get('q') || '';
  useEffect(() => { setSearchOpen(false); setMenuOpen(false); }, [location.key]);
  useEffect(() => { if (searchOpen) searchInputRef.current?.focus(); }, [searchOpen]);
  const closeSearch = () => { setSearchOpen(false); requestAnimationFrame(() => searchButtonRef.current?.focus()); };
  const openSearch = () => { setSearchTerm(searchQuery); setMenuOpen(false); setSearchOpen(true); };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) { searchInputRef.current?.focus(); return; }
    navigate({ pathname: '/shop', search: '?' + new URLSearchParams({ q: query }).toString() });
    closeSearch();
  };
  const navLinks = [{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }, { to: '/orders/track', label: 'Track order' },
    ...(featureFlags.customerAuth ? [{ to: '/orders', label: 'My Orders' }, { to: '/profile', label: 'Profile' }] : [])];
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  return { searchQuery, searchOpen, searchTerm, setSearchTerm, searchInputRef, searchButtonRef, openSearch, closeSearch, submitSearch,
    itemCount, menuOpen, toggleMenu: () => { setSearchOpen(false); setMenuOpen(!menuOpen); }, setMenuOpen, navLinks, isActive };
}
