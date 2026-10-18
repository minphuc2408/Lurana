import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Product } from './shop.types';

interface WishlistState {
  items: Product[];
  open: boolean;
  toggle: (product: Product) => void;
  remove: (id: number) => void;
  show: () => void;
  close: () => void;
  restoreFocus: () => void;
}
const WishlistContext = createContext<WishlistState | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const resize = () => { if (!desktop.matches) setOpen(false); };
    desktop.addEventListener('change', resize);
    return () => desktop.removeEventListener('change', resize);
  }, []);
  const show = () => {
    if (!window.matchMedia('(min-width: 768px)').matches) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  };
  return <WishlistContext.Provider value={{ items, open, show, close: () => setOpen(false),
    toggle: product => setItems(previous => previous.some(item => item.id === product.id) ? previous.filter(item => item.id !== product.id) : [...previous, product]),
    remove: id => setItems(previous => previous.filter(item => item.id !== id)),
    restoreFocus: () => { if (trigger.current?.isConnected && trigger.current.getClientRects().length) trigger.current.focus({ preventScroll: true }); },
  }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const state = useContext(WishlistContext);
  if (!state) throw new Error('WishlistProvider is required');
  return state;
}
