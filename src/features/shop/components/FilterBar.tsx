import { useLocale } from "@/shared/i18n";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import type { ProductsModel } from "../hooks/useProducts";
export function FilterBar(model: Pick<ProductsModel, "search" | "setSearch" | "sortBy" | "setSortBy" | "filterOpen" | "setFilterOpen" | "categories" | "activeCategory" | "setActiveCategory"> & {
  count: number;
}) {
  const { t } = useLocale("shop");
  return <>
    <div className="mb-8 flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-lunara-body" />
        <Input aria-label={t("Search flowers")} placeholder={t("Search flowers...")} value={model.search} onChange={event => model.setSearch(event.target.value)} className="h-auto rounded-full border-lunara-border bg-white py-3 pr-10 pl-10 text-[0.88rem] text-lunara-ink shadow-none focus-visible:border-lunara-rose-strong focus-visible:ring-lunara-ink" />
        {model.search && <button aria-label={t("Clear search")} onClick={() => model.setSearch("")} className="absolute top-1/2 right-4 -translate-y-1/2 text-lunara-body"><X size={14} /></button>}
      </div>
      <div className="flex gap-3">
        <select aria-label={t("Sort products")} value={model.sortBy} onChange={event => model.setSortBy(event.target.value)} className="rounded-full border border-lunara-border bg-white px-5 py-3 text-[0.85rem] text-lunara-body">
          <option value="featured">{t("Featured")}</option><option value="low">{t("Price: Low to High")}</option><option value="high">{t("Price: High to Low")}</option><option value="rating">{t("Top Rated")}</option>
        </select>
        <button aria-expanded={model.filterOpen} onClick={() => model.setFilterOpen(!model.filterOpen)} className={cn("flex items-center gap-2 rounded-full border border-lunara-rose px-5 py-3 text-[0.85rem]", model.filterOpen ? "bg-lunara-rose-strong text-white" : "bg-white text-lunara-rose-strong")}><SlidersHorizontal size={16} /> {t("Filters")}</button>
      </div>
    </div>
    <div className="mb-10 flex flex-wrap gap-3">
      {model.categories.map(category => <button key={category} aria-pressed={model.activeCategory === category} onClick={() => model.setActiveCategory(category)} className={cn("rounded-full border px-5 py-2 text-[0.82rem] tracking-[0.08em] transition-colors", model.activeCategory === category ? "border-lunara-rose bg-lunara-rose-strong text-white" : "border-lunara-border bg-white text-lunara-body")}>{t(category)}</button>)}
      <span className="ml-2 self-center text-[0.82rem] text-lunara-body" aria-live="polite">{t("productCount", { count: model.count })}</span>
    </div>
  </>;
}
