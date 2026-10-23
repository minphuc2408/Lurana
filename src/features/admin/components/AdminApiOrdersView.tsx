import { useRef } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ORDER_STATUSES } from '../../../../shared/constants';
import { useLocale } from '@/shared/i18n';
import { AdminOrderDetailsDialog } from './AdminOrderDetailsDialog';
import { AdminOrdersTable } from './AdminOrdersTable';
import { AdminDatePicker } from './AdminDatePicker';
import { AdminPagination } from './AdminPagination';
import { AdminApiState, adminButtonClass, adminInputClass, adminSecondaryClass } from './AdminApiState';
import { useAdminToggle } from '../hooks/useAdminPresentation';
import type { AdminApiOrdersModel } from '../hooks/useAdminApiOrders';

export function AdminApiOrdersView(model: AdminApiOrdersModel & { embedded?: boolean }) {
  const { t } = useLocale('admin');
  const opener = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const advanced = useAdminToggle();
  const totalAcrossStatuses = Object.values(model.counts).reduce((sum, count) => sum + count, 0);
  return <div data-testid="admin-orders" className="admin-page admin-workspace">
    <section className="admin-panel admin-collection">
      <div className="admin-status-tabs" role="group" aria-label={t('Status')}>{[{ status: '', label: 'All', count: totalAcrossStatuses }, ...ORDER_STATUSES.map(status => ({ status, label: `Status ${status}`, count: model.counts[status] }))].map(tab => <button key={tab.status} data-order-status-tab={tab.status || 'ALL'} type="button" aria-pressed={model.status === tab.status} onClick={() => model.selectStatus(tab.status)} className="admin-filter-tab"><span>{t(tab.label)}</span><span className="admin-tab-count">{model.loading || model.error != null ? '—' : tab.count}</span></button>)}</div>
      <form onSubmit={model.submitFilters} className="admin-order-search flex items-center gap-3 px-4 py-3 sm:px-5"><label className="relative block min-w-0 flex-1"><span className="sr-only">{t('Order ID, name or phone')}</span><Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-lunara-body" aria-hidden="true" /><input ref={searchRef} name="q" placeholder={t('Order ID, name or phone')} minLength={2} maxLength={100} className={`${adminInputClass} !pl-10`} value={model.filters.q} onChange={event => model.setFilters({ ...model.filters, q: event.target.value })} /></label><button type="submit" className={adminSecondaryClass}>{t('Search')}</button><button type="button" aria-label={t('Filters')} aria-expanded={advanced.open} aria-controls="admin-order-filters" onClick={advanced.toggle} className={adminSecondaryClass}><SlidersHorizontal size={16} aria-hidden="true" /><span className="hidden sm:inline">{t('Filters')}</span></button></form>
      {advanced.open && <form id="admin-order-filters" onSubmit={event => { model.submitFilters(event); advanced.setOpen(false); }} className="admin-advanced-filters"><div className="grid grid-cols-2 gap-4 sm:grid-cols-3"><AdminDatePicker name="placed_from" label={t('Placed from')} value={model.filters.placed_from} required onChange={value => model.setFilters({ ...model.filters, placed_from: value })} /><AdminDatePicker name="placed_to" label={t('Placed to')} value={model.filters.placed_to} required onChange={value => model.setFilters({ ...model.filters, placed_to: value })} /><AdminDatePicker name="date" label={t('Delivery date')} value={model.filters.date} onChange={value => model.setFilters({ ...model.filters, date: value })} /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="max-w-[60ch] text-xs leading-relaxed text-lunara-body">{t('Search orders in selected dates. Default is the last 90 days; maximum 366 days.')}</p><div className="flex gap-2"><button type="button" onClick={() => { model.resetFilters(); advanced.setOpen(false); }} className={adminSecondaryClass}>{t('Reset filters')}</button><button type="submit" className={adminButtonClass}>{t('Apply filters')}</button></div></div></form>}
      <div className="admin-records" aria-busy={model.loading} data-admin-records><AdminApiState loading={model.loading} error={model.error} onRetry={model.reload} empty={model.orders.length === 0} />
        {!model.loading && model.error == null && model.orders.length > 0 && <AdminOrdersTable orders={model.orders} pending={model.pending} onOpen={(number, row) => { opener.current = row; model.openOrder(number); }} />}
      </div>
      <AdminPagination label={t('Orders')} total={model.total} page={model.page} pageSize={model.pageSize} setPage={model.setPage} setPageSize={model.setPageSize} maxOffset={10000} loading={model.loading} />
    </section>
    <AdminOrderDetailsDialog model={model} returnFocusRef={opener} fallbackFocusRef={searchRef} />
  </div>;
}
