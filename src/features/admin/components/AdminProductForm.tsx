import { getLocalizedName, useLocale } from '@/shared/i18n';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { AdminApiState, adminButtonClass, adminInputClass, adminSecondaryClass } from './AdminApiState';
import type { AdminApiProductsModel } from '../hooks/useAdminApiProducts';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';

export function AdminProductForm(model: AdminApiProductsModel) {
  const { t, language } = useLocale("admin");
  return <Dialog open={model.dialogOpen} onOpenChange={open => !model.formPending && !model.imagePending && model.setDialogOpen(open)}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-lunara-border bg-white font-body text-lunara-ink sm:max-w-2xl">
    <DialogTitle className="font-display text-2xl">{t(model.editing ? 'Edit product' : 'Create product')}</DialogTitle>
    <DialogDescription className="text-lunara-body">{t(model.editing ? 'Update product information' : 'Create a product with three sizes and upload an image')}</DialogDescription>
    <form data-testid="product-form" onSubmit={model.saveProduct} className="space-y-4">
      <fieldset disabled={model.formPending || model.imagePending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">{(['name_en', 'name_vi'] as const).map(field => <label key={field} className="text-sm">{t(field === 'name_en' ? 'Product name English' : 'Product name Vietnamese')}<input name={field} required maxLength={200} value={model.form[field]} onChange={event => model.setForm({ ...model.form, [field]: event.target.value })} className={`${adminInputClass} mt-1`} /></label>)}</div>
        {!model.editing && <div><label className="text-sm">{t('Category')}<select name="category_id" required value={model.form.category_id} onChange={event => model.setForm({ ...model.form, category_id: event.target.value })} className={`${adminInputClass} mt-1`}><option value="">{t('Choose category')}</option>{model.categories.map(category => <option key={category.id} value={category.id}>{getLocalizedName(category, language)}</option>)}</select></label></div>}
        {!model.editing && <AdminApiState loading={model.categoriesLoading} error={model.categoriesError} onRetry={model.retryCategories} />}
        {!model.editing && !model.categoriesLoading && model.categoriesError == null && model.categories.length === 0 && <div role="status" className="rounded-xl border border-lunara-border bg-lunara-blush p-4 text-sm text-lunara-ink">
          <p>{t('No categories yet. Add at least one category before creating a product, then reload categories.')}</p>
          <button type="button" onClick={model.retryCategories} className={`${adminSecondaryClass} mt-3`}>{t('Reload categories')}</button>
        </div>}
        <div className="space-y-3 rounded-2xl border border-lunara-border bg-lunara-cream p-4" aria-busy={model.imagePending}>
          <label className="block text-sm font-medium">{t('Upload product image')}<input data-testid="product-image-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void model.selectImage(file); }} className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-lunara-rose-strong file:px-4 file:py-2 file:text-white" /></label>
          <p className="text-sm text-lunara-body">{t('Choose a JPEG, PNG or WebP image up to 5 MB.')}</p>
          <p role="status" className="text-sm text-lunara-body">{model.imagePending ? t('Uploading image…') : model.imageUploaded ? t('Image uploaded. Save the product to apply it.') : ''}</p>
          <AdminApiState error={model.imageError} />
          {model.form.image_url && <ImageWithFallback src={model.form.image_url} alt={t('Product image preview')} className="h-40 w-40 rounded-xl border border-lunara-border object-cover" />}
        </div>
        <details className="rounded-xl border border-lunara-border p-3 text-sm">
          <summary className="cursor-pointer text-lunara-body">{t('Use an existing image URL instead')}</summary>
        <label className="block text-sm">{t('Image URL')}<input name="image_url" type="url" maxLength={2048} value={model.form.image_url} onChange={event => model.setForm({ ...model.form, image_url: event.target.value })} className={`${adminInputClass} mt-1`} /></label>
        <p className="mt-2 text-sm text-lunara-body">{t('Only Cloudinary or Unsplash HTTPS image URLs are allowed.')}</p>
        </details>
        <div className="grid items-center gap-4 sm:grid-cols-2"><label className="text-sm">{t('Product status')}<select name="status" className={`${adminInputClass} mt-1`} value={model.form.status} onChange={event => model.setForm({ ...model.form, status: event.target.value as typeof model.form.status })}>{(['ACTIVE', 'HIDDEN', 'ARCHIVED'] as const).map(status => <option key={status} value={status}>{t(`Product ${status}`)}</option>)}</select></label><label className="flex min-h-11 items-center gap-2 text-sm"><input name="is_featured" type="checkbox" checked={model.form.is_featured} onChange={event => model.setForm({ ...model.form, is_featured: event.target.checked })} className="h-4 w-4 accent-lunara-rose-strong" />{t('Featured product')}</label></div>
        {!model.editing && <div className="space-y-4">{model.form.variants.map((variant, index) => <fieldset key={variant.size_code} className="rounded-xl border border-lunara-border p-4"><legend className="px-2 font-medium">{t('Size {{size}}', { size: variant.size_code })}</legend><div className="grid gap-3 sm:grid-cols-2">{([{ field: 'sku', label: 'SKU', type: 'text' }, { field: 'price', label: 'Price VND', type: 'number' }, { field: 'stock_quantity', label: 'Stock', type: 'number' }, { field: 'low_stock_threshold', label: 'Low stock threshold', type: 'number' }] as const).map(({ field, label, type }) => <label key={field} className="text-sm">{t(label)}<input name={`${field === 'stock_quantity' ? 'stock' : field === 'low_stock_threshold' ? 'threshold' : field}-${variant.size_code}`} type={type} required min={type === 'number' ? 0 : undefined} step={type === 'number' ? 1 : undefined} maxLength={field === 'sku' ? 100 : undefined} value={variant[field]} onChange={event => model.setForm({ ...model.form, variants: model.form.variants.map((item, variantIndex) => variantIndex === index ? { ...item, [field]: event.target.value } : item) })} className={`${adminInputClass} mt-1`} /></label>)}</div></fieldset>)}</div>}
      </fieldset>
      <AdminApiState error={model.formError} />
      <div className="flex flex-wrap gap-3"><button type="button" disabled={model.formPending || model.imagePending} onClick={() => model.setDialogOpen(false)} className={adminSecondaryClass}>{t('Cancel')}</button><button data-testid="product-form-save" disabled={model.formPending || model.imagePending || (!model.editing && (model.categoriesLoading || model.categories.length === 0))} className={adminButtonClass}>{t(model.formPending ? 'Saving…' : 'Save product')}</button></div>
    </form>
  </DialogContent></Dialog>;
}
