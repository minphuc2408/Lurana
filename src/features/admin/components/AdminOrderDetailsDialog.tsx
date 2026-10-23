import { useRef, type RefObject } from 'react';
import { AdminOrderData } from './AdminOrderData';
import { useLocale } from '@/shared/i18n';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { AdminApiState, AdminStatusBadge, adminButtonClass, adminInputClass, adminSecondaryClass, adminTabKeyDown } from './AdminApiState';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import { useAdminOrderWorkspace } from '../hooks/useAdminPresentation';
import type { AdminApiOrdersModel } from '../hooks/useAdminApiOrders';

export function AdminOrderDetailsDialog({ model, onClose, returnFocusRef, fallbackFocusRef }: {
  model: AdminApiOrdersModel;
  onClose?: () => void;
  returnFocusRef: RefObject<HTMLElement>;
  fallbackFocusRef?: RefObject<HTMLInputElement>;
}) {
  const { t, language } = useLocale('admin');
  const workspace = useAdminOrderWorkspace(model.selectedNumber);
  const cancelOpener = useRef<HTMLButtonElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const close = () => {
    if (model.pending) return;
    model.closeOrder();
    onClose?.();
  };
  return <>
    <Dialog open={Boolean(model.selectedNumber)} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent data-testid="admin-order-dialog" data-admin-workspace-dialog showCloseButton={!model.pending}
        onCloseAutoFocus={event => { event.preventDefault(); (returnFocusRef.current?.isConnected ? returnFocusRef.current : fallbackFocusRef?.current)?.focus(); }}
        className="border-lunara-border bg-lunara-admin-panel font-body text-lunara-ink">
        <div className="admin-dialog-heading"><DialogTitle ref={titleRef} tabIndex={-1}>{t('Order details')}</DialogTitle><DialogDescription className="sr-only">{model.selectedNumber}</DialogDescription><div className="flex flex-wrap items-center gap-3"><span data-detail-order-number className="text-sm font-medium">{model.selectedNumber}</span>{model.selected && <span data-order-status><AdminStatusBadge status={model.selected.status_code} /></span>}</div></div>
        <div className="admin-status-tabs" role="tablist" onKeyDown={adminTabKeyDown} aria-label={t('Order details')}>{[{ id: 'overview', label: 'Overview' }, { id: 'products', label: 'Products', count: model.selected?.items.length }, { id: 'notes', label: 'Notes' }, { id: 'history', label: 'History', count: model.selected?.timeline.length }, { id: 'actions', label: 'Actions' }].map(tab => <button key={tab.id} type="button" role="tab" data-order-actions-tab={tab.id === 'actions' || undefined} tabIndex={workspace.section === tab.id ? 0 : -1} id={`order-tab-${tab.id}`} aria-selected={workspace.section === tab.id} aria-controls={`order-panel-${tab.id}`} onClick={() => workspace.setSection(tab.id as typeof workspace.section)} className={`admin-filter-tab ${tab.id === 'actions' ? 'lg:hidden' : ''}`}>{t(tab.label)}{tab.count != null && <span className="admin-tab-count">{tab.count}</span>}</button>)}</div>
        <AdminApiState loading={model.detailLoading} error={model.detailError} onRetry={model.retryDetail} />
        {model.selected && <div data-testid="admin-order-detail" data-status={model.selected.status_code} className="admin-order-body">
          <div role="tabpanel" id={workspace.section === 'actions' ? undefined : `order-panel-${workspace.section}`} aria-labelledby={`order-tab-${workspace.section}`} className={`admin-order-main ${workspace.section === 'actions' ? 'hidden lg:flex' : ''}`}>
            <AdminOrderData order={model.selected} section={workspace.section === 'actions' ? 'overview' : workspace.section} />
            {workspace.section === 'notes' && <div className="border-t border-lunara-border p-5"><label htmlFor="admin-note" className="mb-2 block text-sm">{t('Internal note')}</label><textarea id="admin-note" name="admin_note" placeholder={t('Enter internal note')} disabled={model.pending} maxLength={500} rows={3} className={adminInputClass} value={model.adminNote} onChange={event => model.setAdminNote(event.target.value)} /><div className="mt-3 flex items-center gap-3"><button disabled={model.pending} onClick={() => void model.saveNote()} className={adminSecondaryClass}>{t('Save note')}</button>{model.saved && <p role="status" className="text-xs">{t('Saved')}</p>}</div></div>}
          </div>
          <aside data-order-action-pane id={workspace.section === 'actions' ? 'order-panel-actions' : undefined} aria-labelledby={workspace.section === 'actions' ? 'order-tab-actions' : undefined} role={workspace.section === 'actions' ? 'tabpanel' : undefined} className={`admin-order-actions ${workspace.section === 'actions' ? '' : 'hidden lg:flex'}`}>
            <dl className="space-y-3 text-xs text-lunara-body">{[[t('Subtotal'), model.selected.subtotal], [t('Discount'), model.selected.discount_total], [t('Delivery'), model.selected.delivery_fee]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="whitespace-nowrap">{formatVND(Number(value), language)}</dd></div>)}<div className="flex justify-between gap-3 border-t border-lunara-border pt-4 text-sm font-medium text-lunara-ink"><dt>{t('Total')}</dt><dd className="whitespace-nowrap">{formatVND(model.selected.grand_total, language)}</dd></div></dl>
            <div className="mt-5 flex flex-col gap-2">{model.transitions.map(status => <button data-testid={`order-status-${status}`} key={status} disabled={model.pending} onClick={event => { if (status === 'CANCELLED') cancelOpener.current = event.currentTarget; model.requestTransition(status); }} className={status === 'CANCELLED' ? adminSecondaryClass : adminButtonClass}>{t(`Action ${status}`)}</button>)}{model.transitions.length === 0 && <p className="py-2 text-xs text-lunara-body">{t('Order completed')}</p>}</div>
            <button type="button" aria-expanded={workspace.showStatusNote} disabled={model.pending} onClick={workspace.toggleStatusNote} className={`${adminSecondaryClass} mt-3`}>{t('Status change note')}</button>
            {workspace.showStatusNote && <label className="mt-3 block"><span className="sr-only">{t('Status change note')}</span><textarea id="transition-note" name="transition_note" placeholder={t('Enter status change note')} disabled={model.pending} maxLength={500} rows={2} className={adminInputClass} value={model.transitionNote} onChange={event => model.setTransitionNote(event.target.value)} /></label>}
            <AdminApiState error={model.confirmCancel ? null : model.actionError} />
          </aside>
        </div>}
        <div className="admin-dialog-footer"><span className="text-xs text-lunara-body">{model.selected ? formatVietnamDate(model.selected.placed_at, language, { compact: true }) : ''}</span><button disabled={model.pending} onClick={close} className={adminSecondaryClass}>{t('Close details')}</button></div>
      </DialogContent>
    </Dialog>
    <Dialog open={model.confirmCancel} onOpenChange={open => !model.pending && model.setConfirmCancel(open)}><DialogContent data-testid="cancel-order-dialog" onCloseAutoFocus={event => { event.preventDefault(); const trigger = cancelOpener.current; (trigger?.isConnected && !trigger.disabled ? trigger : titleRef.current)?.focus(); }} showCloseButton={!model.pending} className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-lunara-border bg-lunara-admin-panel font-body text-lunara-ink"><DialogTitle className="font-display text-xl">{t('Cancel this order?')}</DialogTitle><DialogDescription className="text-lunara-body">{t(model.selected?.status_code === 'IN_TRANSIT' ? 'Failed delivery keeps stock consumed unless you choose to restock.' : 'Cancellation returns reserved stock. This action cannot be undone.')}</DialogDescription>
      {model.selected?.status_code === 'IN_TRANSIT' && <div className="space-y-1">
        <label className="block text-sm">{t('Failed delivery reason required')}<textarea data-testid="failed-delivery-reason" placeholder={t('Enter failed delivery reason')} required maxLength={500} disabled={model.pending} className={`${adminInputClass} mt-1`} value={model.transitionNote} onChange={event => model.setTransitionNote(event.target.value)} /></label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={model.restock} disabled={model.pending} onChange={event => model.setRestock(event.target.checked)} />{t('Return reusable flowers to stock')}</label>
      </div>}
      <AdminApiState error={model.actionError} />
      <div className="flex flex-wrap gap-3"><button disabled={model.pending} onClick={() => model.setConfirmCancel(false)} className={adminSecondaryClass}>{t('Keep order')}</button><button data-testid="confirm-cancel-order" disabled={model.pending || (model.selected?.status_code === 'IN_TRANSIT' && !model.transitionNote.trim())} onClick={model.confirmCancellation} className={adminButtonClass}>{t('Confirm cancellation')}</button></div>
    </DialogContent></Dialog>
  </>;
}
