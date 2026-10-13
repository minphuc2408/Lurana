import { useLocale } from "@/shared/i18n";
import { Star } from "lucide-react";
import type { HomeModel } from "../hooks/useHome";
export function Testimonials(model: HomeModel) {
  const { t, language } = useLocale("landing");
  const {
    testimonials
  } = model;
  return <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="[font-size:0.75rem] [letter-spacing:0.2em] [text-transform:uppercase] text-lunara-rose-strong">{t("Kind Words")}</span>
          <h2 className="font-display [font-size:clamp(2rem,_4vw,_2.8rem)] [font-weight:600] text-lunara-ink [margin-top:8px]">
            {t("What Our Clients Say")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => <div key={i} className="rounded-2xl p-8 bg-white [border:1px_solid_#F0DDD5] [box-shadow:0_4px_20px_rgba(193,123,138,0.08)]">
              <div className="flex gap-1 mb-4">
                {Array.from({
            length: testimonial.stars
          }).map((_, j) => <Star key={j} size={14} fill="#C17B8A" color="#C17B8A" />)}
              </div>
              <p className="[font-size:0.9rem] [line-height:1.8] text-lunara-body [font-style:italic] [margin-bottom:20px]">
                "{language === "vi" ? testimonial.review_vi : testimonial.review}"
              </p>
              <div className="font-display [font-size:1rem] [font-weight:600] text-lunara-ink">— {testimonial.name}</div>
            </div>)}
        </div>
      </section>;
}
