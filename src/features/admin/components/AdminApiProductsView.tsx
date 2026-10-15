import { getLocalizedName, useLocale } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { AdminProductForm } from './AdminProductForm';
import { AdminApiState, adminButtonClass, adminInputClass, adminSecondaryClass } from './AdminApiState';
import { variantDraft } from '../admin-api.adapters';
import type { AdminApiProductsModel } from '../hooks/useAdminApiProducts';

export function AdminApiProductsView(model: AdminApiProductsModel) {
  const { t, language } = useLocale("admin");
  return <div data-testid="admin-products" className="space-y-6 p-4 font-body text-lunara-ink sm:p-6">
    <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-end"><label className="block min-w-0 flex-1 text-sm">{t('Search products')}<input name="product_search" value={model.search} onChange={event => model.setSearch(event.target.value)} className={`${adminInputClass} mt-1`} /></label><button data-testid="product-create" disabled={model.savingIds.length > 0} onClick={model.openCreate} className={adminButtonClass}>{t('Create product')}</button></div>
    <AdminApiState loading={model.loading} error={model.error} onRetry={model.reload} empty={model.products.length === 0} />
    {!model.loading && model.error == null && <div className="space-y-5">{model.products.map(product => <section key={product.id} data-product-id={product.id} className="overflow-hidden rounded-2xl border border-lunara-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lunara-border p-4"><div><h2 className="font-display text-2xl">{getLocalizedName(product, language)}</h2><p className="text-sm text-lunara-body">{t(`Product ${product.status}`)} · {product.slug}</p></div><button data-testid={`product-edit-${product.id}`} disabled={model.savingIds.length > 0} onClick={() => model.openEdit(product)} className={adminSecondaryClass}>{t('Edit product')}</button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-lunara-blush"><tr>{['Size and SKU', 'Price VND', 'Compare price VND', 'Stock', 'Low stock threshold', 'Stock adjustment', 'Active', 'Actions'].map(key => <th key={key} className="p-3 font-medium">{t(key)}</th>)}</tr></thead><tbody>{product.variants.map(variant => {
        const draft = model.drafts[variant.id] ?? variantDraft(variant);
        const pending = model.savingIds.includes(variant.id);
        const locked = pending || model.uncertainIds.includes(variant.id);
        return <tr key={variant.id} data-variant-id={variant.id} data-stock={variant.stock_quantity} data-uncertain={String(model.uncertainIds.includes(variant.id))} className="border-t border-lunara-border align-top">
          <td className="p-3"><p className="font-medium">{variant.size_code}</p><p className="text-xs text-lunara-body">{variant.sku}</p><p className="mt-1 whitespace-nowrap text-xs text-lunara-body">{formatVND(variant.price, language)}</p></td>
          <td className="p-3"><input aria-label={t('Price VND')} name="price" type="number" min={0} step={1} value={draft.price} onChange={event => model.updateDraft(variant.id, { price: event.target.value })} disabled={locked} className={`${adminInputClass} min-w-28`} /></td>
          <td className="p-3"><input aria-label={t('Compare price VND')} name="compare_at_price" type="number" min={0} step={1} value={draft.compare_at_price} onChange={event => model.updateDraft(variant.id, { compare_at_price: event.target.value })} disabled={locked} className={`${adminInputClass} min-w-28`} /></td>
          <td className="p-3"><p className="font-medium">{variant.stock_quantity}</p>{variant.stock_quantity <= variant.low_stock_threshold && <p className="mt-2 text-xs font-medium text-lunara-ink">{t(variant.stock_quantity === 0 ? 'Out of stock' : 'Low stock')}</p>}</td>
          <td className="p-3"><input aria-label={t('Low stock threshold')} name="low_stock_threshold" type="number" min={0} step={1} value={draft.low_stock_threshold} onChange={event => model.updateDraft(variant.id, { low_stock_threshold: event.target.value })} disabled={locked} className={`${adminInputClass} min-w-20`} /></td>
          <td className="p-3"><div className="flex min-w-36 items-center gap-1"><button type="button" aria-label={t('Decrease stock adjustment')} disabled={locked} onClick={() => model.updateDraft(variant.id, { stock_delta: String((Number(draft.stock_delta) || 0) - 1) })} className="min-h-11 min-w-9 rounded-lg border border-lunara-border">−</button><input aria-label={t('Stock adjustment')} name="stock_delta" type="number" step={1} value={draft.stock_delta} onChange={event => model.updateDraft(variant.id, { stock_delta: event.target.value })} disabled={locked} className={`${adminInputClass} min-w-16`} /><button type="button" aria-label={t('Increase stock adjustment')} disabled={locked} onClick={() => model.updateDraft(variant.id, { stock_delta: String((Number(draft.stock_delta) || 0) + 1) })} className="min-h-11 min-w-9 rounded-lg border border-lunara-border">+</button></div></td>
          <td className="p-3"><input aria-label={t('Active')} name="is_active" type="checkbox" checked={draft.is_active} onChange={event => model.updateDraft(variant.id, { is_active: event.target.checked })} disabled={locked} className="mt-3 h-4 w-4 accent-lunara-rose-strong" /></td>
          <td className="p-3"><button data-testid={`variant-save-${variant.id}`} disabled={locked} onClick={() => void model.saveVariant(variant)} className={adminButtonClass}>{t(pending ? 'Saving…' : 'Save')}</button>{model.savedIds.includes(variant.id) && <p role="status" className="mt-2 text-xs">{t('Saved')}</p>}<AdminApiState error={model.variantErrors[variant.id]} />{model.uncertainIds.includes(variant.id) && <div className="mt-2 min-w-40 text-xs"><p>{t('Stock update result uncertain')}</p><button type="button" disabled={pending} data-testid={`variant-recheck-${variant.id}`} onClick={() => void model.recheckVariant(variant)} className={`${adminSecondaryClass} mt-2`}>{t('Recheck stock')}</button></div>}{model.reconciledIds.includes(variant.id) && <p role="status" className="mt-2 min-w-40 text-xs">{t('Stock refreshed enter a new adjustment')}</p>}</td>
        </tr>;
      })}</tbody></table></div>
    </section>)}</div>}
    <AdminProductForm {...model} />
  </div>;
}
