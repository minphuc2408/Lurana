import { useLocale } from '@/shared/i18n';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import type { AdminOrderRow } from '../admin-api.types';
import { ArrowUpRight } from 'lucide-react';
import { AdminStatusBadge } from './AdminApiState';

export function AdminOrdersTable({ orders, pending, onOpen }: {
  orders: AdminOrderRow[];
  pending?: boolean;
  onOpen: (number: string, opener: HTMLTableRowElement) => void;
}) {
  const { t, language } = useLocale('admin');
  return <div className="admin-orders-table-wrap">
    <table role="table" className="admin-table admin-orders-table whitespace-nowrap">
      <thead><tr>{['Order ID', 'Sender', 'Recipient', 'Delivery date', 'Status', 'Total', 'Placed at'].map(key => <th key={key} scope="col" className={key === 'Total' ? 'text-right' : ''}>{t(key)}</th>)}</tr></thead>
      <tbody>{orders.map(order => <tr key={order.order_number} data-admin-order-row data-order-number={order.order_number}
        tabIndex={pending ? -1 : 0} aria-haspopup="dialog" aria-disabled={pending || undefined} aria-label={t('Open order {{number}}', { number: order.order_number })}
        title={t('Double click to open order')}
        onDoubleClick={event => { if (!pending) onOpen(order.order_number, event.currentTarget); }}
        onClick={event => { if (!pending && event.detail === 0) onOpen(order.order_number, event.currentTarget); }}
        onKeyDown={event => { if (!pending && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen(order.order_number, event.currentTarget); } }}
        className="touch-manipulation border-b border-lunara-border">
        <td><button type="button" disabled={pending} aria-label={t('Open order {{number}}', { number: order.order_number })} onClick={event => { event.stopPropagation(); const row = event.currentTarget.closest('tr'); if (row) onOpen(order.order_number, row); }} className="admin-order-number">{order.order_number}<ArrowUpRight size={14} className="text-lunara-body" aria-hidden="true" /></button></td>
        <td data-label={t('Sender')}><span className="block max-w-40 truncate font-medium" title={order.sender_name}>{order.sender_name || '—'}</span><span className="mt-1.5 block text-xs text-lunara-body">{order.sender_phone || '—'}</span></td>
        <td data-label={t('Recipient')}><span className="block max-w-40 truncate font-medium" title={order.recipient_name}>{order.recipient_name || '—'}</span><span className="mt-1.5 block text-xs text-lunara-body">{order.recipient_phone || '—'}</span></td>
        <td data-label={t('Delivery date')}><span className="block">{formatVietnamDate(order.delivery_date, language, { compact: true })}</span><span className="mt-1.5 block text-xs text-lunara-body">{order.delivery_time_slot || '—'}</span></td>
        <td><AdminStatusBadge status={order.status_code} /></td>
        <td data-label={t('Total')} className="text-right font-medium">{formatVND(order.grand_total, language)}</td>
        <td data-label={t('Placed at')} className="text-xs text-lunara-body">{formatVietnamDate(order.placed_at, language, { compact: true })}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
