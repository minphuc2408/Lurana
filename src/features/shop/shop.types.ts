export type ProductCategory = "Bouquets" | "Arrangements" | "Dried Flowers" | "Gift Sets";
import type { LocalizedNameFields } from "@/shared/i18n/language";
export interface Product extends LocalizedNameFields {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  tag: string;
  rating: number;
  reviews: number;
}
export interface ProductFilters { category: string; search: string; sort: string; }
export type ProductDto = Omit<Product, "name"> & LocalizedNameFields;
