export { ShopView } from "./components/ShopView";
export { ProductCard } from "./components/ProductCard";
export { ProductGrid } from "./components/ProductGrid";
export { FilterBar } from "./components/FilterBar";
export { useProducts } from "./hooks/useProducts";
export { getProducts, getProduct, getCategories } from "./shop.service";
export type { Product, ProductCategory, ProductFilters } from "./shop.types";

export { normalizeProduct } from "./shop.service";
export type { ProductDto } from "./shop.types";
export { CatalogProvider } from './CatalogProvider';
export { useCatalog } from './hooks/useCatalog';
export type { Category, ProductVariant, ProductApiDto } from './shop.types';

export { ProductDetailView } from './components/ProductDetailView';
export { useProductDetail } from './hooks/useProductDetail';
