import type { ReactNode } from 'react';
import { CalendarDays, CreditCard, MapPin, Package, UserRound } from 'lucide-react';
import { getLocalizedName, useLocale } from '@/shared/i18n';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { AdminPagination } from './AdminPagination';
import { useAdminPagination, type OrderSection } from '../hooks/useAdminPresentation';
import type { AdminOrderDetail } from '../admin-api.types';

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="admin-detail-label">{label}</dt><dd className="admin-detail-value">{children || '—'}</dd></div>;
}
export function AdminOrderData({ order, section }: { order: AdminOrderDetail; section: OrderSection }) {
  const { t, language } = useLocale('orders');
  const admin = useLocale('admin');
  const items = useAdminPagination(order.items, 4, order.order_number);
  const history = useAdminPagination(order.timeline, 5, order.order_number);
  const date = (value: string) => formatVietnamDate(value, language, { compact: true });
  const money = (value: number) => formatVND(value, language);
  const method = order.delivery.method_code === 'STANDARD' ? 'Standard Delivery' : order.delivery.method_code === 'EXPRESS' ? 'Express Delivery' : 'Same-Day Delivery';
  return <div data-admin-order-data className="admin-order-data">
    {section === 'overview' && <div className="admin-records space-y-5 p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <section><h3 className="mb-4 flex items-center gap-2 text-sm font-medium"><UserRound size={15} aria-hidden="true" />{t('Sender')}</h3><dl className="grid grid-cols-2 gap-x-4 gap-y-3"><DetailField label={t('Sender')}>{order.sender.name}</DetailField><DetailField label={admin.t('Sender phone')}>{order.sender.phone}</DetailField><DetailField label={admin.t('Sender email')}>{order.sender.email}</DetailField><DetailField label={admin.t('Anonymous sender')}>{admin.t(order.sender.is_anonymous ? 'Yes' : 'No')}</DetailField></dl></section>
        <section><h3 className="mb-4 flex items-center gap-2 text-sm font-medium"><MapPin size={15} aria-hidden="true" />{t('Recipient')}</h3><dl className="grid grid-cols-2 gap-x-4 gap-y-3"><DetailField label={t('Recipient')}>{order.recipient.name}</DetailField><DetailField label={admin.t('Recipient phone')}>{order.recipient.phone}</DetailField><div className="col-span-2"><DetailField label={admin.t('Delivery address')}>{[order.recipient.address_line, order.recipient.ward_name, order.recipient.province_name].filter(Boolean).join(', ')}</DetailField></div></dl></section>
      </div>
      <div className="grid gap-5 rounded-xl bg-lunara-admin-soft p-4 sm:grid-cols-2">
        <section><h3 className="mb-3 flex items-center gap-2 text-sm font-medium"><CalendarDays size={15} aria-hidden="true" />{t('Delivery details')}</h3><dl className="grid grid-cols-2 gap-3"><DetailField label={admin.t('Delivery date')}>{date(order.delivery.date)}</DetailField><DetailField label={admin.t('Delivery time slot')}>{order.delivery.time_slot}</DetailField><div className="col-span-2 text-xs text-lunara-body">{t(method)}</div></dl></section>
        <section><h3 className="mb-3 flex items-center gap-2 text-sm font-medium"><CreditCard size={15} aria-hidden="true" />{admin.t('Payment method')}</h3><dl className="grid grid-cols-2 gap-3"><DetailField label={admin.t('Payment method')}>{t('Cash on delivery COD')}</DetailField><DetailField label={admin.t('Payment status')}><span data-payment-status>{t(order.payment_status)}</span></DetailField></dl></section>
      </div>
    </div>}
    {section === 'products' && <><div className="admin-records"><table aria-label={admin.t('Products')} className="admin-table min-w-[520px]"><thead><tr>{[admin.t('Product'), t('Size'), t('Quantity'), admin.t('Price VND'), t('Total')].map((label, index) => <th key={index} scope="col" className={index > 2 ? 'text-right' : ''}>{label}</th>)}</tr></thead><tbody>{items.items.map((item, index) => <tr key={`${item.sku}-${index}`}><td><div className="flex items-center gap-3">{item.image_url ? <ImageWithFallback src={item.image_url} alt={getLocalizedName(item, language)} width={36} height={40} className="h-10 w-9 shrink-0 rounded-md object-cover" /> : <span className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md bg-lunara-admin-soft"><Package size={16} aria-hidden="true" /></span>}<div><p className="max-w-48 whitespace-normal font-medium">{getLocalizedName(item, language) || '—'}</p><p className="mt-1 text-xs text-lunara-body">{item.sku || '—'}</p></div></div></td><td>{item.size}</td><td>{item.quantity}</td><td className="whitespace-nowrap text-right">{money(item.unit_price)}</td><td className="whitespace-nowrap text-right font-medium">{money(item.line_total)}</td></tr>)}</tbody></table></div><AdminPagination label={admin.t('Products')} {...items} setPageSize={undefined} /></>}
    {section === 'notes' && <div className="admin-records space-y-5 p-5"><section><h3 className="mb-3 text-sm font-medium">{t('Card and note')} · {t(order.card.type)}</h3><p className="admin-note-content">{order.card.message || '—'}</p></section><section><h3 className="mb-3 text-sm font-medium">{admin.t('Customer note')}</h3><p className="admin-note-content">{order.customer_note || '—'}</p></section></div>}
    {section === 'history' && <><ol aria-label={t('Order timeline')} className="admin-records divide-y divide-lunara-border">{history.items.map((event, index) => <li key={`${event.occurred_at}:${index}`} className="px-5 py-3"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-sm">{event.from_status ? `${t(event.from_status)} → ` : ''}{t(event.to_status)}</p><time className="text-xs text-lunara-body">{date(event.occurred_at)}</time></div><details className="mt-2 text-xs text-lunara-body"><summary className="cursor-pointer">{admin.t('Status change note')}{event.actor_label ? ` · ${event.actor_label}` : ''}</summary><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{event.from_status === null && event.to_status === 'PENDING' && event.note === 'Đặt hàng' ? t('Order placed') : event.note || '—'}</p></details></li>)}</ol><AdminPagination label={t('Order timeline')} {...history} setPageSize={undefined} /></>}
  </div>;
}
