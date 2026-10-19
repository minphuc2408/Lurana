import { useLocale } from "@/shared/i18n";
import { apiErrorKey } from '@/shared/api/client';
import { ProductGrid } from '@/features/shop';
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { HomeModel } from "../hooks/useHome";
export function FeaturedCollection(model: HomeModel) {
  const { t } = useLocale("landing");
  return <section id="featured" aria-labelledby="featured-title" className="border-t border-lunara-border bg-lunara-cream">
    <div className="mx-auto max-w-[var(--lunara-content-max-width)] space-y-8 px-5 py-12 sm:space-y-10 sm:px-8 sm:py-16">
    <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2 border-b border-lunara-featured-rule pb-3">
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-medium tracking-[0.16em] text-lunara-editorial-label uppercase">{t('Todays selection')}</p>
        <h2 id="featured-title" className="font-display text-2xl leading-tight tracking-tight text-lunara-ink sm:text-3xl">{t('Featured products')}</h2>
      </div>
      <Link to="/shop" className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-lunara-secondary-link transition-colors hover:text-lunara-ink">{t('View all')}<ArrowRight size={16} aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" /></Link>
    </div>
    {model.loading ? <p role="status" className="py-12 text-center text-lunara-body">{t('Loading catalog')}</p>
      : model.error ? <div role="alert" className="rounded-2xl border border-lunara-border bg-lunara-blush p-6 text-lunara-ink">{t(apiErrorKey(model.error))}<button onClick={model.reload} className="ml-4 min-h-11 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div>
      : !model.featuredProducts.length ? <p role="status" className="py-12 text-center text-lunara-body">{t('No featured products')}</p>
      : <ProductGrid appearance="featured" products={model.featuredProducts.slice(0, 4)} added={model.added} onAdd={model.addItem} selectedVariants={model.selectedVariants} onSelectVariant={model.selectVariant} />}
    {model.cartError && <p role="alert" className="text-sm text-lunara-ink">{t(model.cartError)}</p>}
    </div>
  </section>;
}
