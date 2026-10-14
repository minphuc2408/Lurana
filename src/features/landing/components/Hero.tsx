import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { ArrowRight, Heart } from "lucide-react";
import type { HomeModel } from "../hooks/useHome";
export function Hero(model: HomeModel) {
  const { t } = useLocale("landing");
  const {
    heroImage
  } = model;
  return <section className="relative overflow-hidden [min-height:90vh] bg-lunara-cream">
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12">
          {/* Text */}
          <div className="flex-1 z-10">
            <span className="[font-size:0.78rem] [letter-spacing:0.2em] [text-transform:uppercase] text-lunara-rose-strong [font-weight:500]">
              {t("✦ Premium Floral Studio")}</span>
            <h1 className="font-display [font-size:clamp(3rem,_6vw,_5.5rem)] [font-weight:600] [line-height:1.1] text-lunara-ink [margin-top:16px] [margin-bottom:24px]">
              {t("Where Flowers")}<br />
              <span className="[font-style:italic] text-lunara-rose-strong">{t("Tell Your Story")}</span>
            </h1>
            <p className="[font-size:1rem] [line-height:1.8] text-lunara-body [max-width:440px] [margin-bottom:40px]">
              {t("Handcrafted with love and intention, each arrangement at Lunara is a living work of art designed to express what words cannot.")}</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="flex items-center gap-2 px-8 py-4 rounded-full bg-lunara-rose-strong text-white [text-decoration:none] [font-size:0.85rem] [letter-spacing:0.1em] [text-transform:uppercase] [font-weight:500] [transition:all_0.2s_ease]">
                {t("Explore Collection")}{" "}<ArrowRight size={16} />
              </Link>

            </div>

            {/* Stats */}

          </div>

          {/* Hero Image */}
          <div className="flex-1 relative flex justify-center">
            <div className="rounded-3xl overflow-hidden shadow-2xl [width:min(480px,_100%)] [aspect-ratio:3/4] [position:relative]">
              <img src={heroImage} alt={t("Beautiful roses")} className="[width:100%] [height:100%] [object-fit:cover]" />
              <div className="[position:absolute] [inset:0] [background:linear-gradient(to_bottom,_transparent_60%,_rgba(61,34,40,0.3))]" />
            </div>

            {/* Floating badge */}


            {/* Floating heart */}
            <div className="absolute bottom-12 -right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-lunara-rose-strong">
              <Heart size={18} color="white" fill="white" />
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="[position:absolute] [top:10%] [right:5%] [width:300px] [height:300px] [border-radius:50%] bg-[#F8D7E0] [opacity:0.3] [filter:blur(60px)] [z-index:0]" />
        <div className="[position:absolute] [bottom:10%] [left:5%] [width:200px] [height:200px] [border-radius:50%] bg-[#D4B896] [opacity:0.2] [filter:blur(50px)] [z-index:0]" />
      </section>;
}
