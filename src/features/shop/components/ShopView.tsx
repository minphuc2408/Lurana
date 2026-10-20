import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { ShoppingBag, X } from "lucide-react";
import type { ProductsModel } from "../hooks/useProducts";
import { FilterBar } from "./FilterBar";
import { ProductGrid } from "./ProductGrid";
import { apiErrorKey } from '@/shared/api/client';
import { Dropdown } from '@/shared/ui/dropdown';
import { ProductPagination } from './ProductPagination';

export function ShopView(model: ProductsModel & {
  added: number[];
  toggleAdd: (id: number, variantId?: number) => void;
  itemCount: number;
  cartError?: string;
}) {
  const { t } = useLocale("shop");
  return <main data-shop-layout className="min-h-screen bg-lunara-cream font-body">
    <div data-shop-intro className="bg-lunara-shop-intro">
    <div className="mx-auto max-w-[var(--lunara-content-max-width)] px-5 pt-3 pb-8 text-center sm:px-8 sm:pt-4 sm:pb-10">
      <h1 className="font-display text-[clamp(2.2rem,5vw,3.2rem)] leading-tight tracking-tight text-lunara-ink">{t('Lunarra Flowers')}</h1>
      <p className="mx-auto mt-2 max-w-2xl text-base leading-6 text-lunara-body sm:mt-3 sm:leading-7">{t("Discover handcrafted arrangements for every occasion")}</p>
    </div>
    </div>
    <div data-shop-columns className="mx-auto grid max-w-[var(--lunara-content-max-width)] grid-cols-1 items-start gap-6 px-5 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,4fr)] lg:gap-8 xl:gap-10">
      <div data-shop-intro-separator aria-hidden="true" className="col-span-full h-px bg-lunara-border" />
      <FilterBar {...model} />
      <div data-shop-products className="min-w-0">
      <div className="mb-6 flex min-h-11 flex-wrap items-center justify-between gap-x-5 gap-y-3 sm:mb-8">
        <p aria-live="polite" className="text-sm text-lunara-body">{t('productCount', { count: model.total })}</p>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <label htmlFor="shop-sort" className="text-sm text-lunara-ink">{t('Sort by')}</label>
          <Dropdown id="shop-sort" aria-label={t('Sort products')} value={model.sortBy} onValueChange={model.setSortBy} className="w-auto max-w-full rounded-[2px] border-0 bg-transparent px-0 py-2 text-sm text-lunara-ink">
            <option value="featured">{t('Featured products')}</option>
            <option value="low">{t('Price: Low to High')}</option>
            <option value="high">{t('Price: High to Low')}</option>
          </Dropdown>
        </div>
        {model.search && <p className="flex w-full min-w-0 items-center gap-2 text-sm text-lunara-body"><span className="min-w-0 break-words">{t('Results for {{query}}', { query: model.search })}</span><button type="button" aria-label={t('Clear search')} onClick={() => model.setSearch('')} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center hover:text-lunara-text-hover"><X size={16} aria-hidden="true" /></button></p>}
      </div>
      {model.loading ? <p role="status" className="py-12 text-center text-lunara-body">{t('Loading catalog')}</p> : model.error ? <div role="alert" className="rounded-xl bg-lunara-blush p-6 text-lunara-ink">{t(apiErrorKey(model.error))}<button onClick={model.reload} className="ml-4 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div> : <ProductGrid appearance="featured" products={model.sorted} added={model.added} onAdd={model.toggleAdd} selectedVariants={model.selectedVariants} />}
      {!model.loading && !model.error && <ProductPagination {...model} />}
      {model.cartError && <p role="alert" className="mt-4 text-lunara-ink">{t(model.cartError)}</p>}
      </div>
      {model.itemCount > 0 && <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2">
        <Link to="/cart" data-floating-cart className="flex items-center gap-3 rounded-full bg-lunara-floating-cart px-8 py-4 text-[0.85rem] whitespace-nowrap text-lunara-on-floating-cart shadow-2xl"><ShoppingBag data-theme-icon size={18} aria-hidden="true" /> {t("viewCartCount", { count: model.itemCount })}</Link>
      </div>}
    </div>
  </main>;
}
