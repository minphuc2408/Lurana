import { useLocale } from "@/shared/i18n";
import { Star, Truck, RefreshCw, Heart } from "lucide-react";
import type { HomeModel } from "../hooks/useHome";
export function Benefits(model: HomeModel) {
  const { t } = useLocale("landing");
  return <section className="bg-[#F5E8E4] [padding:20px_0]">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-10">
          {[{
        icon: <Truck size={18} />,
        text: "Same-Day Delivery Available"
      }, {
        icon: <RefreshCw size={18} />,
        text: "7-Day Freshness Guarantee"
      }, {
        icon: <Heart size={18} />,
        text: "Handcrafted with Love"
      }, {
        icon: <Star size={18} />,
        text: "Premium Seasonal Blooms"
      }].map(f => <div key={f.text} className="flex items-center gap-2">
              <span className="text-lunara-rose-strong">{f.icon}</span>
              <span className="[font-size:0.82rem] [letter-spacing:0.08em] text-lunara-body">{t(f.text)}</span>
            </div>)}
        </div>
      </section>;
}
