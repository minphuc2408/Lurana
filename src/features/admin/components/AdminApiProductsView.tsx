import { AdminPagination } from './AdminPagination';
import { useAdminPagination, useInventoryPanel } from '../hooks/useAdminPresentation';
import { Check, ChevronDown, Download, FileUp, ImagePlus, Minus, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { getLocalizedName, useLocale } from '@/shared/i18n';
import { AdminDeleteDialog } from './AdminDeleteDialog';
import { AdminProductForm } from './AdminProductForm';
import { AdminProductImport } from './AdminProductImport';
import { AdminApiState, adminButtonClass, adminInputClass, adminSecondaryClass } from './AdminApiState';
import { variantDraft } from '../admin-api.adapters';
import type { AdminProduct } from '../admin-api.types';
import type { AdminApiProductsModel } from '../hooks/useAdminApiProducts';

function ProductInventoryPanel({ product, model, initiallyOpen }: { product: AdminProduct; model: AdminApiProductsModel; initiallyOpen: boolean }) {
  const { t, language } = useLocale('admin');
  const { open, toggle } = useInventoryPanel(initiallyOpen);
  const variantPagination = useAdminPagination(product.variants, 3, String(product.id));
  const image = product.images.find(item => item.is_primary)?.url || product.images[0]?.url;
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock_quantity, 0);
  return <section data-product-id={product.id} className="admin-panel">
    <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
      {image ? <ImageWithFallback src={image} alt={getLocalizedName(product, language)} width={56} height={64} className="h-16 w-14 shrink-0 rounded-lg object-cover" /> : <span className="flex h-16 w-14 shrink-0 items-center justify-center rounded-lg bg-lunara-admin-soft"><Package size={24} strokeWidth={1.25} className="text-lunara-body" aria-hidden="true" /></span>}
      <button type="button" aria-expanded={open} aria-controls={`product-variants-${product.id}`} onClick={toggle} className="min-w-0 flex-1 text-left">
        <h3 className="truncate font-display text-lg sm:text-xl">{getLocalizedName(product, language)}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-lunara-body"><span className="admin-status">{t(`Product ${product.status}`)}</span><span>{t('{{count}} variants', { count: product.variants.length })}</span><span>{t('{{count}} in stock', { count: totalStock })}</span></div>
      </button>
      <button type="button" data-testid={`product-upload-images-${product.id}`} disabled={model.savingIds.length > 0} onClick={() => model.openEdit(product, 'images')} aria-label={`${t('Upload images')}: ${getLocalizedName(product, language)}`} title={t('Upload images')} className={`${adminSecondaryClass} shrink-0 !px-3`}><ImagePlus size={15} aria-hidden="true" /><span className="hidden lg:inline">{t('Upload images')}</span></button>
      <button data-testid={`product-edit-${product.id}`} disabled={model.savingIds.length > 0} onClick={() => model.openEdit(product)} aria-label={`${t('Edit product')}: ${getLocalizedName(product, language)}`} className={`${adminSecondaryClass} shrink-0 !px-3`}><Pencil size={15} aria-hidden="true" /><span className="hidden sm:inline">{t('Edit product')}</span></button>
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={`product-variants-${product.id}`} aria-label={`${t('Size and SKU')}: ${getLocalizedName(product, language)}`} className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-lunara-admin-soft"><ChevronDown size={18} className={`transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" /></button>
    </div>
    <div id={`product-variants-${product.id}`} hidden={!open}>
      <div className="overflow-x-auto"><table className="admin-table min-w-[1100px]"><thead><tr>{['No.', 'Actions', 'Size and SKU', 'Price VND', 'Compare price VND', 'Stock', 'Low stock threshold', 'Stock adjustment', 'Active'].map(key => <th key={key} scope="col" className={`p-3 font-medium ${key === 'No.' || key === 'Size and SKU' ? '!text-center' : ''}`}>{t(key)}</th>)}</tr></thead><tbody>{variantPagination.items.map((variant, index) => {
        const draft = model.drafts[variant.id] ?? variantDraft(variant);
        const pending = model.savingIds.includes(variant.id);
        const locked = pending || model.uncertainIds.includes(variant.id);
        const editing = model.editingVariantId === variant.id;
        const fieldLocked = locked || !editing;
        const dirty = JSON.stringify(draft) !== JSON.stringify(variantDraft(variant));
        return <tr key={variant.id} data-variant-id={variant.id} data-stock={variant.stock_quantity} data-uncertain={String(model.uncertainIds.includes(variant.id))} className="border-t border-lunara-border align-top">
          <td className="w-14 p-3 !text-center"><span aria-label={t('Sequence number')} className="text-xs text-lunara-body">{variantPagination.page * variantPagination.pageSize + index + 1}</span></td>
          <td className="p-3"><div className="flex items-center gap-1">
            <button type="button" data-testid={`variant-delete-${variant.id}`} aria-label={`${t('Delete SKU')}: ${variant.sku}`} title={t('Delete SKU')} disabled={locked || model.savingIds.length > 0 || product.variants.length < 2} onClick={() => model.requestDeleteVariant(variant)} className={`${adminSecondaryClass} !px-3`}><Trash2 size={15} aria-hidden="true" /></button>
            <button type="button" data-testid={`${editing ? 'variant-save' : 'variant-edit'}-${variant.id}`} aria-label={`${t(editing ? 'Save' : 'Edit')}: ${variant.sku}`} title={t(editing ? 'Save' : 'Edit')} disabled={locked} onClick={() => editing ? void model.saveVariant(variant) : model.setEditingVariantId(variant.id)} className={`${editing ? adminButtonClass : adminSecondaryClass} !px-3`}>{editing ? <Check size={15} aria-hidden="true" /> : <Pencil size={15} aria-hidden="true" />}</button>
            {editing && <button type="button" aria-label={`${t('Cancel')}: ${variant.sku}`} disabled={locked} onClick={() => { model.updateDraft(variant.id, variantDraft(variant)); model.setEditingVariantId(null); }} className={`${adminSecondaryClass} !px-3`}><X size={15} aria-hidden="true" /></button>}
          </div>{dirty && !editing && <p className="mt-1 text-xs text-lunara-body">{t('Unsaved changes')}</p>}{model.savedIds.includes(variant.id) && <p role="status" className="mt-1 text-xs">{t('Saved')}</p>}<AdminApiState error={model.variantErrors[variant.id]} />{model.uncertainIds.includes(variant.id) && <div className="mt-1 min-w-40 text-xs"><p>{t('Stock update result uncertain')}</p><button type="button" disabled={pending} data-testid={`variant-recheck-${variant.id}`} onClick={() => void model.recheckVariant(variant)} className={`${adminSecondaryClass} mt-1`}>{t('Recheck stock')}</button></div>}{model.reconciledIds.includes(variant.id) && <p role="status" className="mt-1 min-w-40 text-xs">{t('Stock refreshed enter a new adjustment')}</p>}</td>
          <td className="p-3 !text-center"><p className="mx-auto flex size-8 items-center justify-center rounded-lg bg-lunara-admin-soft font-medium">{variant.size_code}</p><p className="mt-1 text-xs text-lunara-body">{variant.sku}</p></td>
          <td className="p-3"><input aria-label={t('Price VND')} name="price" type="number" min={0} step={1} value={draft.price} onChange={event => model.updateDraft(variant.id, { price: event.target.value })} disabled={fieldLocked} className={`${adminInputClass} min-w-28`} /></td>
          <td className="p-3"><input aria-label={t('Compare price VND')} name="compare_at_price" placeholder={t('Not set')} type="number" min={0} step={1} value={draft.compare_at_price} onChange={event => model.updateDraft(variant.id, { compare_at_price: event.target.value })} disabled={fieldLocked} className={`${adminInputClass} min-w-28`} /></td>
          <td className="p-3"><p className="text-xl font-medium">{variant.stock_quantity}</p>{variant.stock_quantity <= variant.low_stock_threshold && <p className="mt-1 text-xs font-medium text-lunara-ink">{t(variant.stock_quantity === 0 ? 'Out of stock' : 'Low stock')}</p>}</td>
          <td className="p-3"><input aria-label={t('Low stock threshold')} name="low_stock_threshold" type="number" min={0} step={1} value={draft.low_stock_threshold} onChange={event => model.updateDraft(variant.id, { low_stock_threshold: event.target.value })} disabled={fieldLocked} className={`${adminInputClass} min-w-20`} /></td>
          <td className="p-3"><div className="flex min-w-36 items-center gap-1"><button type="button" aria-label={t('Decrease stock adjustment')} disabled={fieldLocked} onClick={() => model.updateDraft(variant.id, { stock_delta: String((Number(draft.stock_delta) || 0) - 1) })} className="flex min-h-11 min-w-9 items-center justify-center rounded-lg border border-lunara-border hover:bg-lunara-admin-soft disabled:opacity-40"><Minus size={14} aria-hidden="true" /></button><input aria-label={t('Stock adjustment')} name="stock_delta" placeholder="0" type="number" step={1} value={draft.stock_delta} onChange={event => model.updateDraft(variant.id, { stock_delta: event.target.value })} disabled={fieldLocked} className={`${adminInputClass} min-w-16`} /><button type="button" aria-label={t('Increase stock adjustment')} disabled={fieldLocked} onClick={() => model.updateDraft(variant.id, { stock_delta: String((Number(draft.stock_delta) || 0) + 1) })} className="flex min-h-11 min-w-9 items-center justify-center rounded-lg border border-lunara-border hover:bg-lunara-admin-soft disabled:opacity-40"><Plus size={14} aria-hidden="true" /></button></div></td>
          <td className="p-3"><input aria-label={t('Active')} name="is_active" type="checkbox" checked={draft.is_active} onChange={event => model.updateDraft(variant.id, { is_active: event.target.checked })} disabled={fieldLocked} className="mt-3 h-4 w-4 accent-lunara-ink" /></td>
        </tr>;
      })}</tbody></table></div>
      <AdminPagination label={`${getLocalizedName(product, language)} · ${t('Size and SKU')}`} {...variantPagination} setPageSize={undefined} />
    </div>
  </section>;
}

