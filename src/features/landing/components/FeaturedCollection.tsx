import { useLocale, getLocalizedName } from "@/shared/i18n";
import { formatVND } from "@/shared/lib/format";
import { apiErrorKey } from '@/shared/api/client';
import { Link } from "react-router";
import { ArrowRight, Heart } from "lucide-react";
import type { HomeModel } from "../hooks/useHome";
export function FeaturedCollection(model: HomeModel) {
  const { t, language } = useLocale("landing");
  const {
    featuredProducts
  } = model;
  return <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="[font-size:0.75rem] [letter-spacing:0.2em] [text-transform:uppercase] text-lunara-rose-strong">{t("Our Selection")}</span>
          <h2 className="font-display [font-size:clamp(2rem,_4vw,_3rem)] [font-weight:600] text-lunara-ink [margin-top:8px]">
            {t("Featured Arrangements")}</h2>
          <div className="[width:60px] [height:2px] bg-lunara-rose-strong [margin:16px_auto_0]" />
        </div>

        {model.loading && <p role="status" className="mb-6 text-center text-lunara-body">{t('Loading catalog')}</p>}
        {Boolean(model.error) && <div role="alert" className="mb-6 text-center text-lunara-ink">{t(apiErrorKey(model.error))}<button onClick={model.reload} className="ml-4 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div>}
        {!model.loading && !model.error && !featuredProducts.length && <p role="status" className="text-center text-lunara-body">{t('No featured products')}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {featuredProducts.map(product => <Link key={product.id} to="/shop" className="group [text-decoration:none]">
              <div className="rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
                <div className="relative overflow-hidden [aspect-ratio:3/4]">
                  <img src={product.image} alt={getLocalizedName(product, language)} className="group-hover:scale-105 [width:100%] [height:100%] [object-fit:cover] [transition:transform_0.4s_ease]" />
                  {product.tag && <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-lunara-rose-strong text-white [font-size:0.68rem] [letter-spacing:0.1em] [text-transform:uppercase]">
                      {t(product.tag)}
                    </span>}
                </div>
                <div className="p-4">
                  <h3 className="font-display [font-size:1rem] text-lunara-ink [margin-bottom:4px] [font-weight:500]">
                    {getLocalizedName(product, language)}
                  </h3>
                  <p className="[font-size:0.9rem] text-lunara-rose-strong [font-weight:500]">{product.variants?.length ? t('From {{price}}', { price: formatVND(product.price, language) }) : t('Unavailable')}</p>
                </div>
              </div>
            </Link>)}
        </div>

        <div className="text-center mt-10">
          <Link to="/shop" className="[display:inline-flex] [align-items:center] [gap:8px] [text-decoration:none] [font-size:0.85rem] [letter-spacing:0.12em] [text-transform:uppercase] text-lunara-rose-strong [border-bottom:1px_solid_#C17B8A] [padding-bottom:2px]">
            {t("View All Products")}{" "}<ArrowRight size={14} />
          </Link>
        </div>
      </section>;
}
