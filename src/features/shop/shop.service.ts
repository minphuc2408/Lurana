import { products, categories } from "./data/shop.data.ts";
import type { Product, ProductDto, ProductFilters } from "./shop.types.ts";
import { getLocalizedName, normalizeSearch } from "../../shared/i18n/language.ts";
export function normalizeProduct(product: ProductDto): Product {
  return { ...product, name: getLocalizedName(product, "en") };
}
export function getProducts(): Product[] { return structuredClone(products); }
export function getProduct(id: number): Product | undefined {
  const product = products.find(item => item.id === id);
  return product ? { ...product } : undefined;
}
export function getCategories() { return [...categories]; }
export function selectProducts(items: Product[], filters: ProductFilters) {
  const search = normalizeSearch(filters.search);
  const selected = items.filter(product => (filters.category === "All" || product.category === filters.category) && [product.name, product.name_en, product.name_vi, product.name_vn].some(name => name && normalizeSearch(name).includes(search)));
  return selected.sort((a, b) => {
    if (filters.sort === "low") return a.price - b.price;
    if (filters.sort === "high") return b.price - a.price;
    if (filters.sort === "rating") return b.rating - a.rating;
    return 0;
  });
}
