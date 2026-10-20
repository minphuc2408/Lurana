import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { loadProductPage, normalizeProduct, smallestVariant } from "../shop.service";
import { useCatalog } from './useCatalog';
import type { ProductPageDto } from '../shop.types';

export function useProducts() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") || "All";
  const search = params.get("q") || "";
  const sortBy = ['featured', 'low', 'high'].includes(params.get('sort') || '') ? params.get('sort')! : 'featured';
  const priceRange = ['under-500', '500-1000', '1000-2000', 'over-2000'].includes(params.get('price') || '') ? params.get('price')! : 'all';
  const requestedPage = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const key = JSON.stringify([page, activeCategory, search, sortBy, priceRange]);
  const [request, setRequest] = useState<{ key: string; data?: ProductPageDto; error?: unknown }>({ key: '' });
  const [attempt, setAttempt] = useState(0);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { rememberProducts } = catalog;
  useEffect(() => {
    if (catalog.loading || catalog.error) return;
    const controller = new AbortController();
    setRequest({ key });
    loadProductPage({ page, category: activeCategory, q: search, sort: sortBy, price: priceRange }, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      if (page > Math.max(1, data.totalPages)) {
        setParams(previous => {
          const next = new URLSearchParams(previous);
          if (data.totalPages > 1) next.set('page', String(data.totalPages)); else next.delete('page');
          return next;
        }, { replace: true, state: { preserveScroll: true } });
        return;
      }
      rememberProducts(data.items);
      setRequest({ key, data });
    }).catch(error => { if (!controller.signal.aborted) setRequest({ key, error }); });
    return () => controller.abort();
  }, [key, page, activeCategory, search, sortBy, priceRange, attempt, catalog.loading, catalog.error, rememberProducts, setParams]);
  const current = request.key === key ? request : undefined;
  const sorted = useMemo(() => (current?.data?.items || []).map(product => normalizeProduct(product, catalog.categories)), [current?.data?.items, catalog.categories]);
  const selectedVariants = useMemo(() => Object.fromEntries(sorted.flatMap(product => {
    const variant = smallestVariant(product.variants || []);
    return variant ? [[product.id, variant.id]] : [];
  })), [sorted]);
  const updateParam = (key: string, value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (!value || value === 'All') next.delete(key); else next.set(key, value);
    next.delete('page');
    return next;
  }, { replace: true, state: { preserveScroll: true } });
  const pageHref = (value: number) => {
    const next = new URLSearchParams(params);
    if (value > 1) next.set('page', String(value)); else next.delete('page');
    return '/shop' + (next.size ? '?' + next.toString() : '');
  };
  return {
    ...catalog, loading: catalog.loading || (!catalog.error && !current?.data && !current?.error), error: catalog.error || current?.error,
    reload: () => { if (catalog.error) catalog.reload(); else setAttempt(value => value + 1); },
    activeCategory, setActiveCategory: (value: string) => updateParam('category', value),
    search, setSearch: (value: string) => updateParam('q', value), sortBy, setSortBy: (value: string) => updateParam('sort', value === 'featured' ? '' : value),
    priceRange, setPriceRange: (value: string) => updateParam('price', value === 'all' ? '' : value),
    clearFilters: () => setParams(previous => { const next = new URLSearchParams(previous); next.delete('category'); next.delete('price'); next.delete('page'); return next; }, { replace: true, state: { preserveScroll: true } }),
    page, pageHref, total: current?.data?.total ?? 0, totalPages: current?.data?.totalPages ?? 0,
    sorted, selectedVariants, filtersExpanded, toggleFilters: () => setFiltersExpanded(value => !value),
  };
}
export type ProductsModel = ReturnType<typeof useProducts>;
