import { motionEase, motionTimings } from '@/shared/lib/motion';

/** Home only: seconds, pixels, and bounded delays in DOM/reading order. */
export const landingMotion = {
  ease: motionEase,
  feedback: motionTimings.feedback,
  text: 0.6,
  section: 0.45,
  product: 0.5,
  image: 0.75,
  heroImage: 0.85,
  maxDelay: 0.3,
  viewportOnce: { amount: 0.15 } as const,
};

export interface LandingRevealGroup {
  selector: string;
  duration: number;
  y?: number;
  scale?: number;
  stagger?: number;
}

export const serviceReveal: readonly LandingRevealGroup[] = [
  { selector: '[data-service-item]', duration: landingMotion.section, y: 12, stagger: 0.065 },
];
export const journeyReveal: readonly LandingRevealGroup[] = [
  { selector: '[data-journey-heading] > *', duration: landingMotion.section, y: 12, stagger: 0.09 },
  { selector: 'li', duration: landingMotion.section, y: 14, stagger: 0.09 },
];
export const collectionReveal: readonly LandingRevealGroup[] = [
  { selector: '[data-featured-heading] > *', duration: landingMotion.text, y: 14, stagger: 0.08 },
  { selector: '[data-product-appearance="featured"]', duration: landingMotion.product, y: 18, stagger: 0.075 },
];
export const storyReveal: readonly LandingRevealGroup[] = [
  { selector: '[data-story-copy] > *', duration: landingMotion.text, y: 16, stagger: 0.08 },
  { selector: '[data-story-photo]', duration: landingMotion.image, scale: 1.025, stagger: 0.09 },
];
export const faqReveal: readonly LandingRevealGroup[] = [
  { selector: '[data-faq-intro], [data-faq-list]', duration: landingMotion.section, y: 12, stagger: 0.08 },
];
