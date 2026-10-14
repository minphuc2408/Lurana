import { useContext } from 'react';
import { CatalogContext } from '../catalog.context';
export function useCatalog() {
  const state = useContext(CatalogContext);
  if (!state) throw new Error('useCatalog requires CatalogProvider');
  return state;
}
