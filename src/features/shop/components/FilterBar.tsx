import { useLocale, getLocalizedName } from "@/shared/i18n";
import { X } from "lucide-react";
import { Dropdown } from "@/shared/ui/dropdown";
import { cn } from "@/shared/lib/utils";
import type { ProductsModel } from "../hooks/useProducts";

export function FilterBar(model: Pick<ProductsModel, "search" | "setSearch" | "sortBy" | "setSortBy" | "priceRange" | "setPriceRange" | "categories" | "activeCategory" | "setActiveCategory"> & { count: number }) {
  const { t, language } = useLocale("shop");
  const categoryClass = (active: boolean) => cn('min-h-10 rounded-[2px] border px-3 py-2 text-sm transition-colors sm:px-4', active ? 'border-lunara-rose-strong bg-lunara-surface text-lunara-ink' : 'border-lunara-border bg-lunara-cream text-lunara-body hover:border-lunara-rose-strong hover:text-lunara-ink');
  return <>
    <div data-shop-filters className="mb-5 flex flex-col gap-5 border-y border-lunara-border py-6 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
      <div role="group" aria-label={t('Category')} className="flex min-w-0 flex-wrap items-center gap-2">
        <button type="button" aria-pressed={model.activeCategory === 'All'} onClick={() => model.setActiveCategory('All')} className={categoryClass(model.activeCategory === 'All')}>{t('All')}</button>
        {model.categories.map(category => <button type="button" key={category.code} aria-pressed={model.activeCategory === category.code} onClick={() => model.setActiveCategory(category.code)} className={categoryClass(model.activeCategory === category.code)}>{getLocalizedName(category, language)}</button>)}
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-5 xl:shrink-0">
        <div className="min-w-0 sm:flex sm:items-center sm:gap-3">
          <label htmlFor="shop-price-range" className="mb-2 block text-sm whitespace-nowrap text-lunara-ink sm:mb-0">{t('Price range')}:</label>
          <Dropdown id="shop-price-range" aria-label={t('Price range')} value={model.priceRange} onValueChange={model.setPriceRange} className="min-h-10 rounded-[2px] border-lunara-border bg-lunara-cream px-3 py-2 text-sm sm:w-44">
            <option value="all">{t('All prices')}</option>
            <option value="under-500">{t('Under 500,000 ₫')}</option>
            <option value="500-1000">{t('500,000–1,000,000 ₫')}</option>
            <option value="1000-2000">{t('1,000,000–2,000,000 ₫')}</option>
            <option value="over-2000">{t('2,000,000 ₫ and up')}</option>
          </Dropdown>
        </div>
        <div className="min-w-0 sm:flex sm:items-center sm:gap-3">
          <label htmlFor="shop-sort" className="mb-2 block text-sm whitespace-nowrap text-lunara-ink sm:mb-0">{t('Sort by')}:</label>
          <Dropdown id="shop-sort" aria-label={t('Sort products')} value={model.sortBy} onValueChange={model.setSortBy} className="min-h-10 rounded-[2px] border-lunara-border bg-lunara-cream px-3 py-2 text-sm sm:w-44">
            <option value="featured">{t('Featured products')}</option>
            <option value="low">{t('Price: Low to High')}</option>
            <option value="high">{t('Price: High to Low')}</option>
          </Dropdown>
        </div>
      </div>
    </div>
    <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-lunara-body">
      <p aria-live="polite">{t("productCount", { count: model.count })}</p>
      {model.search && <span className="inline-flex min-w-0 items-center gap-2">{t('Results for {{query}}', { query: model.search })}<button type="button" aria-label={t('Clear search')} onClick={() => model.setSearch('')} className="inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full hover:bg-lunara-blush"><X size={15} aria-hidden="true" /></button></span>}
    </div>
  </>;
}
