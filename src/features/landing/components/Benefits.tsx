import { useLocale } from "@/shared/i18n";
import { Truck, Flower2, Banknote, Heart, Mail, Gift } from "lucide-react";
const benefits = [
  { icon: Truck, title: "Delivery Options", detail: "Choose your area and time at checkout" },
  { icon: Flower2, title: "Thoughtfully Arranged", detail: "Handcrafted with love and care" },
  { icon: Banknote, title: "Cash on Delivery", detail: "Pay when your flowers arrive" },
  { icon: Heart, title: "Thoughtful Gifts", detail: "A personal touch for every moment" },
];
const journey = [
  { icon: Flower2, title: 'Choose your flowers', detail: 'Find flowers and gifts for every moment.' },
  { icon: Mail, title: 'Write a card', detail: 'Share a heartfelt message with a little card.' },
  { icon: Gift, title: 'Delivered with care', detail: 'Lunarra prepares and delivers your gift to someone you love.' },
];
export function Benefits({ variant = 'services' }: { variant?: 'services' | 'journey' }) {
  const { t } = useLocale("landing");
  if (variant === 'journey') return <section data-home-journey aria-labelledby="journey-title" className="border-t border-lunara-border bg-lunara-cream py-16 sm:py-20">
    <div className="mx-auto mb-12 max-w-xl text-center sm:mb-16">
      <p className="mb-2 text-[11px] font-medium tracking-[0.16em] text-lunara-rose-strong uppercase">{t('The gifting journey')}</p>
      <h2 id="journey-title" className="font-display text-2xl leading-snug tracking-tight text-lunara-ink sm:text-3xl">{t('Just 3 steps to send a little love')}</h2>
    </div>
    <ol className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 lg:gap-12">
      {journey.map(({ icon: Icon, title, detail }, index) => <li key={title} className="flex min-w-0 flex-col items-center">
        <div className="mb-4 flex size-12 items-center justify-center text-lunara-rose-strong"><Icon size={36} strokeWidth={1.2} aria-hidden="true" /></div>
        <span aria-hidden="true" className="mb-1 font-display text-xs tracking-widest text-lunara-rose-strong">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="mb-2 font-display text-lg text-lunara-ink">{t(title)}</h3>
        <p className="max-w-xs text-xs leading-relaxed text-lunara-body sm:text-sm">{t(detail)}</p>
      </li>)}
    </ol>
  </section>;
  return <section aria-label={t('The Lunara Experience')} className="rounded-2xl border border-lunara-border bg-lunara-blush/60 px-5 py-5 sm:px-6">
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {benefits.map(({ icon: Icon, title, detail }) => <div key={title} className="flex min-w-0 items-center gap-3 lg:border-l lg:border-lunara-border lg:pl-5 lg:first:border-0 lg:first:pl-0">
        <Icon size={23} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-lunara-rose-strong" />
        <div><h3 className="text-xs leading-5 font-semibold text-lunara-ink">{t(title)}</h3><p className="mt-0.5 text-[0.7rem] leading-5 text-lunara-body">{t(detail)}</p></div>
      </div>)}
    </div>
  </section>;
}
