import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { selectProducts } from "../shop.service";
import { useCatalog } from './useCatalog';
export function useProducts() {
  const catalog = useCatalog();
  const [params] = useSearchParams();
  const products = catalog.products;
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  const [activeCategory, setActiveCategory] = useState(params.get("category") || "All");
  const [search, setSearch] = useState(params.get("q") || "");
  useEffect(() => {
    setActiveCategory(params.get("category") || "All");
    setSearch(params.get("q") || "");
  }, [params]);
  const [sortBy, setSortBy] = useState("featured");
  const [liked, setLiked] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) setSortMenuOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);
  const sorted = selectProducts(products, { category: activeCategory, search, sort: sortBy });
  const toggleLike = (id: number) => setLiked(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  return { ...catalog, activeCategory, setActiveCategory, search, setSearch, sortBy, setSortBy, liked, toggleLike, filterOpen, setFilterOpen, sortMenuOpen, setSortMenuOpen, sortMenuRef, sorted, selectedVariants,
    selectVariant: (productId: number, variantId: number) => setSelectedVariants(previous => ({ ...previous, [productId]: variantId })) };
}
export type ProductsModel = ReturnType<typeof useProducts>;
