export type ProductCategory = "Bouquets" | "Arrangements" | "Dried Flowers" | "Gift Sets";
export interface Product {
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
