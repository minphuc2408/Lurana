import { useLocale, getLocalizedName } from "@/shared/i18n";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useId } from 'react';
import { cn } from "@/shared/lib/utils";
import type { ProductsModel } from "../hooks/useProducts";

export function FilterBar(model: Pick<ProductsModel, "priceRange" | "setPriceRange" | "categories" | "activeCategory" | "setActiveCategory" | "filtersExpanded" | "toggleFilters" | "clearFilters">) {
  const { t, language } = useLocale("shop");
  const expanded = model.filtersExpanded;
  const filterId = useId();
  const adjusted = model.priceRange !== 'all' || model.activeCategory !== 'All';
  const prices = ['all', 'under-500', '500-1000', '1000-2000', 'over-2000'];
  const priceLabels = ['All prices', 'Under 500,000 ₫', '500,000–1,000,000 ₫', '1,000,000–2,000,000 ₫', '2,000,000 ₫ and up'];
  const optionClass = 'flex min-h-11 items-center gap-3 py-2 text-sm leading-6 text-lunara-ink transition-colors hover:text-lunara-text-hover';
  return <aside data-shop-filters aria-label={t('Filters')} className="min-w-0 self-start">
    <h2 className="hidden min-h-11 items-center text-lg font-medium text-lunara-ink lg:flex">{t('Filters')}</h2>
    <button type="button" data-shop-filter-toggle aria-expanded={expanded} aria-controls={filterId} onClick={model.toggleFilters} className="inline-flex min-h-11 w-full items-center justify-between gap-2 text-base text-lunara-ink lg:hidden"><span className="inline-flex items-center gap-2"><SlidersHorizontal size={18} aria-hidden="true" />{t('Filters')}{adjusted && <span className="size-2 rounded-full bg-lunara-rose-strong" aria-label={t('Filters applied')} />}</span><ChevronDown size={18} aria-hidden="true" className={cn('transition-transform motion-reduce:transition-none', expanded && 'rotate-180')} /></button>
    <div id={filterId} className={cn('min-w-0 gap-x-10 gap-y-8 pt-5 sm:grid-cols-2 lg:grid lg:grid-cols-1 lg:pt-6', expanded ? 'grid' : 'hidden')}>
      <fieldset className="min-w-0">
        <legend className="mb-3 text-base font-medium text-lunara-ink">{t('Category')}</legend>
        {[{ code: 'All', name_en: t('All'), name_vi: t('All') }, ...model.categories].map(category => <label key={category.code} className={optionClass}>
          <input type="radio" name={filterId + '-category'} value={category.code} checked={model.activeCategory === category.code} onChange={() => model.setActiveCategory(category.code)} className="size-4 shrink-0 accent-lunara-rose-strong" />
          <span className="min-w-0 break-words">{getLocalizedName(category, language)}</span>
        </label>)}
      </fieldset>
      <fieldset className="min-w-0">
        <legend className="mb-3 text-base font-medium text-lunara-ink">{t('Price range')}</legend>
        {prices.map((value, index) => <label key={value} className={optionClass}>
          <input type="radio" name={filterId + '-price'} value={value} checked={model.priceRange === value} onChange={() => model.setPriceRange(value)} className="size-4 shrink-0 accent-lunara-rose-strong" />
          <span className="min-w-0 break-words tabular-nums">{t(priceLabels[index])}</span>
        </label>)}
      </fieldset>
      {adjusted && <button type="button" onClick={model.clearFilters} className="w-fit min-h-11 text-sm text-lunara-ink underline underline-offset-4 hover:text-lunara-text-hover">{t('Clear filters')}</button>}
    </div>
  </aside>;
}
