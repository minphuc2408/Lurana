import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import bouquetSmall from '@/assets/hero/lunara-bouquet-640.webp';
import bouquetMedium from '@/assets/hero/lunara-bouquet-960.webp';
import bouquetLarge from '@/assets/hero/lunara-bouquet-1440.webp';
export function Hero() {
  const { t } = useLocale("landing");
  return <section data-home-hero className="bg-lunara-cream pt-10 pb-16 sm:py-20">
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="flex min-w-0 flex-col justify-center lg:col-span-5">
        <span className="mb-4 text-[0.68rem] font-semibold tracking-[0.18em] text-lunara-rose-strong uppercase sm:text-xs">{t("✦ Premium Floral Studio")}</span>
        <h1 className="mb-5 font-display text-4xl leading-[1.14] sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-lunara-ink">
          {t("Where Flowers")}<br /><span className="text-lunara-rose-strong italic">{t("Tell Your Story")}</span>
        </h1>
        <p className="mb-8 max-w-md text-sm leading-7 text-lunara-body sm:text-base">{t("Handcrafted with love and intention, each arrangement at Lunara is a living work of art designed to express what words cannot.")}</p>
        <div><Link to="/shop" className="inline-flex min-h-11 items-center gap-3 rounded-full bg-lunara-rose-strong px-7 py-3.5 text-xs font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-lunara-ink">
          {t("Shop Flowers")}<ArrowRight size={16} aria-hidden="true" />
        </Link></div>
      </div>
      <div data-hero-visual aria-hidden="true" className="relative h-[400px] min-w-0 overflow-hidden rounded-[2px] bg-lunara-cream sm:h-[480px] lg:col-span-7 lg:h-[520px]">
        <picture className="absolute inset-0 block">
          <img
            data-hero-image
            src={bouquetMedium}
            srcSet={`${bouquetSmall} 640w, ${bouquetMedium} 960w, ${bouquetLarge} 1440w`}
            sizes="(min-width: 1240px) 663px, (min-width: 1024px) calc((100vw - 104px) * 7 / 12), (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
            width={1440}
            height={1080}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-[62%_45%] lg:object-[58%_42%]"
          />
        </picture>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-lunara-cream to-transparent lg:inset-y-0 lg:right-auto lg:h-full lg:w-32 lg:bg-gradient-to-r" />
      </div>
    </div>
  </section>;
}
