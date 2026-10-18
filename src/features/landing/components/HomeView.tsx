import { FeaturedCollection } from "./FeaturedCollection";
import { Benefits } from "./Benefits";
import { Hero } from "./Hero";
import { OurStory } from "./OurStory";
import type { HomeModel } from "../hooks/useHome";

export function HomeView(model: HomeModel) {
  return <main data-home-layout className="bg-lunara-cream font-body">
    <div className="mx-auto max-w-[var(--lunara-content-max-width)] px-5 pb-8 sm:px-8 sm:pb-10">
      <Hero />
      <Benefits />
    </div>
    <FeaturedCollection {...model} />
    <Benefits variant="journey" />
    <OurStory />
  </main>;
}
