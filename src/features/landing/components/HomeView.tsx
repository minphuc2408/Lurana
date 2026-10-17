import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { useLocale, getLocalizedName } from "@/shared/i18n";
import { FeaturedCollection } from "./FeaturedCollection";
import { Benefits } from "./Benefits";
import { Hero } from "./Hero";
import { OurStory } from "./OurStory";
import type { HomeModel } from "../hooks/useHome";
export function HomeView(model: HomeModel) {
  const { t, language } = useLocale("landing");
  return <main data-home-layout className="mx-auto max-w-[1240px] space-y-8 px-5 pb-16 font-body sm:space-y-10 sm:px-8">
    <Hero />
    {!model.loading && !model.error && model.categories.length > 0 && <nav aria-label={t('Shop by Category')} data-home-categories className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {model.categories.map(category => <Link key={category.id} to={`/shop?category=${encodeURIComponent(category.code)}`} className="group flex min-h-24 min-w-0 items-center gap-3 rounded-2xl border border-lunara-border bg-lunara-blush/70 p-3 transition-colors hover:border-lunara-rose-strong sm:p-4">
        <span data-category-thumbnail={category.code} aria-hidden="true" className="size-11 shrink-0 overflow-hidden rounded-full border border-lunara-border bg-lunara-cream sm:size-12">
          {category.image_url && <ImageWithFallback src={category.image_url} alt="" width={256} height={256} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
        </span>
        <div className="min-w-0 flex-1"><h2 className="font-display text-base leading-6 font-semibold text-lunara-ink">{getLocalizedName(category, language)}</h2></div>
        <ChevronRight size={15} className="shrink-0 text-lunara-rose-strong" aria-hidden="true" />
      </Link>)}
      <Link to="/shop" className="flex min-h-24 items-center justify-between gap-3 rounded-2xl border border-lunara-border bg-lunara-blush p-4 text-lunara-ink transition-colors hover:border-lunara-rose-strong hover:bg-lunara-border/50">
        <div><h2 className="font-display text-base leading-6 font-semibold">{t('All Flowers')}</h2><p className="mt-1 text-[0.65rem] leading-4">{t('Find Your Favourite')}</p></div><ChevronRight size={16} className="shrink-0" aria-hidden="true" />
      </Link>
    </nav>}
    <Benefits />
    <FeaturedCollection {...model} />
    <Benefits variant="journey" />
    <OurStory />
  </main>;
}
