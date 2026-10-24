import { FeaturedCollection } from "./FeaturedCollection";
import { Benefits } from "./Benefits";
import { Hero } from "./Hero";
import { OurStory } from "./OurStory";
import { HomeFAQ } from "./HomeFAQ";
import type { HomeModel } from "../hooks/useHome";

export function HomeView(model: HomeModel) {
  return <main data-home-layout className="bg-lunara-cream font-body">
    <Hero />
    <Benefits />
    <FeaturedCollection {...model} />
    <Benefits variant="journey" />
    <OurStory />
    <HomeFAQ />
  </main>;
}
