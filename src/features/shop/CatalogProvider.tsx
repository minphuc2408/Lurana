import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CatalogContext, type CatalogState } from './catalog.context';
import type { ProductApiDto } from './shop.types';
import { loadCatalog, loadProductsByVariants, normalizeProduct } from './shop.service';
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Pick<CatalogState, 'products' | 'categories' | 'loading' | 'error'>>({ products: [], categories: [], loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setState(previous => ({ ...previous, loading: true, error: null }));
    loadCatalog(controller.signal).then(data => { if (active) setState({ ...data, loading: false, error: null }); })
      .catch(error => { if (active) setState({ products: [], categories: [], loading: false, error }); });
    return () => { active = false; controller.abort(); };
  }, [version]);
  const rememberProducts = useCallback((incoming: ProductApiDto[]) => setState(previous => {
    const products = new Map(previous.products.map(product => [product.id, product]));
    for (const product of incoming) products.set(product.id, normalizeProduct(product, previous.categories));
    return { ...previous, products: [...products.values()] };
  }), []);
  const rememberProduct = useCallback((product: ProductApiDto) => rememberProducts([product]), [rememberProducts]);
  const loadVariants = useCallback(async (variantIds: number[], signal?: AbortSignal) => {
    const response = await loadProductsByVariants(variantIds, signal);
    if (!signal?.aborted) rememberProducts(response.items);
    return response.items.map(product => normalizeProduct(product, state.categories));
  }, [rememberProducts, state.categories]);
  return <CatalogContext.Provider value={{ ...state, rememberProduct, rememberProducts, loadVariants, reload: () => setVersion(previous => previous + 1) }}>{children}</CatalogContext.Provider>;
}
