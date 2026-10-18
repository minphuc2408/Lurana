import { useEffect, useReducer, useState } from 'react';
import { useCatalog } from '@/features/shop';
import type { Product } from '@/features/shop';
import { cartReducer, readCart, saveCart } from '../cart.service';
import type { CartItem, ProductSize } from '../cart.types';
const sizes: Record<string, ProductSize> = { S: 'Small', M: 'Medium', L: 'Large', STANDARD: 'Standard', DELUXE: 'Deluxe' };
function makeItem(products: Product[], variantId: number, qty = 1): CartItem {
  const product = products.find(item => item.variants?.some(variant => variant.id === variantId));
  const variant = product?.variants?.find(item => item.id === variantId);
  return { id: 'variant:' + variantId, variantId, productId: product?.id || 0, name: product?.name || '', name_en: product?.name_en, name_vi: product?.name_vi,
    slug: product?.slug, sizeCode: variant?.size_code,
    price: variant?.price || 0, image: product?.image || '', size: sizes[variant?.size_code || 'S'], qty, maxQuantity: variant?.max_quantity ?? 20 };
}
export function useCartState() {
  const catalog = useCatalog();
  const [items, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (catalog.loading || catalog.error || hydrated) return;
    dispatch({ type: 'restore', items: readCart().map(line => makeItem(catalog.products, line.variantId, line.quantity)) });
    setHydrated(true);
  }, [catalog.loading, catalog.error, catalog.products, hydrated]);
  useEffect(() => { if (hydrated) saveCart(items); }, [items, hydrated]);
  const addItem = (productId: number, size: ProductSize | number = 'Small', quantity = 1) => {
    const product = catalog.products.find(item => item.id === productId);
    const variant = product?.variants?.find(item => typeof size === 'number' ? item.id === size : sizes[item.size_code] === size);
    if (!hydrated || !variant?.in_stock) { setError('API variant unavailable'); return false; }
    const existing = items.find(item => item.variantId === variant.id);
    if (!Number.isInteger(quantity) || quantity < 1 || (!existing && items.length >= 15) || (existing?.qty || 0) + quantity > variant.max_quantity) { setError('API cart limit'); return false; }
    setError(''); dispatch({ type: 'add', item: makeItem(catalog.products, variant.id, quantity) }); return true;
  };
  return { items, error, itemCount: items.reduce((count, item) => count + item.qty, 0), addItem, loading: !hydrated,
    updateQty: (id: string, delta: number) => { setError(''); dispatch({ type: 'quantity', id, delta }); },
    removeItem: (id: string) => { setError(''); dispatch({ type: 'remove', id }); },
    clearCart: () => { setError(''); dispatch({ type: 'clear' }); } };
}
