import { Maximize2, Flower2 } from 'lucide-react';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import type { ProductDetailModel } from '../hooks/useProductDetail';

export function ProductGallery(model: ProductDetailModel) {
  const { t, language } = useLocale("shop");
  if (!model.product) return null;
  const name = getLocalizedName(model.product, language);
  const alt = (language === 'vi' ? model.image?.alt_vi || model.image?.alt_en : model.image?.alt_en || model.image?.alt_vi) || name;
  return <div data-product-gallery className="min-w-0">
    <Dialog open={model.zoomOpen} onOpenChange={model.setZoomOpen}>
    <div className="flex min-w-0 flex-col gap-4">
      {model.images.length > 1 && <nav aria-label={t('Product photos')} className="order-2 flex gap-3 overflow-x-auto pb-1">
        {model.images.map((image, index) => <button key={`${image.url}-${index}`} type="button" aria-label={t('View image {{number}}', { number: index + 1 })} aria-pressed={model.imageIndex === index} onClick={() => model.selectImage(index)} className={cn('size-16 shrink-0 overflow-hidden rounded-[2px] border bg-lunara-blush transition-colors sm:size-20', model.imageIndex === index ? 'border-lunara-rose-strong' : 'border-lunara-border')}>
          <ImageWithFallback src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
        </button>)}
      </nav>}
      <div className="order-1 min-w-0">
        {model.image ? <DialogTrigger asChild><button type="button" data-product-zoom aria-label={t('Enlarge product photo')} className="group relative block aspect-square w-full overflow-hidden rounded-[2px] bg-lunara-blush text-lunara-ink">
          <ImageWithFallback src={model.image.url} alt={alt} className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]" fetchPriority="high" decoding="async" />
          <span aria-hidden="true" className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-[2px] border border-lunara-border bg-lunara-card-surface/95"><Maximize2 size={16} /></span>
        </button></DialogTrigger> : <div role="img" aria-label={t('Product photo unavailable')} className="flex aspect-square items-center justify-center rounded-[2px] bg-lunara-blush text-lunara-rose-strong"><Flower2 size={72} strokeWidth={1} /></div>}
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
