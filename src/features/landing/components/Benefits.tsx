import { useLocale } from "@/shared/i18n";
import { Truck, Flower2, Banknote, Heart, HandHeart, createLucideIcon } from "lucide-react";
import { useLandingReveal } from '../hooks/useLandingReveal';
import { journeyReveal, serviceReveal } from '../landing-motion';

// Adapt the existing Lucide notepad and pen geometry to the owner's top-bound card reference.
const CardNotePen = createLucideIcon('CardNotePen', [
  ['path', { d: 'M8 2v4', key: 'ring-left' }],
  ['path', { d: 'M12 2v4', key: 'ring-middle' }],
  ['path', { d: 'M16 2v4', key: 'ring-right' }],
  ['path', { d: 'M20 10V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3', key: 'page' }],
  ['path', { d: 'M8 10h6M8 14h3', key: 'message' }],
  ['path', { d: 'M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z', key: 'pen' }],
]);

const benefits = [
  { icon: Truck, title: "Delivery Options", detail: "Choose your area and time at checkout" },
  { icon: Flower2, title: "Thoughtfully Arranged", detail: "Handcrafted with love and care" },
  { icon: Banknote, title: "Cash on Delivery", detail: "Pay when your flowers arrive" },
  { icon: Heart, title: "Thoughtful Gifts", detail: "A personal touch for every moment" },
];
const journey = [
  { icon: Flower2, title: 'Choose your flowers', detail: 'Find flowers and gifts for every moment.' },
  { icon: CardNotePen, title: 'Write a card', detail: 'Share a heartfelt message with a little card.' },
  { icon: HandHeart, title: 'Delivered with care', detail: 'Lunarra prepares and delivers your gift to someone you love.' },
];
export function Benefits({ variant = 'services' }: { variant?: 'services' | 'journey' }) {
  const { t } = useLocale("landing");
  const motionRef = useLandingReveal(variant === 'journey' ? journeyReveal : serviceReveal);
  if (variant === 'journey') return <section ref={motionRef} data-home-journey aria-labelledby="journey-title" className="bg-lunara-journey py-16 sm:py-20">
    <div className="mx-auto max-w-[var(--lunara-content-max-width)] px-5 sm:px-8">
    <div data-journey-heading className="mx-auto mb-10 max-w-xl text-center sm:mb-12">
      <p className="mb-2 text-[11px] font-medium tracking-[0.16em] text-lunara-editorial-label uppercase">{t('The gifting journey')}</p>
      <h2 id="journey-title" className="font-display text-2xl leading-snug tracking-tight text-lunara-ink sm:text-3xl">{t('Just 3 steps to send a little love')}</h2>
    </div>
    <ol className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 lg:gap-12">
      {journey.map(({ icon: Icon, title, detail }, index) => <li key={title} className="flex min-w-0 flex-col items-center">
        <div data-journey-icon-circle className="mb-4 flex size-20 shrink-0 items-center justify-center rounded-full bg-lunara-journey-icon sm:size-[90px]">
          <Icon data-journey-icon size={32} strokeWidth={1.8} aria-hidden="true" className="text-lunara-on-journey-icon" />
        </div>
        <span data-journey-step aria-hidden="true" className="mb-2 font-display text-xs text-lunara-journey-step">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="mb-2 font-display text-lg text-lunara-ink">{t(title)}</h3>
        <p className="max-w-xs text-xs leading-relaxed text-lunara-body sm:text-sm">{t(detail)}</p>
      </li>)}
    </ol>
    </div>
  </section>;
  return <section ref={motionRef} data-home-services aria-label={t('The Lunara Experience')} className="bg-lunara-services">
    <div className="mx-auto grid max-w-[var(--lunara-content-max-width)] grid-cols-2 gap-x-6 gap-y-10 px-5 py-12 sm:gap-x-8 sm:px-8 sm:py-16 lg:grid-cols-4 lg:gap-x-12">
      {benefits.map(({ icon: Icon, title, detail }) => <div key={title} data-service-item className="group flex min-w-0 flex-col items-center text-center">
        <div data-service-icon className="mb-5 flex size-16 shrink-0 items-center justify-center rounded-full bg-lunara-service-icon transition-colors group-hover:bg-lunara-service-icon-hover">
          <Icon data-theme-icon size={25} strokeWidth={1.5} aria-hidden="true" className="text-lunara-service-icon-foreground transition-colors group-hover:text-lunara-service-icon-foreground-hover" />
        </div>
        <h3 className="text-sm leading-6 font-medium text-lunara-ink transition-colors group-hover:text-lunara-text-hover sm:text-base">{t(title)}</h3>
        <p className="mt-2 max-w-56 text-sm leading-6 text-lunara-body">{t(detail)}</p>
      </div>)}
    </div>
  </section>;
}
