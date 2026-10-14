import { createContext } from 'react';
import type { Product, Category } from './shop.types';
export interface CatalogState { products: Product[]; categories: Category[]; loading: boolean; error: unknown; reload: () => void; }
export const CatalogContext = createContext<CatalogState | null>(null);
