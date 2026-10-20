import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useCart } from '@/features/cart';
import { ApiError } from '@/shared/api/client';
import { useCatalog } from './useCatalog';
import { loadProductDetail, loadProductPage, normalizeProduct, smallestVariant } from '../shop.service';
import { useWishlist } from '../WishlistProvider';
import type { ProductApiDto } from '../shop.types';

export function useProductDetail() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const catalog = useCatalog();
  const wishlist = useWishlist();
  const [request, setRequest] = useState<{ slug: string; product?: ProductApiDto; error?: unknown; loading: boolean }>({ slug: '', loading: true });
  const [attempt, setAttempt] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<number>();
  const [imageIndex, setImageIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [addedVariantId, setAddedVariantId] = useState<number>();
  const [related, setRelated] = useState<{ slug: string; items: ProductApiDto[] }>({ slug: '', items: [] });
  useEffect(() => {
    window.scrollTo(0, 0);
    const controller = new AbortController();
    setRequest({ slug, loading: true }); setSelectedVariantId(undefined); setImageIndex(0); setZoomOpen(false); setRequestedQuantity(1); setAddedVariantId(undefined);
    loadProductDetail(slug, controller.signal).then(product => {
      if (!controller.signal.aborted) setRequest({ slug, product, loading: false });
    }).catch(error => { if (!controller.signal.aborted) setRequest({ slug, error, loading: false }); });
    return () => controller.abort();
  }, [slug, attempt]);
  const current = request.slug === slug ? request : { loading: true };
  const product = 'product' in current ? current.product : undefined;
  useEffect(() => {
    if (product && !catalog.loading && !catalog.error) catalog.rememberProduct(product);
  }, [product, catalog.loading, catalog.error, catalog.rememberProduct]);
  useEffect(() => {
    if (!product || catalog.loading || catalog.error) return;
    const controller = new AbortController();
    loadProductPage({ category: product.category_code }, controller.signal).then(response => {
      if (controller.signal.aborted) return;
      catalog.rememberProducts(response.items);
      setRelated({ slug: product.slug, items: response.items });
    }).catch(() => { /* Optional suggestions can use already loaded public catalog items. */ });
    return () => controller.abort();
  }, [product, catalog.loading, catalog.error, catalog.rememberProducts]);
  const error = 'error' in current ? current.error : undefined;
  const variant = product?.variants.find(item => item.id === selectedVariantId) || product?.variants.find(item => item.in_stock) || product?.variants[0];
  const images = [...(product?.images || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const image = images[imageIndex] || images[0];
  const availableQuantity = Math.max(0, (variant?.max_quantity || 0) - (cart.items.find(item => item.variantId === variant?.id)?.qty || 0));
  const quantity = Math.min(requestedQuantity, Math.max(1, availableQuantity));
  const addToCart = () => {
    if (!product || !variant?.in_stock || !availableQuantity || !cart.addItem(product.id, variant.id, quantity)) return false;
    setAddedVariantId(variant.id);
    return true;
  };
  const orderNow = () => {
    if (addToCart()) { navigate('/cart'); window.scrollTo(0, 0); }
  };
  const relatedProducts = (related.slug === product?.slug ? related.items.map(item => normalizeProduct(item, catalog.categories)) : catalog.products).filter(item => item.id !== product?.id)
    .sort((a, b) => Number(b.category_code === product?.category_code) - Number(a.category_code === product?.category_code)).slice(0, 4);
  return { product, error, loading: current.loading, notFound: error instanceof ApiError && error.code === 'NOT_FOUND',
    retry: () => setAttempt(value => value + 1), category: catalog.categories.find(item => item.code === product?.category_code),
    variant, selectVariant: (id: number) => { setSelectedVariantId(id); setRequestedQuantity(1); setAddedVariantId(undefined); }, images, image, imageIndex, selectImage: setImageIndex,
    quantity, availableQuantity, setQuantity: (value: number) => { if (Number.isInteger(value)) { setRequestedQuantity(Math.max(1, Math.min(value, Math.max(1, availableQuantity)))); setAddedVariantId(undefined); } },
    added: addedVariantId === variant?.id && addedVariantId !== undefined, addToCart,
    favorite: Boolean(product && wishlist.items.some(item => item.id === product.id)),
    toggleFavorite: () => { if (product) wishlist.toggle(normalizeProduct(product, catalog.categories)); },
    relatedProducts, relatedVariants: Object.fromEntries(relatedProducts.flatMap(item => { const first = smallestVariant(item.variants || []); return first ? [[item.id, first.id]] : []; })),
    addedRelated: cart.items.flatMap(item => item.variantId ? [item.variantId] : []), addRelated: cart.addItem,
    zoomOpen, setZoomOpen, orderNow, cartLoading: cart.loading || !catalog.products.some(item => item.id === product?.id), cartError: cart.error,
    catalogError: catalog.error || cart.hydrationError, retryCatalog: () => { catalog.reload(); cart.retryHydration(); } };
}
export type ProductDetailModel = ReturnType<typeof useProductDetail>;
