export { ShopView } from "./components/ShopView";
export { ProductCard } from "./components/ProductCard";
export { ProductGrid } from "./components/ProductGrid";
export { FilterBar } from "./components/FilterBar";
export { useProducts } from "./hooks/useProducts";
export { getProducts, getProduct, getCategories } from "./shop.service";
export type { Product, ProductCategory, ProductFilters } from "./shop.types";

export { normalizeProduct } from "./shop.service";
export type { ProductDto } from "./shop.types";
