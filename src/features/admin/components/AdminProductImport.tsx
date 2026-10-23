import { FileUp } from 'lucide-react';
import { getLocalizedName, useLocale } from '@/shared/i18n';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { ApiError } from '@/shared/api/client';
import { AdminApiState, adminButtonClass, adminSecondaryClass } from './AdminApiState';
import type { useAdminProductImport } from '../hooks/useAdminProductImport';

export function AdminProductImport(model: ReturnType<typeof useAdminProductImport>) {
  const { t, language } = useLocale('admin');
  return <Dialog open={model.open} onOpenChange={open => !model.pending && model.setOpen(open)}>
    <DialogContent showCloseButton={!model.pending} className="max-h-[90dvh] overflow-y-auto bg-lunara-admin-panel font-body text-lunara-ink sm:max-w-2xl">
      <DialogTitle className="!font-body !text-[15px] !font-normal !leading-6">{t('Upload product file')}</DialogTitle>
      <DialogDescription className="text-lunara-body">{t('Import new products from Excel. Images can be added afterward.')}</DialogDescription>
      <p className="text-sm leading-6 text-lunara-body">{t('Use the Products sheet. One row per size or SKU; repeat product information for the same slug. Up to 50 products, 250 SKUs and 1 MB per file.')}</p>
      <label className={`${adminSecondaryClass} relative cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--lunara-focus-ring)] ${model.pending ? 'pointer-events-none opacity-50' : ''}`}>
        <FileUp size={16} aria-hidden="true" />{t('Choose Excel file')}
        <input data-testid="product-import-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={model.pending} className="sr-only" onChange={event => {
          const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void model.choose(file);
        }} />
      </label>
      {model.file && <p className="break-all text-sm text-lunara-body">{model.file.file_name}</p>}
      {model.pending && <p role="status" className="text-sm">{t(model.preview ? 'Importing products…' : 'Checking Excel file…')}</p>}
      {model.error instanceof ApiError && model.error.code === 'INVALID_WORKBOOK'
        ? <p role="alert" className="text-sm">{t('Choose an .xlsx file up to 1 MB.')}</p> : <AdminApiState error={model.error} />}
      {model.issues.length > 0 && <ul data-testid="product-import-errors" className="max-h-52 space-y-2 overflow-auto text-sm text-lunara-body">{model.issues.map((issue, index) => <li key={index}>
        {issue.row ? t('Row {{row}}', { row: issue.row }) : t('Excel file')} · {issue.path}: {issue.message}
      </li>)}</ul>}
      {model.uncertain && <p role="alert" className="text-sm leading-6">{t('Import result uncertain. Close this dialog and refresh inventory to check the listed slugs before trying again.')}</p>}
      {model.preview && <div className="space-y-3">
        <p role="status" data-testid="product-import-summary" className="text-sm font-medium">{t(model.complete ? 'Imported {{products}} products and {{variants}} SKUs.' : 'Ready to import {{products}} products and {{variants}} SKUs.', { products: model.preview.product_count, variants: model.preview.variant_count })}</p>
        <ul className="max-h-52 divide-y divide-lunara-border overflow-auto text-sm">{model.preview.products.map(product => <li key={product.slug} className="py-2">
          <span className="block">{getLocalizedName(product, language)}</span><span className="break-all text-xs text-lunara-body">{product.slug} · {t('{{count}} variants', { count: product.variant_count })}</span>
        </li>)}</ul>
        <p className="text-xs leading-6 text-lunara-body">{t('Existing slugs and SKUs are rejected. Any error cancels the entire import. No images are imported.')}</p>
      </div>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-lunara-border pt-4">
        <button type="button" disabled={model.pending} onClick={() => model.setOpen(false)} className={adminSecondaryClass}>{t(model.complete ? 'Close' : 'Cancel')}</button>
        {!model.complete && <button data-testid="product-import-confirm" type="button" disabled={model.pending || !model.preview || model.uncertain} onClick={() => void model.submit()} className={adminButtonClass}>{t(model.pending && model.preview ? 'Importing products…' : 'Import products')}</button>}
      </div>
    </DialogContent>
  </Dialog>;
}
