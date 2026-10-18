import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { ShoppingBag } from "lucide-react";
import type { ProductsModel } from "../hooks/useProducts";
import { FilterBar } from "./FilterBar";
import { ProductGrid } from "./ProductGrid";
import { apiErrorKey } from '@/shared/api/client';

export function ShopView(model: ProductsModel & {
  added: number[];
  toggleAdd: (id: number, variantId?: number) => void;
  itemCount: number;
  cartError?: string;
}) {
  const { t } = useLocale("shop");
  return <main data-shop-layout className="min-h-screen bg-lunara-cream font-body">
    <div className="mx-auto max-w-[1440px] px-5 pt-10 pb-10 sm:px-8 sm:pt-12">
      <p className="mb-3 text-xs tracking-[0.16em] text-lunara-body uppercase sm:text-sm">{t('Fresh flower collection')}</p>
      <h1 className="font-display text-[clamp(2.2rem,5vw,3.2rem)] leading-tight tracking-tight text-lunara-ink">{t('Lunarra Flowers')}</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-lunara-body">{t("Discover handcrafted arrangements for every occasion")}</p>
    </div>
    <div className="mx-auto max-w-[1440px] px-5 pb-10 sm:px-8">
      <FilterBar {...model} count={model.sorted.length} />
      {model.loading ? <p role="status" className="py-12 text-center text-lunara-body">{t('Loading catalog')}</p> : model.error ? <div role="alert" className="rounded-xl bg-lunara-blush p-6 text-lunara-ink">{t(apiErrorKey(model.error))}<button onClick={model.reload} className="ml-4 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div> : <ProductGrid appearance="featured" products={model.sorted} added={model.added} onAdd={model.toggleAdd} selectedVariants={model.selectedVariants} />}
      {model.cartError && <p role="alert" className="mt-4 text-lunara-ink">{t(model.cartError)}</p>}
      {model.itemCount > 0 && <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2">
        <Link to="/cart" className="flex items-center gap-3 rounded-full bg-lunara-ink px-8 py-4 text-[0.85rem] whitespace-nowrap text-white shadow-2xl"><ShoppingBag size={18} /> {t("viewCartCount", { count: model.itemCount })}</Link>
      </div>}
    </div>
  </main>;
}
