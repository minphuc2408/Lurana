import { ORDER_STATUSES } from '../../../../shared/constants';
import { OrderDetailView } from '@/features/orders';
import { useLocale } from '@/shared/i18n';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { AdminApiState, adminButtonClass, adminInputClass, adminSecondaryClass } from './AdminApiState';
import type { AdminApiOrdersModel } from '../hooks/useAdminApiOrders';

export function AdminApiOrdersView(model: AdminApiOrdersModel) {
  const { t, language } = useLocale("admin");
  return <div data-testid="admin-orders" className="space-y-6 p-4 font-body text-lunara-ink sm:p-6">
    <h1 className="font-display text-3xl">{t('Manage orders')}</h1>
    <form onSubmit={model.submitFilters} className="grid gap-3 rounded-2xl border border-lunara-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm">{t('Status')}<select name="status" className={`${adminInputClass} mt-1`} value={model.filters.status} onChange={event => model.setFilters({ ...model.filters, status: event.target.value })}><option value="">{t('All')}</option>{ORDER_STATUSES.map(status => <option key={status} value={status}>{t(`Status ${status}`)}</option>)}</select></label>
      <label className="text-sm">{t('Delivery date')}<input name="date" type="date" className={`${adminInputClass} mt-1`} value={model.filters.date} onChange={event => model.setFilters({ ...model.filters, date: event.target.value })} /></label>
      <label className="text-sm">{t('Search orders')}<input name="q" maxLength={100} className={`${adminInputClass} mt-1`} value={model.filters.q} onChange={event => model.setFilters({ ...model.filters, q: event.target.value })} /></label>
      <button type="submit" className={`${adminButtonClass} self-end`}>{t('Apply filters')}</button>
    </form>
    <AdminApiState loading={model.loading} error={model.error} onRetry={model.reload} empty={model.orders.length === 0} />
    {!model.loading && model.error == null && model.orders.length > 0 && <section className="overflow-x-auto rounded-2xl border border-lunara-border bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-lunara-blush"><tr>{['Order ID', 'Customer', 'Delivery date', 'Status', 'Total', 'Actions'].map(key => <th key={key} className="p-4 font-medium">{t(key)}</th>)}</tr></thead><tbody>{model.orders.map(order => <tr key={order.order_number} data-order-number={order.order_number} className="border-t border-lunara-border"><td className="p-4 font-medium">{order.order_number}</td><td className="p-4"><p>{order.sender_name}</p><p className="text-lunara-body">{order.sender_phone}</p></td><td className="p-4">{formatVietnamDate(order.delivery_date, language)}<p className="text-lunara-body">{order.delivery_time_slot}</p></td><td className="p-4">{t(`Status ${order.status_code}`)}</td><td className="p-4 whitespace-nowrap">{formatVND(order.grand_total, language)}</td><td className="p-4"><button data-testid={`order-open-${order.order_number}`} disabled={model.pending} onClick={() => model.openOrder(order.order_number)} className={adminSecondaryClass}>{t('View order')}</button></td></tr>)}</tbody></table></section>}
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{t('Order results', { count: model.total })}</span><div className="flex gap-2"><button disabled={model.offset === 0 || model.loading} onClick={model.previous} className={adminSecondaryClass}>{t('Previous')}</button><button disabled={model.offset + 20 >= model.total || model.loading} onClick={model.next} className={adminSecondaryClass}>{t('Next')}</button></div></div>
    {model.selectedNumber && <section className="rounded-2xl border border-lunara-border bg-white p-4 sm:p-6">
      <div className="mb-4 flex justify-between gap-4"><h2 className="font-display text-2xl">{t('Order details')}</h2><button disabled={model.pending} onClick={model.closeOrder} className={adminSecondaryClass}>{t('Close details')}</button></div>
      <AdminApiState loading={model.detailLoading} error={model.detailError} onRetry={model.retryDetail} />
      {model.selected && <div data-testid="admin-order-detail" data-status={model.selected.status_code}>
        <OrderDetailView order={model.selected} />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div><label htmlFor="admin-note" className="mb-2 block text-sm">{t('Internal note')}</label><textarea id="admin-note" name="admin_note" disabled={model.pending} maxLength={500} rows={3} className={adminInputClass} value={model.adminNote} onChange={event => model.setAdminNote(event.target.value)} /><button disabled={model.pending} onClick={() => void model.saveNote()} className={`${adminSecondaryClass} mt-3`}>{t('Save note')}</button>{model.saved && <p role="status" className="mt-2 text-sm">{t('Saved')}</p>}</div>
          <div><label htmlFor="transition-note" className="mb-2 block text-sm">{t('Status change note')}</label><textarea id="transition-note" name="transition_note" disabled={model.pending} maxLength={500} rows={3} className={adminInputClass} value={model.transitionNote} onChange={event => model.setTransitionNote(event.target.value)} /><div className="mt-3 flex flex-wrap gap-2">{model.transitions.map(status => <button data-testid={`order-status-${status}`} key={status} disabled={model.pending} onClick={() => model.requestTransition(status)} className={status === 'CANCELLED' ? adminSecondaryClass : adminButtonClass}>{t(`Action ${status}`)}</button>)}{model.transitions.length === 0 && <p className="text-sm text-lunara-body">{t('Order completed')}</p>}</div></div>
        </div>
        <AdminApiState error={model.actionError} />
      </div>}
    </section>}
    <Dialog open={model.confirmCancel} onOpenChange={open => !model.pending && model.setConfirmCancel(open)}><DialogContent data-testid="cancel-order-dialog" className="rounded-3xl border-lunara-border bg-white font-body text-lunara-ink"><DialogTitle className="font-display text-2xl">{t('Cancel this order?')}</DialogTitle><DialogDescription className="text-lunara-body">{t('Cancellation returns reserved stock. This action cannot be undone.')}</DialogDescription><div className="flex flex-wrap gap-3"><button disabled={model.pending} onClick={() => model.setConfirmCancel(false)} className={adminSecondaryClass}>{t('Keep order')}</button><button data-testid="confirm-cancel-order" disabled={model.pending} onClick={model.confirmCancellation} className={adminButtonClass}>{t('Confirm cancellation')}</button></div></DialogContent></Dialog>
  </div>;
}
