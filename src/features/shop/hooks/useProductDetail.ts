import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useCart } from '@/features/cart';
import { ApiError } from '@/shared/api/client';
import { useCatalog } from './useCatalog';
import { loadProductDetail } from '../shop.service';
import type { ProductApiDto } from '../shop.types';

export function useProductDetail() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const catalog = useCatalog();
  const [request, setRequest] = useState<{ slug: string; product?: ProductApiDto; error?: unknown; loading: boolean }>({ slug: '', loading: true });
  const [attempt, setAttempt] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<number>();
  const [imageIndex, setImageIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
    const controller = new AbortController();
    setRequest({ slug, loading: true }); setSelectedVariantId(undefined); setImageIndex(0); setZoomOpen(false);
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
  const error = 'error' in current ? current.error : undefined;
  const variant = product?.variants.find(item => item.id === selectedVariantId) || product?.variants.find(item => item.in_stock) || product?.variants[0];
  const images = [...(product?.images || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const image = images[imageIndex] || images[0];
  const orderNow = () => {
    if (product && variant?.in_stock && cart.addItem(product.id, variant.id)) { navigate('/cart'); window.scrollTo(0, 0); }
  };
  return { product, error, loading: current.loading, notFound: error instanceof ApiError && error.code === 'NOT_FOUND',
    retry: () => setAttempt(value => value + 1), category: catalog.categories.find(item => item.code === product?.category_code),
    variant, selectVariant: setSelectedVariantId, images, image, imageIndex, selectImage: setImageIndex,
    zoomOpen, setZoomOpen, orderNow, cartLoading: cart.loading || !catalog.products.some(item => item.id === product?.id), cartError: cart.error, catalogError: catalog.error, retryCatalog: catalog.reload };
}
export type ProductDetailModel = ReturnType<typeof useProductDetail>;
