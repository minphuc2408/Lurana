import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
export function Hero() {
  const { t } = useLocale("landing");
  return <section data-home-hero className="overflow-hidden rounded-[28px] border border-lunara-border bg-lunara-cream">
    <div className="grid lg:min-h-[440px] lg:grid-cols-12">
      <div className="flex min-w-0 flex-col justify-center px-6 py-10 sm:p-10 lg:col-span-5 lg:px-12 lg:py-10">
        <span className="mb-4 text-[0.68rem] font-semibold tracking-[0.18em] text-lunara-rose-strong uppercase sm:text-xs">{t("✦ Premium Floral Studio")}</span>
        <h1 className="mb-5 font-display text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[1.12] font-semibold tracking-tight text-lunara-ink">
          {t("Where Flowers")}<br /><span className="text-lunara-rose-strong italic">{t("Tell Your Story")}</span>
        </h1>
        <p className="mb-8 max-w-md text-sm leading-7 text-lunara-body sm:text-base">{t("Handcrafted with love and intention, each arrangement at Lunara is a living work of art designed to express what words cannot.")}</p>
        <div><Link to="/shop" className="inline-flex min-h-11 items-center gap-3 rounded-full bg-lunara-rose-strong px-7 py-3.5 text-xs font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-lunara-ink">
          {t("Shop Flowers")}<ArrowRight size={16} aria-hidden="true" />
        </Link></div>
      </div>
      <div data-editorial-image="hero" aria-hidden="true" className="min-h-48 bg-lunara-border/25 sm:min-h-64 lg:col-span-7 lg:min-h-full" />
    </div>
  </section>;
}
