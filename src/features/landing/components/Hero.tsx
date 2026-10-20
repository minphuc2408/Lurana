import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import bouquetSmall from '@/assets/home-reference/hero-640.jpg';
import bouquetMedium from '@/assets/home-reference/hero-960.jpg';
import bouquetLarge from '@/assets/home-reference/hero-1400.jpg';
import { useHeroMotion } from '../hooks/useHeroMotion';
export function Hero() {
  const { t } = useLocale("landing");
  const heroRef = useHeroMotion();
  return <section ref={heroRef} data-home-hero data-motion-hero aria-labelledby="home-hero-title" className="relative isolate flex min-h-[calc(100svh_-_var(--lunara-storefront-header-height,0px))] w-full items-center overflow-hidden bg-lunara-hero-backdrop">
      <div data-hero-visual className="absolute inset-0 -z-20 overflow-hidden">
        <picture className="absolute inset-0 block" aria-hidden="true">
          <img
            data-hero-image
            src={bouquetMedium}
            srcSet={`${bouquetSmall} 640w, ${bouquetMedium} 960w, ${bouquetLarge} 1400w`}
            sizes="100vw"
            width={1400}
            height={1400}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-lunara-hero-overlay" />
      <div data-hero-copy className="mx-auto flex w-full max-w-[var(--lunara-content-max-width)] flex-col items-center px-5 py-12 text-center sm:px-8 sm:py-16">
        <h1 id="home-hero-title" className="max-w-4xl whitespace-pre-line font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.06] font-normal tracking-tight text-lunara-hero-foreground">{t('Fresh Blooms, Delivered Daily')}</h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-lunara-hero-foreground sm:text-lg sm:leading-8">{t('Handcrafted bouquets made with love and the finest seasonal flowers')}</p>
        <div className="mt-9"><Link to="/shop" data-hero-shop className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-[2px] bg-lunara-hero-button px-9 py-4 text-sm font-medium text-lunara-hero-button-foreground transition-colors hover:bg-lunara-hero-button-hover focus-visible:outline-lunara-hero-foreground">
          {t('Shop now')}<ArrowRight size={17} aria-hidden="true" className="transition-transform duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1 motion-reduce:transition-none" />
        </Link></div>
      </div>
  </section>;
}
