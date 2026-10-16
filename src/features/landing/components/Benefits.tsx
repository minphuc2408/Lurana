import { useLocale } from "@/shared/i18n";
import { Truck, Flower2, Banknote, Heart } from "lucide-react";
const benefits = [
  { icon: Truck, title: "Delivery Options", detail: "Choose your area and time at checkout" },
  { icon: Flower2, title: "Thoughtfully Arranged", detail: "Handcrafted with love and care" },
  { icon: Banknote, title: "Cash on Delivery", detail: "Pay when your flowers arrive" },
  { icon: Heart, title: "Thoughtful Gifts", detail: "A personal touch for every moment" },
];
export function Benefits() {
  const { t } = useLocale("landing");
  return <section aria-label={t('The Lunara Experience')} className="rounded-2xl border border-lunara-border bg-lunara-blush/60 px-5 py-5 sm:px-6">
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {benefits.map(({ icon: Icon, title, detail }) => <div key={title} className="flex min-w-0 items-center gap-3 lg:border-l lg:border-lunara-border lg:pl-5 lg:first:border-0 lg:first:pl-0">
        <Icon size={23} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-lunara-rose-strong" />
        <div><h3 className="text-xs leading-5 font-semibold text-lunara-ink">{t(title)}</h3><p className="mt-0.5 text-[0.7rem] leading-5 text-lunara-body">{t(detail)}</p></div>
      </div>)}
    </div>
  </section>;
}
