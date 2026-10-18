import { useLocale } from "@/shared/i18n";
import { Truck, Flower2, Banknote, Heart } from "lucide-react";
const benefits = [
  { icon: Truck, title: "Delivery Options", detail: "Choose your area and time at checkout" },
  { icon: Flower2, title: "Thoughtfully Arranged", detail: "Handcrafted with love and care" },
  { icon: Banknote, title: "Cash on Delivery", detail: "Pay when your flowers arrive" },
  { icon: Heart, title: "Thoughtful Gifts", detail: "A personal touch for every moment" },
];
const journey = [
  { title: 'Choose your flowers', detail: 'Find flowers and gifts for every moment.' },
  { title: 'Write a card', detail: 'Share a heartfelt message with a little card.' },
  { title: 'Delivered with care', detail: 'Lunarra prepares and delivers your gift to someone you love.' },
];
export function Benefits({ variant = 'services' }: { variant?: 'services' | 'journey' }) {
  const { t } = useLocale("landing");
  if (variant === 'journey') return <section data-home-journey aria-labelledby="journey-title" className="bg-lunara-section-secondary py-16 sm:py-20">
    <div className="mx-auto max-w-[var(--lunara-content-max-width)] px-5 sm:px-8">
    <div className="mx-auto mb-12 max-w-xl text-center sm:mb-16">
      <p className="mb-2 text-[11px] font-medium tracking-[0.16em] text-lunara-rose-strong uppercase">{t('The gifting journey')}</p>
      <h2 id="journey-title" className="font-display text-2xl leading-snug tracking-tight text-lunara-ink sm:text-3xl">{t('Just 3 steps to send a little love')}</h2>
    </div>
    <ol className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 lg:gap-12">
      {journey.map(({ title, detail }, index) => <li key={title} className="flex min-w-0 flex-col items-center">
        <div className="mb-4 flex size-12 items-center justify-center text-lunara-rose-strong">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {index === 0 ? <><path d="M12 22v-9" /><path d="M12 13c-2.5 0-5-2-5-4.5a5 5 0 0 1 10 0c0 2.5-2.5 4.5-5 4.5z" /><path d="M12 8.5V4" /><path d="M9.5 5.5c1.5-1.5 3.5-1.5 5 0" /><path d="M12 17c-2 0-4-1-4-2" /><path d="M12 19c2 0 4-1 4-2" /></>
              : index === 1 ? <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" /><path d="M8 14h4" /><path d="M8 11h2" /></>
                : <><path d="M12 2v20" /><path d="M20 12a8 8 0 0 0-16 0" /><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" /><path d="M12 6a2.5 2.5 0 0 0-2.5-2.5c-1.5 0-2.5 1-2.5 2.5 0 2 5 3 5 3s5-1 5-3c0-1.5-1-2.5-2.5-2.5A2.5 2.5 0 0 0 12 6z" /></>}
          </svg>
        </div>
        <span aria-hidden="true" className="mb-1 font-display text-xs font-semibold tracking-widest text-lunara-rose-strong">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="mb-2 font-display text-lg text-lunara-ink">{t(title)}</h3>
        <p className="max-w-xs text-xs leading-relaxed text-lunara-body sm:text-sm">{t(detail)}</p>
      </li>)}
    </ol>
    </div>
  </section>;
  return <section data-home-services aria-label={t('The Lunara Experience')} className="rounded-[2px] border border-lunara-border bg-lunara-section-secondary px-5 py-6 sm:px-6">
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {benefits.map(({ icon: Icon, title, detail }) => <div key={title} className="flex min-w-0 items-center gap-3 lg:border-l lg:border-lunara-border lg:pl-5 lg:first:border-0 lg:first:pl-0">
        <Icon size={23} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-lunara-rose-strong" />
        <div><h3 className="text-xs leading-5 font-semibold text-lunara-ink">{t(title)}</h3><p className="mt-0.5 text-[0.7rem] leading-5 text-lunara-body">{t(detail)}</p></div>
      </div>)}
    </div>
  </section>;
}
