import { useLocale, getLocalizedName } from "@/shared/i18n";
import { Search, SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import type { ProductsModel } from "../hooks/useProducts";
export function FilterBar(model: Pick<ProductsModel, "search" | "setSearch" | "sortBy" | "setSortBy" | "filterOpen" | "setFilterOpen" | "sortMenuOpen" | "setSortMenuOpen" | "sortMenuRef" | "categories" | "activeCategory" | "setActiveCategory"> & {
  count: number;
}) {
  const { t, language } = useLocale("shop");
  const sortOptions = [
    { value: "featured", label: t("Featured") },
    { value: "low", label: t("Price: Low to High") },
    { value: "high", label: t("Price: High to Low") },
  ];
  const selectedSort = sortOptions.find(option => option.value === model.sortBy) ?? sortOptions[0];
  return <>
    <div className="mb-8 flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-lunara-body" />
        <Input aria-label={t("Search flowers")} placeholder={t("Search flowers...")} value={model.search} onChange={event => model.setSearch(event.target.value)} className="h-auto rounded-full border-lunara-border bg-white py-3 pr-10 pl-10 text-[0.88rem] text-lunara-ink shadow-none focus-visible:border-lunara-rose focus-visible:ring-lunara-rose-light" />
        {model.search && <button aria-label={t("Clear search")} onClick={() => model.setSearch("")} className="absolute top-1/2 right-4 -translate-y-1/2 text-lunara-body"><X size={14} /></button>}
      </div>
      <div className="flex gap-3">
        <div ref={model.sortMenuRef} className="relative min-w-[190px]">
          <button type="button" aria-haspopup="listbox" aria-expanded={model.sortMenuOpen} aria-label={t("Sort products")} onClick={() => model.setSortMenuOpen(open => !open)} className="flex w-full items-center justify-between gap-4 rounded-full border border-lunara-border bg-white px-5 py-3 text-left text-[0.85rem] text-lunara-body outline-offset-0 focus-visible:border-lunara-rose focus-visible:outline-2 focus-visible:outline-lunara-rose-light">
            <span>{selectedSort.label}</span>
            <ChevronDown aria-hidden="true" size={15} className={cn("shrink-0 transition-transform", model.sortMenuOpen && "rotate-180")} />
          </button>
          {model.sortMenuOpen && <div role="listbox" aria-label={t("Sort products")} className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-full overflow-hidden rounded-2xl border border-lunara-border bg-lunara-cream p-1.5 shadow-lg">
            {sortOptions.map(option => <button key={option.value} type="button" role="option" aria-selected={model.sortBy === option.value} onClick={() => { model.setSortBy(option.value); model.setSortMenuOpen(false); }} className={cn("flex w-full items-center justify-between gap-4 rounded-xl px-4 py-2.5 text-left text-sm transition-colors", model.sortBy === option.value ? "bg-lunara-blush font-medium text-lunara-rose-strong" : "text-lunara-body hover:bg-white")}>
              <span>{option.label}</span>
              {model.sortBy === option.value && <Check aria-hidden="true" size={15} />}
            </button>)}
          </div>}
        </div>
        <button aria-expanded={model.filterOpen} onClick={() => model.setFilterOpen(!model.filterOpen)} className={cn("flex items-center gap-2 rounded-full border px-5 py-3 text-[0.85rem] outline-offset-0 focus-visible:outline-2 focus-visible:outline-lunara-rose-light", model.filterOpen ? "border-lunara-rose-strong bg-lunara-rose-strong text-white" : "border-lunara-rose bg-white text-lunara-rose-strong")}><SlidersHorizontal size={16} /> {t("Filters")}</button>
      </div>
    </div>
    <div className="mb-10 flex flex-wrap gap-3">
      <button aria-pressed={model.activeCategory === 'All'} onClick={() => model.setActiveCategory('All')} className="rounded-full border border-lunara-border bg-white px-5 py-2 text-sm text-lunara-ink">{t('All')}</button>
      {model.categories.map(category => <button key={category.code} aria-pressed={model.activeCategory === category.code} onClick={() => model.setActiveCategory(category.code)} className={cn("rounded-full border px-5 py-2 text-[0.82rem] tracking-[0.08em] transition-colors", model.activeCategory === category.code ? "border-lunara-rose bg-lunara-rose-strong text-white" : "border-lunara-border bg-white text-lunara-body")}>{getLocalizedName(category, language)}</button>)}
      <span className="ml-2 self-center text-[0.82rem] text-lunara-body" aria-live="polite">{t("productCount", { count: model.count })}</span>
    </div>
  </>;
}
