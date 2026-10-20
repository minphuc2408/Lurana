import { createContext } from 'react';
import type { Product, Category, ProductApiDto } from './shop.types';
export interface CatalogState {
  products: Product[]; categories: Category[]; loading: boolean; error: unknown; reload: () => void;
  rememberProduct: (product: ProductApiDto) => void;
  rememberProducts: (products: ProductApiDto[]) => void;
  loadVariants: (variantIds: number[], signal?: AbortSignal) => Promise<Product[]>;
}
export const CatalogContext = createContext<CatalogState | null>(null);
