import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import type { OrderDetail } from '../order-api.types';

export function OrderDetailView({ order }: { order: OrderDetail }) {
  const { t, language } = useLocale("orders");
  const method = order.delivery.method_code === 'STANDARD' ? 'Standard Delivery' : order.delivery.method_code === 'EXPRESS' ? 'Express Delivery' : 'Same-Day Delivery';
  return <article data-order-detail className="space-y-6 text-lunara-body">
    <section className="rounded-2xl border border-lunara-border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 data-detail-order-number className="break-all font-display text-3xl text-lunara-ink">{order.order_number}</h2><span data-order-status className="rounded-full bg-lunara-blush px-4 py-2 text-sm font-medium text-lunara-ink">{t(order.status_code)}</span></div>
      <p className="mt-3 text-sm">{t('Placed at')}: {formatVietnamDate(order.placed_at, language)}</p>
      <p className="mt-3">{t('Cash on delivery COD')} · <span data-payment-status>{t(order.payment_status)}</span></p>
      <ul className="mt-6 divide-y divide-lunara-border">{order.items.map(item => <li key={item.sku} className="flex items-start gap-4 py-4">{item.image_url && <ImageWithFallback src={item.image_url} alt={getLocalizedName(item, language)} width={72} height={72} className="h-18 w-18 rounded-xl object-cover" />}<div className="min-w-0 flex-1"><h3 className="font-medium text-lunara-ink">{getLocalizedName(item, language)}</h3><p className="mt-1 text-sm">{t('Size')}: {item.size} · {t('Quantity')}: {item.quantity}</p><p className="mt-1 text-sm">{formatVND(item.unit_price, language)}</p></div><p className="text-right text-lunara-ink">{formatVND(item.line_total, language)}</p></li>)}</ul>
      <dl className="mt-5 space-y-3 border-t border-lunara-border pt-5">{[['Subtotal', order.subtotal], ['Discount', order.discount_total], ['Delivery', order.delivery_fee], ['Total', order.grand_total]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4"><dt>{t(String(label))}</dt><dd className="font-medium text-lunara-ink">{formatVND(Number(value), language)}</dd></div>)}</dl>
    </section>
    <section className="grid gap-6 rounded-2xl border border-lunara-border bg-white p-6 sm:grid-cols-2">
      <div><h3 className="font-display text-2xl text-lunara-ink">{t('Sender')}</h3><p className="mt-3">{order.sender.name}</p><p>{order.sender.phone}</p>{order.sender.email && <p className="break-all">{order.sender.email}</p>}{order.sender.is_anonymous && <p className="mt-2 text-sm">{t('Anonymous sender')}</p>}</div>
      <div><h3 className="font-display text-2xl text-lunara-ink">{t('Recipient')}</h3><p className="mt-3">{order.recipient.name}</p><p>{order.recipient.phone}</p><p>{order.recipient.address_line}, {order.recipient.ward_name}, {order.recipient.province_name}</p></div>
      <div><h3 className="font-display text-2xl text-lunara-ink">{t('Delivery details')}</h3><p className="mt-3">{formatVietnamDate(order.delivery.date, language)} · {order.delivery.time_slot}</p><p>{t(method)}</p><p className="mt-2 text-sm">{t('Vietnam delivery time notice')}</p></div>
      <div><h3 className="font-display text-2xl text-lunara-ink">{t('Card and note')}</h3><p className="mt-3">{t(order.card.type)}</p>{order.card.message && <p className="whitespace-pre-wrap">{order.card.message}</p>}{order.customer_note && <p className="mt-3 whitespace-pre-wrap">{order.customer_note}</p>}</div>
    </section>
    <section className="rounded-2xl border border-lunara-border bg-white p-6"><h3 className="mb-5 font-display text-2xl text-lunara-ink">{t('Order timeline')}</h3><ol data-order-timeline className="space-y-5 border-l-2 border-lunara-border pl-5">{order.timeline.map((event, index) => <li key={`${event.occurred_at}:${index}`}><p className="font-medium text-lunara-ink">{t(event.to_status)}</p><p className="mt-1 text-sm">{formatVietnamDate(event.occurred_at, language)}</p>{event.note && <p className="mt-1 whitespace-pre-wrap text-sm">{event.from_status === null && event.to_status === 'PENDING' && event.note === 'Đặt hàng' ? t('Order placed') : event.note}</p>}</li>)}</ol></section>
  </article>;
}