export function AdminApiProductsView(model: AdminApiProductsModel) {
  const { t } = useLocale('admin');
  const { filter, setFilter } = model.list;
  const pagination = { ...model.list, total: model.total };
  const products = model.products;
  const lowStockCount = model.counts.low, hiddenCount = model.counts.hidden;
  return <div data-testid="admin-products" className="admin-page admin-workspace">
    <div className="admin-panel admin-stock-toolbar flex shrink-0 flex-wrap items-center justify-between gap-3 p-4">
      <div aria-label={t('Product status')} className="admin-inline-tabs">{[{ id: 'all', label: 'All products', count: model.counts.all }, { id: 'low', label: 'Low stock', count: lowStockCount }, { id: 'hidden', label: 'Not on display', count: hiddenCount }].map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className="admin-filter-tab">{t(item.label)}<span className="text-xs text-lunara-body">{item.count}</span></button>)}</div>
      <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-3"><label className="relative block min-w-40 flex-1 sm:max-w-72"><span className="sr-only">{t('Search products')}</span><Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-lunara-body" aria-hidden="true" /><input name="product_search" placeholder={t('Product name or SKU')} value={model.search} onChange={event => model.setSearch(event.target.value)} className={`${adminInputClass} !pl-10`} /></label>
        <div className="flex flex-wrap items-center gap-2"><button type="button" data-testid="product-template-download" disabled={model.productImport.downloading} onClick={() => void model.productImport.download()} className={adminSecondaryClass}><Download size={16} aria-hidden="true" />{t(model.productImport.downloading ? 'Downloading…' : 'Download template')}</button>
        <button type="button" data-testid="product-import-open" disabled={model.savingIds.length > 0 || model.loading} onClick={model.productImport.show} className={adminSecondaryClass}><FileUp size={16} aria-hidden="true" />{t('Upload product file')}</button>
        <button aria-label={t('Create product')} data-testid="product-create" disabled={model.savingIds.length > 0} onClick={model.openCreate} className={adminButtonClass}><Plus size={17} aria-hidden="true" /><span className="hidden sm:inline">{t('Create product')}</span></button></div>
      </div>
      <AdminApiState error={model.productImport.downloadError} />
    </div>
    <div className="admin-collection admin-panel"><div data-admin-records className="admin-records space-y-4 bg-lunara-admin-background p-0"><AdminApiState loading={model.loading} error={model.error} onRetry={model.reload} empty={pagination.total === 0} />
      {!model.loading && model.error == null && products.map((product, index) => <ProductInventoryPanel key={product.id} product={product} model={model} initiallyOpen={index === 0} />)}
    </div><AdminPagination label={t('Products')} {...pagination} setPageSize={pagination.setPageSize} loading={model.loading} /></div>
    <AdminProductForm {...model} />
    <AdminProductImport {...model.productImport} />
    <AdminDeleteDialog open={Boolean(model.deletingVariant)} kind="variant" name={model.deletingVariant?.sku ?? ''} pending={model.deletePending} error={model.deleteError} onClose={() => model.requestDeleteVariant(null)} onConfirm={() => void model.confirmDeleteVariant()} />
  </div>;
}
