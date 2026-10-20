import { ChevronDown, ChevronUp, Maximize2, Flower2 } from 'lucide-react';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import type { ProductDetailModel } from '../hooks/useProductDetail';
import { useThumbnailRail } from '../hooks/useThumbnailRail';

export function ProductGallery(model: ProductDetailModel) {
  const { t, language } = useLocale("shop");
  const rail = useThumbnailRail(model.imageIndex, model.images.length);
  if (!model.product) return null;
  const name = getLocalizedName(model.product, language);
  const alt = (language === 'vi' ? model.image?.alt_vi || model.image?.alt_en : model.image?.alt_en || model.image?.alt_vi) || name;
  return <div data-product-gallery className="min-w-0">
    <Dialog open={model.zoomOpen} onOpenChange={model.setZoomOpen}>
    <div className={cn('grid min-w-0 gap-3 sm:gap-4', model.images.length > 1 && 'lg:grid-cols-[72px_minmax(0,1fr)] xl:grid-cols-[80px_minmax(0,1fr)]')}>
      {model.images.length > 1 && <div className="order-2 min-w-0 lg:relative lg:order-1 lg:min-h-0">
      <nav ref={rail.railRef} data-product-thumbnails aria-label={t('Product photos')} className="relative flex gap-3 overflow-x-auto pb-1 lg:absolute lg:inset-x-0 lg:top-0 lg:bottom-12 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0">
        {model.images.map((image, index) => <button key={`${image.url}-${index}`} type="button" aria-label={t('View image {{number}}', { number: index + 1 })} aria-pressed={model.imageIndex === index} onClick={() => model.selectImage(index)} className={cn('size-16 shrink-0 overflow-hidden rounded-[2px] border border-transparent bg-lunara-blush transition-colors hover:bg-lunara-detail-thumbnail-hover sm:size-20 lg:h-auto lg:w-full lg:aspect-square', model.imageIndex === index && 'border-lunara-detail-selected-border')}>
          <ImageWithFallback src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
        </button>)}
      </nav>
      {rail.overflow && <button type="button" data-product-thumbnails-more aria-label={t(rail.atEnd ? 'Back to first photos' : 'More photos')} onClick={rail.scrollMore} className="absolute inset-x-0 bottom-0 mx-auto hidden size-11 items-center justify-center rounded-full bg-lunara-detail-selected text-lunara-ink transition-colors hover:bg-lunara-detail-thumbnail-hover lg:flex">{rail.atEnd ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}</button>}
      </div>}
      <div className="order-1 min-w-0 lg:order-2">
        {model.image ? <DialogTrigger asChild><button type="button" data-product-zoom aria-label={t('Enlarge product photo')} className="group relative block aspect-[0.93] w-full overflow-hidden rounded-[2px] bg-lunara-blush text-lunara-ink">
          <ImageWithFallback src={model.image.url} alt={alt} className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]" fetchPriority="high" decoding="async" />
          <span aria-hidden="true" className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-[2px] border border-lunara-border bg-lunara-card-surface/95"><Maximize2 size={16} /></span>
        </button></DialogTrigger> : <div role="img" aria-label={t('Product photo unavailable')} className="flex aspect-[0.93] items-center justify-center rounded-[2px] bg-lunara-blush text-lunara-rose-strong"><Flower2 size={72} strokeWidth={1} /></div>}
      </div>
    </div>
      <DialogContent className="max-h-[92dvh] rounded-3xl border-lunara-border bg-lunara-cream p-5 pt-12 sm:max-w-4xl" aria-describedby="product-photo-description">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription id="product-photo-description" className="sr-only">{t('Enlarge product photo')}</DialogDescription>
        <ImageWithFallback src={model.image?.url} alt={alt} className="max-h-[75dvh] w-full rounded-2xl object-contain" />
      </DialogContent>
    </Dialog>
  </div>;
}
