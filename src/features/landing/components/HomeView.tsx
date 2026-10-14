import { CustomOrderBanner } from "./CustomOrderBanner";
import { Testimonials } from "./Testimonials";
import { OurStory } from "./OurStory";
import { FeaturedCollection } from "./FeaturedCollection";
import { Benefits } from "./Benefits";
import { Hero } from "./Hero";
import type { HomeModel } from "../hooks/useHome";
export function HomeView(model: HomeModel) {
  return <div className="font-body">
      {/* Hero Section */}
      <Hero {...model} />

      {/* Features Bar */}
      <Benefits {...model} />

      {/* Featured Products */}
      <FeaturedCollection {...model} />

      {/* About / Story Section */}
      <OurStory {...model} />

      {/* Testimonials */}

      {/* CTA Banner */}
    </div>;
}
