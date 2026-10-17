import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { storyPhotos } from '../data/story.data';

export function OurStory() {
  const { t } = useLocale('landing');
  return <section id="cau-chuyen-lunarra" data-home-story aria-labelledby="home-story-title" className="border-t border-lunara-border bg-lunara-cream py-16 sm:py-24 [--lunara-ink:var(--lunara-editorial-ink)] [--lunara-body:var(--lunara-editorial-body)] [--lunara-border:var(--lunara-editorial-border)] [--lunara-blush:var(--lunara-editorial-blush)]">
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="min-w-0 lg:col-span-5">
        <span className="mb-4 block text-[11px] font-medium tracking-[0.18em] text-lunara-rose-strong uppercase">{t('The Lunarra story')}</span>
        <h2 id="home-story-title" className="mb-6 font-display text-3xl leading-[1.2] tracking-tight whitespace-pre-line text-lunara-ink sm:text-4xl">{t('Sincere things begin with flowers')}</h2>
        <p className="mb-8 text-base leading-[1.75] text-lunara-body">{t('Each Lunarra bouquet is prepared with care')}</p>
        <Link data-story-link to="/about" className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-lunara-rose-strong transition-colors hover:text-lunara-ink">{t('Discover our story')}<ArrowRight size={16} aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-1 motion-reduce:transition-none" /></Link>
      </div>
      <div className="min-w-0 lg:col-span-7"><div className="grid grid-cols-12 items-end gap-4 sm:gap-5">
        <div className="col-span-8 overflow-hidden rounded-[2px] bg-lunara-blush"><ImageWithFallback data-story-photo="florist" src={storyPhotos.florist} alt={t('Florist arranging fresh flowers')} width={1000} height={800} loading="lazy" decoding="async" className="h-[320px] w-full object-cover sm:h-[400px]" /></div>
        <div className="col-span-4 space-y-4 sm:space-y-5">
          <div className="overflow-hidden rounded-[2px] bg-lunara-blush"><ImageWithFallback data-story-photo="card" src={storyPhotos.card} alt={t('A handwritten card on textured paper')} width={600} height={500} loading="lazy" decoding="async" className="h-[150px] w-full object-cover sm:h-[190px]" /></div>
          <div className="overflow-hidden rounded-[2px] bg-lunara-blush"><ImageWithFallback data-story-photo="wrapping" src={storyPhotos.wrapping} alt={t('Wrapping paper, ribbon and dried flowers')} width={600} height={500} loading="lazy" decoding="async" className="h-[150px] w-full object-cover sm:h-[190px]" /></div>
        </div>
      </div></div>
    </div>
  </section>;
}
