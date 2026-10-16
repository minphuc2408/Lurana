import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import { ORDER_STATUSES } from '../../../../shared/constants';
import { AdminApiState, adminSecondaryClass } from './AdminApiState';
import type { AdminApiDashboardModel } from '../hooks/useAdminApiDashboard';

export function AdminApiDashboardView(model: AdminApiDashboardModel) {
  const { t, language } = useLocale("admin");
  return <div data-testid="admin-dashboard" className="space-y-6 p-4 font-body text-lunara-ink sm:p-6">
    <button onClick={model.reload} disabled={model.loading} className={`${adminSecondaryClass} fixed right-6 bottom-6 z-30 shadow-lg`}>{t('Refresh')}</button>
    <AdminApiState loading={model.loading} error={model.error} onRetry={model.reload} />
    {!model.loading && model.error == null && model.summary && <>
      <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-2xl border border-lunara-border bg-white p-5"><h2 className="text-sm text-lunara-body">{t('Orders today Vietnam time')}</h2><p data-testid="today-orders" className="mt-2 font-display text-4xl">{model.summary.today_orders}</p></section><section className="rounded-2xl border border-lunara-border bg-white p-5"><h2 className="text-sm text-lunara-body">{t('Variants at or below stock threshold')}</h2><p data-testid="low-stock-count" className="mt-2 font-display text-4xl">{model.summary.low_stock_count}</p><Link to="/admin/stock" className="mt-2 inline-block text-sm text-lunara-rose-strong underline">{t('Manage Stock')}</Link></section></div>
      <section className="rounded-2xl border border-lunara-border bg-white p-5"><h2 className="mb-4 font-display text-2xl">{t('Orders by status in last {{count}} days', { count: model.summary.period_days })}</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">{ORDER_STATUSES.map(status => <div key={status} className="rounded-xl bg-lunara-blush p-4"><p className="text-sm">{t(`Status ${status}`)}</p><p data-status-count={status} className="mt-2 font-display text-3xl">{model.summary?.orders_by_status[status] ?? 0}</p></div>)}</div></section>
      <section className="overflow-hidden rounded-2xl border border-lunara-border bg-white"><div className="flex items-center justify-between gap-3 p-5"><h2 className="font-display text-2xl">{t('Latest ten orders')}</h2><Link to="/admin/orders" className="text-sm text-lunara-rose-strong underline">{t('View All')}</Link></div><AdminApiState empty={model.orders.length === 0} /><div className="overflow-x-auto">{model.orders.length > 0 && <table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-lunara-blush"><tr>{['Order ID', 'Customer', 'Status', 'Total', 'Placed at'].map(key => <th key={key} className="p-4 font-medium">{t(key)}</th>)}</tr></thead><tbody>{model.orders.map(order => <tr data-order-number={order.order_number} key={order.order_number} className="border-t border-lunara-border"><td className="p-4"><Link to={`/admin/orders?order=${encodeURIComponent(order.order_number)}`} className="font-medium text-lunara-rose-strong underline">{order.order_number}</Link></td><td className="p-4">{order.sender_name}</td><td className="p-4">{t(`Status ${order.status_code}`)}</td><td className="whitespace-nowrap p-4">{formatVND(order.grand_total, language)}</td><td className="p-4">{formatVietnamDate(order.placed_at, language)}</td></tr>)}</tbody></table>}</div></section>
    </>}
  </div>;
}
