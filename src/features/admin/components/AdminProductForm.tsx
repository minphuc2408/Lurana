import { Dropdown } from '@/shared/ui/dropdown';
import { getLocalizedName, useLocale } from '@/shared/i18n';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { AdminApiState, adminButtonClass, adminInputClass, adminSecondaryClass, adminTabKeyDown } from './AdminApiState';
import type { AdminApiProductsModel } from '../hooks/useAdminApiProducts';
import { useAdminProductEditor } from '../hooks/useAdminPresentation';
import { AdminProductImages } from './AdminProductImages';
import { AdminPagination } from './AdminPagination';

export function AdminProductForm(model: AdminApiProductsModel) {
  const { t, language } = useLocale('admin');
  const editor = useAdminProductEditor(model.dialogOpen, model.editing?.id, model.formError, model.initialSection);
  const pending = model.formPending || model.imagePending;
  return <Dialog open={model.dialogOpen} onOpenChange={open => !pending && model.setDialogOpen(open)}><DialogContent data-admin-workspace-dialog data-admin-product-dialog onOpenAutoFocus={editor.focusOnOpen} showCloseButton={!pending} className="bg-lunara-admin-panel font-body text-lunara-ink">
    <div className="admin-dialog-heading"><DialogTitle>{t(model.editing ? 'Edit product' : 'Create product')}</DialogTitle><DialogDescription className="sr-only">{t(model.editing ? 'Update product information' : 'Create a product with three sizes and a photo gallery')}</DialogDescription></div>
    <div className="admin-status-tabs" role="tablist" onKeyDown={adminTabKeyDown} aria-label={t('Product')}>
      {[{ id: 'general', label: 'General information' }, { id: 'images', label: 'Product gallery' }, ...(!model.editing ? [{ id: 'variants', label: 'Sizes and stock' }] : [])].map(tab => <button key={tab.id} type="button" role="tab" tabIndex={editor.section === tab.id ? 0 : -1} aria-selected={editor.section === tab.id} aria-controls={`product-section-${tab.id}`} id={`product-tab-${tab.id}`} onClick={() => editor.setSection(tab.id)} className="admin-filter-tab">{t(tab.label)}</button>)}
    </div>
    <form data-testid="product-form" onSubmit={model.saveProduct} onInvalidCapture={editor.revealInvalid} onInput={editor.clearInvalid} className="admin-editor-form">
      <fieldset disabled={pending} className="admin-editor-fields">
        <div data-product-form-section="general" id="product-section-general" role="tabpanel" aria-labelledby="product-tab-general" hidden={editor.section !== 'general'} className="admin-records p-5">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{(['name_en', 'name_vi'] as const).map(field => <label key={field} className="text-xs text-lunara-body">{t(field === 'name_en' ? 'Product name English' : 'Product name Vietnamese')}<input name={field} placeholder={t(field === 'name_en' ? 'Product name English' : 'Product name Vietnamese')} required maxLength={200} value={model.form[field]} onChange={event => model.setForm({ ...model.form, [field]: event.target.value })} className={`${adminInputClass} mt-2`} /></label>)}
            {!model.editing && <label className="text-xs text-lunara-body">{t('Category')}<Dropdown name="category_id" required value={model.form.category_id} onValueChange={value => model.setForm({ ...model.form, category_id: value })} className={`${adminInputClass} mt-2`}><option value="">{t('Choose category')}</option>{model.categories.map(category => <option key={category.id} value={category.id}>{getLocalizedName(category, language)}</option>)}</Dropdown></label>}
            <label className="text-xs text-lunara-body">{t('Product status')}<Dropdown name="status" className={`${adminInputClass} mt-2`} value={model.form.status} onValueChange={value => model.setForm({ ...model.form, status: value as typeof model.form.status })}>{(['ACTIVE', 'HIDDEN', 'ARCHIVED'] as const).map(status => <option key={status} value={status}>{t(`Product ${status}`)}</option>)}</Dropdown></label>
            <label className="flex min-h-11 items-center gap-2 text-sm"><input name="is_featured" type="checkbox" checked={model.form.is_featured} onChange={event => model.setForm({ ...model.form, is_featured: event.target.checked })} className="size-4" />{t('Featured product')}</label>
          </div>
          {!model.editing && <AdminApiState loading={model.categoriesLoading} error={model.categoriesError} onRetry={model.retryCategories} />}
          {!model.editing && !model.categoriesLoading && model.categoriesError == null && model.categories.length === 0 && <div role="status" className="mt-4 rounded-xl bg-lunara-admin-soft p-4 text-sm"><p>{t('No categories yet. Add at least one category before creating a product, then reload categories.')}</p><button type="button" onClick={model.retryCategories} className={`${adminSecondaryClass} mt-3`}>{t('Reload categories')}</button></div>}
        </div>
        <div data-product-form-section="images" id="product-section-images" role="tabpanel" aria-labelledby="product-tab-images" hidden={editor.section !== 'images'} className="admin-gallery-panel"><AdminProductImages {...model} /></div>
        {!model.editing && <div data-product-form-section="variants" id="product-section-variants" role="tabpanel" aria-labelledby="product-tab-variants" hidden={editor.section !== 'variants'} className="admin-product-variants-panel">
          <div className="admin-records p-5">{model.form.variants.map((variant, index) => <fieldset key={variant.size_code} data-product-size={variant.size_code} hidden={editor.size !== variant.size_code}><legend className="mb-5 text-base font-medium">{t('Size {{size}}', { size: variant.size_code })}</legend><div className="grid gap-5 sm:grid-cols-2">{([{ field: 'sku', label: 'SKU', type: 'text' }, { field: 'price', label: 'Price VND', type: 'number' }, { field: 'stock_quantity', label: 'Stock', type: 'number' }, { field: 'low_stock_threshold', label: 'Low stock threshold', type: 'number' }] as const).map(({ field, label, type }) => <label key={field} className="text-xs text-lunara-body">{t(label)}<input name={`${field === 'stock_quantity' ? 'stock' : field === 'low_stock_threshold' ? 'threshold' : field}-${variant.size_code}`} type={type} placeholder={field === 'sku' ? t('Enter SKU') : '0'} required min={type === 'number' ? 0 : undefined} step={type === 'number' ? 1 : undefined} maxLength={field === 'sku' ? 100 : undefined} value={variant[field]} onChange={event => model.setForm({ ...model.form, variants: model.form.variants.map((item, variantIndex) => variantIndex === index ? { ...item, [field]: event.target.value } : item) })} className={`${adminInputClass} mt-2`} /></label>)}</div></fieldset>)}</div>
          <AdminPagination label={t('Sizes and stock')} total={model.form.variants.length} page={Math.max(0, model.form.variants.findIndex(variant => variant.size_code === editor.size))} pageSize={1} setPage={page => editor.setSize(model.form.variants[page].size_code)} />
        </div>}
      </fieldset>
      <div className="admin-dialog-footer"><div className="min-w-0 flex-1">{editor.invalid && <p role="alert" className="text-xs text-lunara-body">{t('Complete the highlighted field before saving.')}</p>}<AdminApiState error={model.formError} /></div><button type="button" disabled={pending} onClick={() => model.setDialogOpen(false)} className={adminSecondaryClass}>{t('Cancel')}</button><button data-testid="product-form-save" disabled={pending || (!model.editing && (model.categoriesLoading || model.categories.length === 0))} className={adminButtonClass}>{t(model.formPending ? 'Saving…' : 'Save product')}</button></div>
    </form>
  </DialogContent></Dialog>;
}
