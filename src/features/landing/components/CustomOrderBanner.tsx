import { Link } from "react-router";
import type { HomeModel } from "../hooks/useHome";
export function CustomOrderBanner(model: HomeModel) {
  const {
    heroImage
  } = model;
  return <section className="mx-6 mb-8 rounded-3xl overflow-hidden relative bg-lunara-ink [min-height:300px]">
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20">
          <span className="[font-size:0.75rem] [letter-spacing:0.2em] [text-transform:uppercase] text-lunara-rose-light [margin-bottom:16px] [display:block]">Limited Time</span>
          <h2 className="font-display [font-size:clamp(2rem,_4vw,_3.5rem)] [font-weight:600] text-white [margin-bottom:16px]">
            Spring Collection Now Available
          </h2>
          <p className="text-lunara-body [font-size:0.95rem] [max-width:500px] [margin-bottom:32px] [line-height:1.7]">
            Celebrate the season with our curated spring arrangements featuring the freshest peonies, tulips, and wildflowers.
          </p>
          <Link to="/shop" className="px-10 py-4 rounded-full bg-lunara-rose-strong text-white [text-decoration:none] [font-size:0.85rem] [letter-spacing:0.12em] [text-transform:uppercase] [font-weight:500]">
            Shop Spring Collection
          </Link>
        </div>
        <div className="relative [position:absolute] [inset:0] [opacity:0.15]"><img src={heroImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" /></div>
      </section>;
}
