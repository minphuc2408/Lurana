import { AdminPagination } from './AdminPagination';
import { useAdminPagination } from '../hooks/useAdminPresentation';
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react';
import { MAX_PRODUCT_IMAGES } from '../../../../shared/admin-catalog-schemas';
import { useLocale } from '@/shared/i18n';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { AdminApiState, adminInputClass, adminSecondaryClass } from './AdminApiState';
import type { AdminApiProductsModel } from '../hooks/useAdminApiProducts';

export function AdminProductImages(model: AdminApiProductsModel) {
  const { t } = useLocale("admin");
  const gallery = useAdminPagination(model.form.images, 4);
  return <section aria-label={t('Product gallery')} aria-busy={model.imagePending} className="admin-gallery-editor">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{t('Product gallery')}</h3><span className="text-xs text-lunara-body">{t('{{count}} of {{max}} images', { count: model.form.images.length, max: MAX_PRODUCT_IMAGES })}</span></div>
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-lunara-ink px-4 py-2 text-sm font-medium text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--lunara-focus-ring)]"><ImagePlus size={16} aria-hidden="true" />{t('Upload product images')}<input data-testid="product-image-file" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={model.form.images.length >= MAX_PRODUCT_IMAGES} onChange={event => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ''; void model.selectImages(files); }} className="sr-only" /></label>
    <p className="text-xs leading-6 text-lunara-body">{t('Choose up to eight JPEG, PNG or WebP images, up to 5 MB each.')}</p>
    {(model.imagePending || model.imageUploaded) && <p role="status" className="text-xs leading-6 text-lunara-body">{t(model.imagePending ? 'Uploading images…' : 'Images uploaded. Save the product to apply the gallery.')}</p>}
    <AdminApiState error={model.imageError} />
    {model.form.images.length === 0 && <p data-admin-gallery-empty className="rounded-lg border border-dashed border-lunara-control-border px-4 py-8 text-center text-sm text-lunara-body">{t('No product images yet')}</p>}
    <ol data-product-images className="admin-gallery-grid">
      {gallery.items.map((image, pageIndex) => { const index = gallery.page * gallery.pageSize + pageIndex; return <li key={`${image.url}-${index}`} data-product-image-index={index} className="admin-gallery-card">
        <ImageWithFallback src={image.url} alt={t('Product image {{number}}', { number: index + 1 })} className="h-24 w-full rounded-lg object-cover" />
        <div className="min-w-0 flex-1"><p className="text-xs font-medium">{t('Product image {{number}}', { number: index + 1 })}</p><button type="button" data-image-primary aria-pressed={image.is_primary} aria-label={t('Use image {{number}} as cover', { number: index + 1 })} onClick={() => model.primaryImage(index)} className="inline-flex min-h-9 items-center gap-2 text-xs text-lunara-rose-strong"><Star size={15} fill={image.is_primary ? 'currentColor' : 'none'} aria-hidden="true" />{t(image.is_primary ? 'Cover image' : 'Make cover')}</button></div>
        <div className="flex items-center gap-1"><button type="button" data-image-up disabled={index === 0} aria-label={t('Move image {{number}} up', { number: index + 1 })} onClick={() => model.moveImage(index, -1)} className="flex size-9 items-center justify-center rounded-full text-lunara-body hover:bg-lunara-blush disabled:opacity-35"><ArrowUp size={16} /></button><button type="button" data-image-down disabled={index === model.form.images.length - 1} aria-label={t('Move image {{number}} down', { number: index + 1 })} onClick={() => model.moveImage(index, 1)} className="flex size-9 items-center justify-center rounded-full text-lunara-body hover:bg-lunara-blush disabled:opacity-35"><ArrowDown size={16} /></button><button type="button" data-image-remove aria-label={t('Remove image {{number}}', { number: index + 1 })} onClick={() => model.removeImage(index)} className="flex size-9 items-center justify-center rounded-full text-lunara-rose-strong hover:bg-lunara-blush"><Trash2 size={16} /></button></div>
      </li>; })}
    </ol>
    <AdminPagination label={t('Product gallery')} {...gallery} setPageSize={undefined} />

    <details className="admin-gallery-url text-xs"><summary className="text-lunara-body">{t('Use an existing image URL instead')}</summary><label className="mt-1 block text-sm">{t('Image URL')}<input name="image_url" placeholder={t('Paste image URL')} type="url" maxLength={2048} value={model.form.image_url} onChange={event => model.setForm({ ...model.form, image_url: event.target.value })} className={`${adminInputClass} mt-1`} /></label><p className="mt-1 text-xs leading-6 text-lunara-body">{t('Only Cloudinary or Unsplash HTTPS image URLs are allowed.')}</p><button type="button" data-add-image-url disabled={!model.form.image_url.trim() || model.form.images.length >= MAX_PRODUCT_IMAGES} onClick={model.addImageUrl} className={`${adminSecondaryClass} mt-1`}>{t('Add image URL')}</button></details>
  </section>;
}
