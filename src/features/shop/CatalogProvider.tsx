import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CatalogContext, type CatalogState } from './catalog.context';
import type { ProductApiDto } from './shop.types';
import { loadCatalog, normalizeProduct } from './shop.service';
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Omit<CatalogState, 'reload' | 'rememberProduct'>>({ products: [], categories: [], loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setState(previous => ({ ...previous, loading: true, error: null }));
    loadCatalog(controller.signal).then(data => { if (active) setState({ ...data, loading: false, error: null }); })
      .catch(error => { if (active) setState({ products: [], categories: [], loading: false, error }); });
    return () => { active = false; controller.abort(); };
  }, [version]);
  const rememberProduct = useCallback((product: ProductApiDto) => setState(previous => {
    const normalized = normalizeProduct(product, previous.categories);
    const exists = previous.products.some(item => item.id === product.id);
    return { ...previous, products: exists ? previous.products.map(item => item.id === product.id ? normalized : item) : [...previous.products, normalized] };
  }), []);
  return <CatalogContext.Provider value={{ ...state, rememberProduct, reload: () => setVersion(previous => previous + 1) }}>{children}</CatalogContext.Provider>;
}
