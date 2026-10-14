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
  return <div className="min-h-screen bg-lunara-cream font-body">
    <div className="bg-[linear-gradient(135deg,#F9EDE9_0%,#F5E8E4_100%)] px-6 pt-[60px] pb-10">
      <div className="mx-auto max-w-7xl text-center">
        <span className="text-xs tracking-[0.2em] text-lunara-rose-strong uppercase">{t("Our Collection")}</span>
        <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.5rem)] font-semibold text-lunara-ink">{t("The Lunara Shop")}</h1>
        <p className="mt-3 text-[0.92rem] text-lunara-body">{t("Discover handcrafted arrangements for every occasion")}</p>
      </div>
    </div>
    <div className="mx-auto max-w-7xl px-6 py-10">
      <FilterBar {...model} count={model.sorted.length} />
      {model.loading ? <p role="status" className="py-12 text-center text-lunara-body">{t('Loading catalog')}</p> : model.error ? <div role="alert" className="rounded-xl bg-lunara-blush p-6 text-lunara-ink">{t(apiErrorKey(model.error))}<button onClick={model.reload} className="ml-4 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div> : <ProductGrid products={model.sorted} liked={model.liked} added={model.added} onLike={model.toggleLike} onAdd={model.toggleAdd} selectedVariants={model.selectedVariants} onSelectVariant={model.selectVariant} />}
      {model.cartError && <p role="alert" className="mt-4 text-lunara-ink">{t(model.cartError)}</p>}
      {model.itemCount > 0 && <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2">
        <Link to="/cart" className="flex items-center gap-3 rounded-full bg-lunara-ink px-8 py-4 text-[0.85rem] whitespace-nowrap text-white shadow-2xl"><ShoppingBag size={18} /> {t("viewCartCount", { count: model.itemCount })}</Link>
      </div>}
    </div>
  </div>;
}
