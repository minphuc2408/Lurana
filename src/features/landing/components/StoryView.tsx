import { Link } from 'react-router';
import { ArrowRight, Clock, Heart, MapPin, Sparkles } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { storeLocations } from '@/shared/config/storefront-footer';
import { storyPhotos } from '../data/story.data';

const values = [
  { icon: Heart, title: 'More than selling flowers', body: 'Every flower is a messenger of emotion' },
  { icon: Clock, title: 'Cut at dawn, delivered before dusk', body: 'Flowers from selected growers in Dalat and the Netherlands' },
  { icon: Sparkles, title: 'Handwritten pressed-flower cards', body: 'Sepia ink and textured paper for every message' },
];
const gallery = [
  { src: storyPhotos.bouquet, alt: 'A bouquet of fresh roses' },
  { src: storyPhotos.card, alt: 'A handwritten card on textured paper' },
  { src: storyPhotos.wrapping, alt: 'Wrapping paper, ribbon and dried flowers' },
];
export function StoryView() {
  const { t } = useLocale('landing');
  const common = useLocale('common');
  return <main data-story-page className="mx-auto max-w-[1240px] px-5 py-6 font-body sm:px-8 sm:py-10 [--lunara-ink:#4B2432] [--lunara-body:#746B69] [--lunara-border:#E7DCD3] [--lunara-blush:#F3E7DF] [--lunara-surface:#FAF7F2]">
    <article aria-labelledby="story-title">
      <header className="grid grid-cols-1 items-center gap-10 border-b border-lunara-border pt-4 pb-12 lg:grid-cols-12 sm:pb-16">
        <div className="min-w-0 space-y-4 lg:col-span-6"><span className="block text-[11px] font-medium tracking-[0.18em] text-lunara-rose-strong uppercase">{t('About us')}</span><h1 id="story-title" className="font-display text-3xl leading-[1.18] tracking-tight text-lunara-ink sm:text-5xl">{t('Sincere things begin with a flower')}</h1><p className="pt-2 text-sm leading-relaxed text-lunara-body sm:text-base">{t('Lunarra begins with gentle moonlight')}</p></div>
        <div className="min-w-0 lg:col-span-6"><div className="aspect-[16/10] overflow-hidden rounded-[2px] bg-lunara-blush"><ImageWithFallback src={storyPhotos.florist} alt={t('A florists work table')} width={1200} height={750} loading="eager" decoding="async" className="h-full w-full object-cover" /></div></div>
      </header>
      <section aria-label={t('Our philosophy')} className="grid grid-cols-1 gap-10 border-b border-lunara-border py-16 md:grid-cols-3 sm:py-20">
        {values.map(({ icon: Icon, title, body }) => <div key={title} className="min-w-0 space-y-3"><div className="flex size-10 items-center justify-center rounded-full bg-lunara-blush text-lunara-rose-strong"><Icon size={20} strokeWidth={1.5} aria-hidden="true" /></div><h2 className="font-display text-xl text-lunara-ink">{t(title)}</h2><p className="text-xs leading-relaxed text-lunara-body sm:text-sm">{t(body)}</p></div>)}
      </section>
      <section aria-labelledby="story-gallery-title" className="space-y-8 border-b border-lunara-border py-16 sm:py-20">
        <div className="max-w-xl"><span className="mb-2 block text-[11px] font-medium tracking-[0.16em] text-lunara-rose-strong uppercase">{t('The Lunarra space')}</span><h2 id="story-gallery-title" className="font-display text-2xl tracking-tight text-lunara-ink sm:text-3xl">{t('A corner scented with eucalyptus and kraft paper')}</h2></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{gallery.map(photo => <div key={photo.src} className="aspect-[4/5] overflow-hidden rounded-[2px] bg-lunara-blush"><ImageWithFallback src={photo.src} alt={t(photo.alt)} width={800} height={1000} loading="lazy" decoding="async" className="h-full w-full object-cover" /></div>)}</div>
      </section>
      <section aria-labelledby="story-visit-title" className="grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-12 sm:py-20">
        <div className="min-w-0 space-y-6 lg:col-span-6"><span className="block text-[11px] font-medium tracking-[0.16em] text-lunara-rose-strong uppercase">{t('Visit the shop')}</span><h2 id="story-visit-title" className="font-display text-2xl text-lunara-ink sm:text-3xl">{t('Visit, have a conversation and choose your flowers')}</h2>
          <address data-story-locations className="space-y-4 text-xs leading-relaxed text-lunara-body not-italic sm:text-sm">{storeLocations.map(store => <p key={store.id} className="flex items-start gap-3"><MapPin size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-lunara-rose-strong" /><span><strong className="block font-medium text-lunara-ink">{common.t(store.label)}</strong><a href={common.t(store.mapUrlKey)} target="_blank" rel="noopener noreferrer" className="hover:text-lunara-rose-strong hover:underline">{common.t(store.addressKey)}</a></span></p>)}</address>
          <Link to="/shop" className="inline-flex min-h-11 items-center gap-2 rounded-[2px] bg-lunara-rose-strong px-8 py-3.5 text-xs tracking-wider text-white uppercase transition-colors hover:bg-lunara-ink">{t('See todays flowers')}<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div data-story-opening-hours className="min-w-0 space-y-4 rounded-[2px] border border-lunara-border bg-lunara-surface p-8 lg:col-span-6"><h2 className="font-display text-xl text-lunara-ink">{t('Opening hours')}</h2><dl className="space-y-3 text-xs text-lunara-body"><div className="flex flex-wrap justify-between gap-2 border-b border-lunara-border py-2"><dt>{t('Monday to Friday')}</dt><dd className="font-medium text-lunara-ink">08:00 — 20:00</dd></div><div className="flex flex-wrap justify-between gap-2 border-b border-lunara-border py-2"><dt>{t('Saturday and Sunday')}</dt><dd className="font-medium text-lunara-ink">08:30 — 19:30</dd></div><div className="flex flex-wrap justify-between gap-2 py-2 text-lunara-rose-strong"><dt>{t('Express city delivery')}</dt><dd>{t('Within two hours')}</dd></div></dl></div>
      </section>
    </article>
  </main>;
}
