import { Trash2 } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { ApiError } from '@/shared/api/client';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { AdminApiState, adminButtonClass, adminSecondaryClass } from './AdminApiState';
export function AdminDeleteDialog({ open, kind, name, pending, error, onClose, onConfirm }: {
  open: boolean; kind: 'variant' | 'zone'; name: string; pending: boolean; error: unknown; onClose: () => void; onConfirm: () => void;
}) {
  const { t } = useLocale('admin');
  return <Dialog open={open} onOpenChange={value => !value && !pending && onClose()}><DialogContent showCloseButton={!pending} className="bg-lunara-admin-panel font-body text-lunara-ink">
    <DialogTitle className="!font-body !text-base !font-normal">{t(kind === 'variant' ? 'Delete SKU' : 'Delete delivery zone')}</DialogTitle>
    <DialogDescription className="break-words text-lunara-body">{name}</DialogDescription>
    <p className="text-sm leading-6">{t(kind === 'variant' ? 'Delete this SKU permanently? Saved order details will be kept. The final size and SKUs in open orders cannot be deleted.' : 'Delete this delivery zone permanently? It will no longer be available at checkout. Existing orders keep their delivery details.')}</p>
    <AdminApiState error={error} />
    {kind === 'variant' && error instanceof ApiError && error.code === 'CONFLICT' && <p role="alert" className="text-sm">{t('The final size or a SKU used by an open order cannot be deleted. Disable it instead.')}</p>}
    <div className="flex justify-end gap-3"><button type="button" disabled={pending} onClick={onClose} className={adminSecondaryClass}>{t('Cancel')}</button><button type="button" data-testid="admin-delete-confirm" disabled={pending} onClick={onConfirm} className={adminButtonClass}><Trash2 size={15} aria-hidden="true" />{t(pending ? 'Deleting…' : 'Delete')}</button></div>
  </DialogContent></Dialog>;
}
