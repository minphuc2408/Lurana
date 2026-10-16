import type { Product, ProductDto, ProductApiDto, Category, ProductFilters } from "./shop.types.ts";
import { apiRequest } from '../../shared/api/client.ts';
import { getLocalizedName, normalizeSearch } from "../../shared/i18n/language.ts";
let products: Product[] = [];
let categories: Category[] = [];
export function normalizeProduct(product: ProductDto | ProductApiDto, categoryList: Category[] = []): Product {
  if (!('images' in product)) return { ...product, name: getLocalizedName(product, "en") };
  const category = categoryList.find(item => item.code === product.category_code);
  const badge = { BEST_SELLER: 'Bestseller', HOT: 'Hot', NEW: 'New' };
  return { id: product.id, slug: product.slug, name: product.name_en, name_en: product.name_en, name_vi: product.name_vi,
    category: category?.name_en || product.category_code, category_code: product.category_code,
    price: product.variants.length ? Math.min(...product.variants.map(variant => variant.price)) : 0,
    image: (product.images.find(image => image.is_primary) || product.images[0])?.url || '',
    tag: product.badge_code ? badge[product.badge_code] : '', is_featured: product.is_featured,
    description_en: product.description_en, description_vi: product.description_vi,
    variants: structuredClone(product.variants) };
}
export async function loadCatalog(signal?: AbortSignal) {
  const [categoryList, response] = await Promise.all([apiRequest<Category[]>('/categories', { signal }), apiRequest<{ items: ProductApiDto[] }>('/products', { signal })]);
  const items = response.items.map(product => normalizeProduct(product, categoryList));
  products = items; categories = categoryList;
  return { products: structuredClone(items), categories: structuredClone(categoryList) };
}
export function getProducts(): Product[] { return structuredClone(products); }
export function getProduct(id: number): Product | undefined {
  const product = products.find(item => item.id === id);
  return product ? structuredClone(product) : undefined;
}
export function getCategories() { return ['All', ...categories.map(category => category.name_en)]; }
export function selectProducts(items: Product[], filters: ProductFilters) {
  const search = normalizeSearch(filters.search);
  const selected = items.filter(product => (filters.category === "All" || product.category_code === filters.category || product.category === filters.category) && [product.name, product.name_en, product.name_vi, product.name_vn].some(name => name && normalizeSearch(name).includes(search)));
  return selected.sort((a, b) => {
    if (filters.sort === "low") return a.price - b.price;
    if (filters.sort === "high") return b.price - a.price;
    if (filters.sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
  });
}
