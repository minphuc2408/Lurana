import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { useLocale, getLocalizedName } from "@/shared/i18n";
import { FeaturedCollection } from "./FeaturedCollection";
import { Benefits } from "./Benefits";
import { Hero } from "./Hero";
import type { HomeModel } from "../hooks/useHome";
export function HomeView(model: HomeModel) {
  const { t, language } = useLocale("landing");
  return <main data-home-layout className="mx-auto max-w-[1400px] space-y-7 px-4 pt-5 pb-16 font-body sm:space-y-8 sm:px-6 lg:space-y-9 lg:px-10">
    <Hero />
    {!model.loading && !model.error && model.categories.length > 0 && <nav aria-label={t('Shop by Category')} data-home-categories className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {model.categories.map(category => <Link key={category.id} to={`/shop?category=${encodeURIComponent(category.code)}`} className="group flex min-h-24 min-w-0 items-center gap-3 rounded-2xl border border-lunara-border bg-lunara-blush/70 p-3 transition-colors hover:border-lunara-rose-strong sm:p-4">
        <span data-editorial-image="category" aria-hidden="true" className="hidden size-11 shrink-0 rounded-full border border-lunara-border bg-lunara-cream min-[390px]:block" />
        <div className="min-w-0 flex-1"><h2 className="font-display text-base leading-6 font-semibold text-lunara-ink">{getLocalizedName(category, language)}</h2><p className="mt-1 text-[0.65rem] leading-4 text-lunara-body">{t('Discover the Collection')}</p></div>
        <ChevronRight size={15} className="shrink-0 text-lunara-rose-strong" aria-hidden="true" />
      </Link>)}
      <Link to="/shop" className="flex min-h-24 items-center justify-between gap-3 rounded-2xl border border-lunara-border bg-lunara-ink p-4 text-lunara-cream transition-colors hover:bg-lunara-rose-strong">
        <div><h2 className="font-display text-base leading-6 font-semibold">{t('All Flowers')}</h2><p className="mt-1 text-[0.65rem] leading-4">{t('Find Your Favourite')}</p></div><ChevronRight size={16} className="shrink-0" aria-hidden="true" />
      </Link>
    </nav>}
    <Benefits />
    <FeaturedCollection {...model} />
  </main>;
}
