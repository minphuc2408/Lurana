import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import bouquetSmall from '@/assets/home-reference/hero-640.jpg';
import bouquetMedium from '@/assets/home-reference/hero-960.jpg';
import bouquetLarge from '@/assets/home-reference/hero-1400.jpg';
export function Hero() {
  const { t } = useLocale("landing");
  return <section data-home-hero className="bg-lunara-cream pt-10 pb-16 sm:py-20">
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="flex min-w-0 flex-col justify-center lg:col-span-5">
        <span className="mb-4 block text-[11px] font-medium tracking-[0.18em] text-lunara-rose-strong uppercase sm:mb-5">{t("✦ Premium Floral Studio")}</span>
        <h1 className="mb-5 font-display text-4xl leading-[1.14] font-normal tracking-tight text-lunara-ink sm:mb-6 sm:text-5xl lg:text-[54px]">
          {t("Where Flowers")}<br /><span className="text-lunara-rose-strong italic">{t("Tell Your Story")}</span>
        </h1>
        <p className="mb-8 max-w-md text-base leading-[1.7] text-lunara-body">{t("Handcrafted with love and intention, each arrangement at Lunara is a living work of art designed to express what words cannot.")}</p>
        <div><Link to="/shop" className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-[2px] bg-lunara-rose-strong px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-[var(--lunara-primary-hover)]">
          {t("Choose your flowers")}<ArrowRight size={16} aria-hidden="true" />
        </Link></div>
      </div>
      <div data-hero-visual className="relative h-[400px] min-w-0 overflow-hidden rounded-[2px] bg-lunara-blush sm:h-[480px] lg:col-span-7 lg:h-[520px]">
        <picture className="absolute inset-0 block">
          <img
            data-hero-image
            src={bouquetMedium}
            srcSet={`${bouquetSmall} 640w, ${bouquetMedium} 960w, ${bouquetLarge} 1400w`}
            sizes="(min-width: 2000px) 873px, (min-width: 1550px) calc((80vw - 104px) * 7 / 12), (min-width: 1240px) 663px, (min-width: 1024px) calc((100vw - 104px) * 7 / 12), (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
            width={1400}
            height={1400}
            alt={t('Hands holding a fresh flower bouquet')}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </div>
    </div>
  </section>;
}
