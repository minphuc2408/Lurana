import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { selectProducts, smallestVariant } from "../shop.service";
import { useCatalog } from './useCatalog';

export function useProducts() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") || "All";
  const search = params.get("q") || "";
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const selectedVariants = useMemo(() => Object.fromEntries(catalog.products.flatMap(product => {
    const variant = smallestVariant(product.variants || []);
    return variant ? [[product.id, variant.id]] : [];
  })), [catalog.products]);
  const updateParam = (key: string, value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (!value || value === 'All') next.delete(key); else next.set(key, value);
    return next;
  }, { replace: true, state: { preserveScroll: true } });
  const sorted = selectProducts(catalog.products, { category: activeCategory, search, sort: sortBy, priceRange });
  return {
    ...catalog, activeCategory, setActiveCategory: (value: string) => updateParam('category', value),
    search, setSearch: (value: string) => updateParam('q', value), sortBy, setSortBy, priceRange, setPriceRange,
    sorted, selectedVariants, filtersExpanded, toggleFilters: () => setFiltersExpanded(value => !value),
  };
}
export type ProductsModel = ReturnType<typeof useProducts>;
