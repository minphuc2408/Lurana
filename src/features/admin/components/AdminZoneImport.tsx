import { FileUp } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { ApiError } from '@/shared/api/client';
import { formatVND } from '@/shared/lib/format';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { AdminApiState, adminButtonClass, adminSecondaryClass } from './AdminApiState';
import type { AdminDeliveryZonesModel } from '../hooks/useAdminDeliveryZones';
export function AdminZoneImport(model: AdminDeliveryZonesModel['zoneImport']) {
  const { t, language } = useLocale('admin');
  return <Dialog open={model.open} onOpenChange={open => !model.pending && model.setOpen(open)}><DialogContent showCloseButton={!model.pending} className="max-h-[90dvh] overflow-y-auto bg-lunara-admin-panel font-body text-lunara-ink sm:max-w-2xl">
    <DialogTitle className="!font-body !text-[15px] !font-normal !leading-6">{t('Upload delivery zone file')}</DialogTitle>
    <DialogDescription className="text-lunara-body">{t('Import new delivery zones from Excel. Existing areas are not overwritten.')}</DialogDescription>
    <p className="text-sm leading-6 text-lunara-body">{t('Fill DeliveryZones using names from Areas. One zone per row, up to 50 rows and 1 MB. Fees are integer VND.')}</p>
    <label className={`${adminSecondaryClass} relative cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--lunara-focus-ring)] ${model.pending ? 'pointer-events-none opacity-50' : ''}`}><FileUp size={16} aria-hidden="true" />{t('Choose Excel file')}<input data-testid="zone-import-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={model.pending} className="sr-only" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void model.choose(file); }} /></label>
    {model.file && <p className="break-all text-sm text-lunara-body">{model.file.file_name}</p>}
    {model.pending && <p role="status" className="text-sm">{t(model.preview ? 'Importing delivery zones…' : 'Checking Excel file…')}</p>}
    {model.error instanceof ApiError && model.error.code === 'INVALID_WORKBOOK' ? <p role="alert" className="text-sm">{t('Choose an .xlsx file up to 1 MB.')}</p> : <AdminApiState error={model.error} />}
    {model.issues.length > 0 && <ul data-testid="zone-import-errors" className="max-h-52 space-y-2 overflow-auto text-sm text-lunara-body">{model.issues.map((issue, index) => <li key={index}>{issue.row ? t('Row {{row}}', { row: issue.row }) : t('Excel file')} · {issue.path}: {issue.message}</li>)}</ul>}
    {model.uncertain && <p role="alert" className="text-sm leading-6">{t('Import result uncertain. Close this dialog and refresh delivery zones before trying again.')}</p>}
    {model.preview && <div className="space-y-3"><p role="status" data-testid="zone-import-summary" className="text-sm font-medium">{t(model.complete ? 'Imported {{count}} delivery zones.' : 'Ready to import {{count}} delivery zones.', { count: model.preview.zone_count })}</p><ul className="max-h-52 divide-y divide-lunara-border overflow-auto text-sm">{model.preview.zones.map(zone => <li key={`${zone.province_name}-${zone.ward_name}`} className="py-2"><span className="block">{zone.ward_name}, {zone.province_name}</span><span className="text-xs text-lunara-body">{formatVND(zone.fee, language)} · {t(zone.is_active ? 'Active' : 'Inactive')}</span></li>)}</ul><p className="text-xs leading-6 text-lunara-body">{t('Existing or repeated areas are rejected. Any error cancels the entire import.')}</p></div>}
    <div className="flex flex-wrap justify-end gap-3 border-t border-lunara-border pt-4"><button type="button" disabled={model.pending} onClick={() => model.setOpen(false)} className={adminSecondaryClass}>{t(model.complete ? 'Close' : 'Cancel')}</button>{!model.complete && <button type="button" data-testid="zone-import-confirm" disabled={model.pending || !model.preview || model.uncertain} onClick={() => void model.submit()} className={adminButtonClass}>{t(model.pending && model.preview ? 'Importing delivery zones…' : 'Import delivery zones')}</button>}</div>
  </DialogContent></Dialog>;
}
