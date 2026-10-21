import { ArrowDown, ArrowUp, Star, Trash2 } from 'lucide-react';
import { MAX_PRODUCT_IMAGES } from '../../../../shared/admin-catalog-schemas';
import { useLocale } from '@/shared/i18n';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { AdminApiState, adminInputClass, adminSecondaryClass } from './AdminApiState';
import type { AdminApiProductsModel } from '../hooks/useAdminApiProducts';

export function AdminProductImages(model: AdminApiProductsModel) {
  const { t } = useLocale("admin");
  return <section aria-label={t('Product gallery')} aria-busy={model.imagePending} className="space-y-4 rounded-lunara-admin-panel border border-lunara-border bg-lunara-cream p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{t('Product gallery')}</h3><span className="text-xs text-lunara-body">{t('{{count}} of {{max}} images', { count: model.form.images.length, max: MAX_PRODUCT_IMAGES })}</span></div>
    <label className="block text-sm font-medium">{t('Upload product images')}<input data-testid="product-image-file" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={model.form.images.length >= MAX_PRODUCT_IMAGES} onChange={event => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ''; void model.selectImages(files); }} className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-lunara-rose-strong file:px-4 file:py-2 file:text-white disabled:opacity-50" /></label>
    <p className="text-xs leading-6 text-lunara-body">{t('Choose up to eight JPEG, PNG or WebP images, up to 5 MB each.')}</p>
    <p role="status" className="text-xs leading-6 text-lunara-body">{model.imagePending ? t('Uploading images…') : model.imageUploaded ? t('Images uploaded. Save the product to apply the gallery.') : t('Choose a cover image and arrange the gallery below.')}</p>
    <AdminApiState error={model.imageError} />
    <ol data-product-images className="space-y-3">
      {model.form.images.map((image, index) => <li key={`${image.url}-${index}`} data-product-image-index={index} className="flex min-w-0 flex-wrap gap-3 rounded-lunara-admin-panel bg-lunara-surface p-3">
        <ImageWithFallback src={image.url} alt={t('Product image {{number}}', { number: index + 1 })} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1"><p className="text-xs font-medium">{t('Product image {{number}}', { number: index + 1 })}</p><button type="button" data-image-primary aria-pressed={image.is_primary} aria-label={t('Use image {{number}} as cover', { number: index + 1 })} onClick={() => model.primaryImage(index)} className="mt-1 inline-flex min-h-11 items-center gap-2 text-xs text-lunara-rose-strong"><Star size={15} fill={image.is_primary ? 'currentColor' : 'none'} aria-hidden="true" />{t(image.is_primary ? 'Cover image' : 'Make cover')}</button></div>
        <div className="flex items-center gap-1"><button type="button" data-image-up disabled={index === 0} aria-label={t('Move image {{number}} up', { number: index + 1 })} onClick={() => model.moveImage(index, -1)} className="flex size-11 items-center justify-center rounded-full text-lunara-body hover:bg-lunara-blush disabled:opacity-35"><ArrowUp size={16} /></button><button type="button" data-image-down disabled={index === model.form.images.length - 1} aria-label={t('Move image {{number}} down', { number: index + 1 })} onClick={() => model.moveImage(index, 1)} className="flex size-11 items-center justify-center rounded-full text-lunara-body hover:bg-lunara-blush disabled:opacity-35"><ArrowDown size={16} /></button><button type="button" data-image-remove aria-label={t('Remove image {{number}}', { number: index + 1 })} onClick={() => model.removeImage(index)} className="flex size-11 items-center justify-center rounded-full text-lunara-rose-strong hover:bg-lunara-blush"><Trash2 size={16} /></button></div>
      </li>)}
    </ol>
    <p className="text-xs leading-6 text-lunara-body">{t('Removing an image only removes its product link. The original file stays in Cloudinary.')}</p>
    <details className="rounded-lunara-admin-panel border border-lunara-border p-3 text-sm"><summary className="text-lunara-body">{t('Use an existing image URL instead')}</summary><label className="mt-3 block text-sm">{t('Image URL')}<input name="image_url" type="url" maxLength={2048} value={model.form.image_url} onChange={event => model.setForm({ ...model.form, image_url: event.target.value })} className={`${adminInputClass} mt-1`} /></label><p className="mt-2 text-xs leading-6 text-lunara-body">{t('Only Cloudinary or Unsplash HTTPS image URLs are allowed.')}</p><button type="button" data-add-image-url disabled={!model.form.image_url.trim() || model.form.images.length >= MAX_PRODUCT_IMAGES} onClick={model.addImageUrl} className={`${adminSecondaryClass} mt-3`}>{t('Add image URL')}</button></details>
  </section>;
}
