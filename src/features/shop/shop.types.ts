export type ProductCategory = string;
import type { LocalizedNameFields } from "@/shared/i18n/language";
export interface Product extends LocalizedNameFields {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  tag: string;
  description_en?: string | null;
  description_vi?: string | null;
  rating?: number;
  reviews?: number;
  slug?: string;
  category_code?: string;
  is_featured?: boolean;
  variants?: ProductVariant[];
}
export interface ProductVariant { id: number; sku: string; size_code: 'S'|'M'|'L'|'STANDARD'|'DELUXE'; price: number; compare_at_price: number|null; in_stock: boolean; low_stock: boolean; max_quantity: number; }
export interface Category { id: number; code: string; slug: string; name_en: string; name_vi: string; image_url?: string | null; }
export interface ProductApiDto {
  id: number; slug: string; category_code: string; name_en: string; name_vi: string;
  description_vi: string|null; description_en: string|null; badge_code: 'BEST_SELLER'|'HOT'|'NEW'|null; is_featured: boolean;
  images: { url: string; alt_vi: string|null; alt_en: string|null; is_primary: boolean }[]; variants: ProductVariant[];
}
export interface ProductFilters { category: string; search: string; sort: string; }
export type ProductDto = Omit<Product, "name"> & LocalizedNameFields;
