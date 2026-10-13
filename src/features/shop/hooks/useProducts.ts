import { useState } from "react";
import { getCategories, getProducts, selectProducts } from "../shop.service";
export function useProducts() {
  const [products] = useState(getProducts);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [liked, setLiked] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const sorted = selectProducts(products, { category: activeCategory, search, sort: sortBy });
  const toggleLike = (id: number) => setLiked(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  return { activeCategory, setActiveCategory, search, setSearch, sortBy, setSortBy, liked, toggleLike, filterOpen, setFilterOpen, sorted, categories: getCategories() };
}
export type ProductsModel = ReturnType<typeof useProducts>;
