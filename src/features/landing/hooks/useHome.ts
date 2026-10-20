import { useState } from 'react';
import { useCatalog } from '@/features/shop';
import { useCart } from '@/features/cart';
export function useHome() {
  const catalog = useCatalog();
  const cart = useCart();
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  return {
    ...catalog,
    loading: catalog.loading || (!catalog.error && !cart.hydrationError && cart.loading),
    error: catalog.error || cart.hydrationError,
    reload: () => { catalog.reload(); cart.retryHydration(); },
    testimonials: [] as { name: string; review: string; review_vi: string; stars: number }[],
    featuredProducts: catalog.products.filter(product => product.is_featured),
    selectedVariants,
    selectVariant: (productId: number, variantId: number) => setSelectedVariants(previous => ({ ...previous, [productId]: variantId })),
    added: cart.items.map(item => item.variantId || 0),
    addItem: cart.addItem,
    cartError: cart.error,
  };
}
export type HomeModel = ReturnType<typeof useHome>;
