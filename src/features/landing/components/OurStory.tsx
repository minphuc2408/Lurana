import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { HomeModel } from "../hooks/useHome";
export function OurStory(model: HomeModel) {
  const { t } = useLocale("landing");
  const {
    shopImage
  } = model;
  return <section className="bg-lunara-blush [padding:80px_0]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img src={shopImage} alt={t("Our shop")} className="rounded-3xl shadow-xl [width:100%] [aspect-ratio:4/3] [object-fit:cover]" />

          </div>

          <div>
            <span className="[font-size:0.75rem] [letter-spacing:0.2em] [text-transform:uppercase] text-lunara-rose-strong">{t("Our Story")}</span>
            <h2 className="font-display [font-size:clamp(2rem,_3.5vw,_2.8rem)] [font-weight:600] text-lunara-ink [margin:12px_0_20px] [line-height:1.2]">
              {t("Blooms Crafted with")}<br />
              <span className="[font-style:italic]">{t("Intention & Soul")}</span>
            </h2>
            <p className="[font-size:0.92rem] [line-height:1.9] text-lunara-body [margin-bottom:16px]">
              {t("Lunara was born from a deep love of nature's most fleeting gifts — flowers that bloom, dazzle, and teach us to cherish beauty in the moment. Every arrangement we create is a story, a feeling, a memory made tangible.")}</p>
            <p className="[font-size:0.92rem] [line-height:1.9] text-lunara-body [margin-bottom:32px]">
              {t("We source only the finest seasonal blooms, working with local growers to ensure freshness and sustainability in every single arrangement.")}</p>
            <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-lunara-ink text-white [text-decoration:none] [font-size:0.85rem] [letter-spacing:0.1em] [text-transform:uppercase]">
              {t("View All Products")}{" "}<ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>;
}
