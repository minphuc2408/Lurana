import { useCart } from '@/features/cart';
import { useLocation } from 'react-router';
import { useState } from 'react';
import { featureFlags } from '@/shared/config/features';
export function useMainLayout() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navLinks = [{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }, { to: '/cart', label: 'Cart' }, { to: '/orders/track', label: 'Track order' },
    ...(featureFlags.customerAuth ? [{ to: '/orders', label: 'My Orders' }, { to: '/profile', label: 'Profile' }] : [])];
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  return { itemCount, menuOpen, setMenuOpen, navLinks, isActive };
}
