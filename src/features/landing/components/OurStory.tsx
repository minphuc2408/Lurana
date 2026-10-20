import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import floristPhoto from '@/assets/home-reference/story-florist-1000.jpg';
import cardPhoto from '@/assets/home-reference/story-card-600.jpg';
import wrappingPhoto from '@/assets/home-reference/story-wrapping-600.jpg';

export function OurStory() {
  const { t } = useLocale('landing');
  return <section id="cau-chuyen-lunarra" data-home-story aria-labelledby="home-story-title" className="bg-lunara-card-surface py-16 sm:py-24 [--story-photo-height:20rem] sm:[--story-photo-height:25rem] [--story-photo-gap:1rem] sm:[--story-photo-gap:1.25rem]">
    <div className="mx-auto grid max-w-[var(--lunara-content-max-width)] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
      <div className="min-w-0 lg:col-span-5">
        <span className="mb-4 block text-[11px] font-medium tracking-[0.18em] text-lunara-editorial-label uppercase">{t('The Lunarra story')}</span>
        <h2 id="home-story-title" className="mb-6 font-display text-3xl leading-[1.2] tracking-tight whitespace-pre-line text-lunara-ink sm:text-4xl">{t('Sincere things begin with flowers')}</h2>
        <p className="mb-8 text-base leading-[1.75] text-lunara-body">{t('Each Lunarra bouquet is prepared with care')}</p>
        <Link data-story-link to="/about" className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-lunara-secondary-link transition-colors hover:text-lunara-ink">{t('Discover our story')}<ArrowRight size={16} aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-1 motion-reduce:transition-none" /></Link>
      </div>
      <div className="min-w-0 lg:col-span-7"><div className="grid grid-cols-12 items-end gap-[var(--story-photo-gap)]">
        <div className="col-span-8 overflow-hidden rounded-[2px] bg-lunara-blush"><ImageWithFallback data-story-photo="florist" src={floristPhoto} alt={t('Flowers displayed outside the studio')} width={1000} height={652} loading="lazy" decoding="async" className="h-[var(--story-photo-height)] w-full object-cover object-center" /></div>
        <div className="col-span-4 space-y-[var(--story-photo-gap)]">
          <div className="overflow-hidden rounded-[2px] bg-lunara-blush"><ImageWithFallback data-story-photo="card" src={cardPhoto} alt={t('A handwritten card on textured paper')} width={600} height={900} loading="lazy" decoding="async" className="h-[calc((var(--story-photo-height)-var(--story-photo-gap))/2)] w-full object-cover object-center" /></div>
          <div className="overflow-hidden rounded-[2px] bg-lunara-blush"><ImageWithFallback data-story-photo="wrapping" src={wrappingPhoto} alt={t('Wrapping paper, ribbon and dried flowers')} width={600} height={400} loading="lazy" decoding="async" className="h-[calc((var(--story-photo-height)-var(--story-photo-gap))/2)] w-full object-cover object-center" /></div>
        </div>
      </div></div>
    </div>
  </section>;
}
