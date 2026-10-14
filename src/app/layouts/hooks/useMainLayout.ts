import { useCart } from '@/features/cart';
import { useLocation } from 'react-router';
import { useState } from 'react';
export function useMainLayout() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navLinks = [{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }, { to: '/cart', label: 'Cart' }];
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  return { itemCount, menuOpen, setMenuOpen, navLinks, isActive };
}
