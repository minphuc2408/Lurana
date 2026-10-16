import { useLocale } from "@/shared/i18n";
import { apiErrorKey } from '@/shared/api/client';
import { ProductGrid } from '@/features/shop';
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { HomeModel } from "../hooks/useHome";
export function FeaturedCollection(model: HomeModel) {
  const { t } = useLocale("landing");
  return <section id="featured" aria-labelledby="featured-title" className="space-y-6">
    <div className="flex flex-col justify-between gap-4 border-b border-lunara-border pb-5 sm:flex-row sm:items-end">
      <div><h2 id="featured-title" className="font-display text-[clamp(1.7rem,3vw,2.4rem)] leading-tight font-semibold tracking-tight text-lunara-ink">{t('Featured Arrangements')}</h2><p className="mt-2 text-sm leading-6 text-lunara-body">{t('Our most loved designs, perfect for every occasion.')}</p></div>
      <Link to="/shop" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-xs font-medium text-lunara-rose-strong underline-offset-4 hover:underline sm:self-auto">{t('View All Products')}<ArrowRight size={15} aria-hidden="true" /></Link>
    </div>
    {model.loading ? <p role="status" className="py-12 text-center text-lunara-body">{t('Loading catalog')}</p>
      : model.error ? <div role="alert" className="rounded-2xl border border-lunara-border bg-lunara-blush p-6 text-lunara-ink">{t(apiErrorKey(model.error))}<button onClick={model.reload} className="ml-4 min-h-11 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div>
      : !model.featuredProducts.length ? <p role="status" className="py-12 text-center text-lunara-body">{t('No featured products')}</p>
      : <ProductGrid products={model.featuredProducts} added={model.added} onAdd={model.addItem} selectedVariants={model.selectedVariants} onSelectVariant={model.selectVariant} />}
    {model.cartError && <p role="alert" className="text-sm text-lunara-ink">{t(model.cartError)}</p>}
  </section>;
}
