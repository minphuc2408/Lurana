import { useState } from "react";
import { selectProducts } from "../shop.service";
import { useCatalog } from './useCatalog';
export function useProducts() {
  const catalog = useCatalog();
  const products = catalog.products;
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [liked, setLiked] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const sorted = selectProducts(products, { category: activeCategory, search, sort: sortBy });
  const toggleLike = (id: number) => setLiked(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  return { ...catalog, activeCategory, setActiveCategory, search, setSearch, sortBy, setSortBy, liked, toggleLike, filterOpen, setFilterOpen, sorted, selectedVariants,
    selectVariant: (productId: number, variantId: number) => setSelectedVariants(previous => ({ ...previous, [productId]: variantId })) };
}
export type ProductsModel = ReturnType<typeof useProducts>;
