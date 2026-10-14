import { useEffect, useState, type ReactNode } from 'react';
import { CatalogContext, type CatalogState } from './catalog.context';
import { loadCatalog } from './shop.service';
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Omit<CatalogState, 'reload'>>({ products: [], categories: [], loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setState(previous => ({ ...previous, loading: true, error: null }));
    loadCatalog(controller.signal).then(data => { if (active) setState({ ...data, loading: false, error: null }); })
      .catch(error => { if (active) setState({ products: [], categories: [], loading: false, error }); });
    return () => { active = false; controller.abort(); };
  }, [version]);
  return <CatalogContext.Provider value={{ ...state, reload: () => setVersion(previous => previous + 1) }}>{children}</CatalogContext.Provider>;
}
