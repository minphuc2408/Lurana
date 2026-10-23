import { AdminPagination } from './AdminPagination';
import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, Package, RefreshCw, ShoppingBag } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { ORDER_STATUSES } from '../../../../shared/constants';
import { AdminOrdersPopup } from './AdminOrdersPopup';
import { AdminOrdersTable } from './AdminOrdersTable';
import { AdminApiState, AdminStatusBadge, adminSecondaryClass } from './AdminApiState';
import type { AdminApiDashboardModel } from '../hooks/useAdminApiDashboard';

export function AdminApiDashboardView(model: AdminApiDashboardModel) {
  const { t } = useLocale('admin');
  const { ordersPopup: popup, setOrdersPopup: setPopup, summary } = model;
  const opener = useRef<HTMLElement | null>(null);
  const total = summary ? Object.values(summary.orders_by_status).reduce((sum, value) => sum + value, 0) : 0;
  const inProgress = summary ? ORDER_STATUSES.filter(status => status !== 'DELIVERED' && status !== 'CANCELLED').reduce((sum, status) => sum + (summary.orders_by_status[status] ?? 0), 0) : 0;
  return <div data-testid="admin-dashboard" className="admin-page admin-workspace admin-dashboard-workspace">
    <AdminApiState loading={model.loading} error={model.error} onRetry={model.reload} />
    {model.error == null && summary && <>
      <section data-admin-summary aria-label={t('Dashboard summary')} className="admin-panel grid divide-y divide-lunara-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-6 lg:p-7"><div className="flex items-center justify-between gap-3"><h3 className="text-sm text-lunara-body">{t('Today’s orders')}</h3><ShoppingBag size={19} strokeWidth={1.5} className="text-lunara-body" aria-hidden="true" /></div><p data-testid="today-orders" className="mt-5 text-[42px] font-medium leading-none tracking-[-0.03em]">{summary.today_orders}</p><p className="mt-3 text-xs text-lunara-body">{t('Vietnam time · resets at midnight')}</p></div>
        <div className="p-6 lg:p-7"><div className="flex items-center justify-between gap-3"><h3 className="text-sm text-lunara-body">{t('Orders in progress')}</h3><ArrowUpRight size={19} strokeWidth={1.5} className="text-lunara-body" aria-hidden="true" /></div><p className="mt-5 text-[42px] font-medium leading-none tracking-[-0.03em]">{inProgress}</p><p className="mt-3 text-xs text-lunara-body">{t('Over the last {{count}} days', { count: summary.period_days })}</p></div>
        <Link to="/admin/stock" className="group p-6 no-underline transition-colors hover:bg-lunara-admin-active lg:p-7"><div className="flex items-center justify-between gap-3"><h3 className="text-sm text-lunara-body">{t('Stock needs attention')}</h3><Package size={19} strokeWidth={1.5} className="text-lunara-body" aria-hidden="true" /></div><div className="mt-5 flex items-end justify-between"><p data-testid="low-stock-count" className="text-[42px] font-medium leading-none tracking-[-0.03em]">{summary.low_stock_count}</p><ArrowRight size={20} className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></div><p className="mt-3 text-xs text-lunara-body">{t('Variants at or below stock threshold')}</p></Link>
      </section>
      <section data-admin-activity className="admin-panel shrink-0">
        <div className="admin-panel-heading"><h3 className="text-base font-medium">{t('Order activity')}</h3><button onClick={model.reload} disabled={model.loading} className={`${adminSecondaryClass} ml-auto`}><RefreshCw size={14} aria-hidden="true" />{t('Refresh')}</button><span className="text-xs text-lunara-body">{t('Orders by status in last {{count}} days', { count: summary.period_days })}</span></div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 px-6 pb-7 sm:grid-cols-3 xl:grid-cols-6">{ORDER_STATUSES.map(status => {
          const count = summary.orders_by_status[status] ?? 0;
          return <div key={status} className="admin-activity-status"><AdminStatusBadge status={status} /><p data-status-count={status} className="mb-4 mt-3 text-2xl font-medium">{count}</p><progress className="admin-status-progress" value={count} max={total || 1} aria-label={t(`Status ${status}`)} /></div>;
        })}</div>
      </section>
      <section className="admin-panel admin-collection">
        <div className="admin-panel-heading"><div className="flex items-center gap-2"><h3 className="text-base font-medium">{t('Recent Orders')}</h3><button type="button" aria-label={t('Refresh')} onClick={model.reload} disabled={model.loading} className="admin-page-button sm:hidden"><RefreshCw size={15} aria-hidden="true" /></button></div><button aria-haspopup="dialog" onClick={event => { opener.current = event.currentTarget; setPopup({}); }} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">{t('View All')}<ArrowRight size={16} aria-hidden="true" /></button></div>
        <div data-admin-records className="admin-records"><AdminApiState empty={model.orders.length === 0} />
        {model.orders.length > 0 && <AdminOrdersTable orders={model.orders} onOpen={(number, row) => { opener.current = row; setPopup({ number }); }} />}
        </div><AdminPagination label={t('Recent Orders')} total={model.total} page={model.page} pageSize={model.pageSize} setPage={model.setPage} maxOffset={10000} loading={model.loading} />
      </section>
    </>}
    {popup && <AdminOrdersPopup key={popup.number ?? 'list'} initialOrder={popup.number} returnFocusRef={opener} onClose={() => { setPopup(null); model.reload(); }} />}
  </div>;
}
