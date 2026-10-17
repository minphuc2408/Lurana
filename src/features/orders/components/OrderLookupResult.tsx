import { Link } from 'react-router';
import { BadgeCheck, CheckCircle2, CircleX, Clock, Flower2, Truck } from 'lucide-react';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import { orderProgress } from '../order-progress';
import type { OrderDetail } from '../order-api.types';

const milestoneIcons = { PENDING: Clock, CONFIRMED: BadgeCheck, PREPARING: Flower2, IN_TRANSIT: Truck, DELIVERED: CheckCircle2 };
const milestoneDescriptions = { PENDING: 'Order request received', CONFIRMED: 'Order details confirmed', PREPARING: 'Preparing flowers and the selected card', IN_TRANSIT: 'Flowers are on their way', DELIVERED: 'Flower delivery completed' };
const statusIcons = { ...milestoneIcons, CANCELLED: CircleX };
const hotline = '0987656789';
export function OrderLookupResult({ order }: { order: OrderDetail }) {
  const { t, language } = useLocale('orders');
  const cancelled = order.status_code === 'CANCELLED';
  const progress = orderProgress(order);
  const StatusIcon = statusIcons[order.status_code];
  const cancellation = cancelled ? [...order.timeline].reverse().find(event => event.to_status === 'CANCELLED') : undefined;
  const method = order.delivery.method_code === 'STANDARD' ? 'Standard Delivery' : order.delivery.method_code === 'EXPRESS' ? 'Express Delivery' : 'Same-Day Delivery';
  return <article data-order-detail data-lookup-result className="max-w-4xl space-y-8 rounded-[2px] border border-lunara-border bg-lunara-surface p-6 text-lunara-body sm:p-10">
    <header className="flex flex-col justify-between gap-3 border-b border-lunara-border pb-6 sm:flex-row sm:items-center">
      <div className="min-w-0"><span className="text-[11px] font-medium tracking-wider text-lunara-rose-strong uppercase">{t('Order number')}</span><h2 data-detail-order-number className="font-display text-2xl break-all text-lunara-ink sm:text-3xl">{order.order_number}</h2><p className="mt-0.5 text-xs">{t('Placed at')}: {formatVietnamDate(order.placed_at, language)}</p></div>
      <span data-order-status data-status-code={order.status_code} className="inline-flex items-center gap-2 self-start rounded-[2px] border border-lunara-rose-strong/40 bg-lunara-blush px-3.5 py-1.5 text-xs font-medium text-lunara-ink sm:self-center"><StatusIcon size={15} strokeWidth={1.8} aria-hidden="true" />{t(order.status_code)}</span>
    </header>
    {cancelled && <section data-order-cancellation className="flex items-start gap-3 rounded-[2px] border border-lunara-border bg-lunara-cream p-4 text-xs leading-relaxed"><CircleX size={20} className="shrink-0 text-lunara-rose-strong" aria-hidden="true" /><div><h3 className="text-xs font-medium text-lunara-ink">{t('CANCELLED')}</h3>{cancellation && <p className="mt-1">{formatVietnamDate(cancellation.occurred_at, language)}</p>}{cancellation?.note && <p className="mt-1 whitespace-pre-wrap">{cancellation.note}</p>}</div></section>}
    <section aria-labelledby="lookup-progress-title" className="py-2">
      <h3 id="lookup-progress-title" className="mb-6 text-xs font-semibold tracking-wider text-lunara-ink uppercase">{t('Order progress')}</h3>
      <div className="relative"><div aria-hidden="true" className="absolute top-5 right-[10%] left-[10%] hidden h-0.5 bg-lunara-border md:block" />
        <ol data-order-progress className="relative grid grid-cols-1 gap-6 md:grid-cols-5">{progress.map(step => {
          const Icon = milestoneIcons[step.code];
          return <li key={step.code} data-progress-code={step.code} data-reached={step.reached} aria-current={step.current ? 'step' : undefined} className={'flex min-w-0 items-center gap-4 rounded-[2px] p-3 md:flex-col md:gap-2 md:p-0 md:text-center ' + (step.current ? 'border border-lunara-rose-strong bg-lunara-cream md:border-0 md:bg-transparent' : '')}>
            <div className={'relative flex size-10 shrink-0 items-center justify-center rounded-full border ' + (step.reached ? 'border-lunara-rose-strong bg-lunara-rose-strong text-white' : 'border-lunara-border bg-lunara-cream text-lunara-body')}><Icon size={16} strokeWidth={1.8} aria-hidden="true" /></div>
            <div><span className="block text-xs font-medium text-lunara-ink">{t(step.code)}</span><span className="block text-[11px] leading-snug">{t(milestoneDescriptions[step.code])}</span></div>
          </li>;
        })}</ol>
      </div>
    </section>
    <div className="grid grid-cols-1 gap-6 border-t border-lunara-border pt-6 text-xs md:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <section className="space-y-1.5 rounded-[2px] border border-lunara-border bg-lunara-cream p-4"><h3 className="text-xs font-semibold text-lunara-ink">{t('Recipient')}</h3><p className="text-sm font-medium break-words text-lunara-ink">{order.recipient.name}</p><p>{order.recipient.phone}</p><p className="break-words">{order.recipient.address_line}, {order.recipient.ward_name}, {order.recipient.province_name}</p></section>
        <section className="space-y-1.5 rounded-[2px] border border-lunara-border bg-lunara-cream p-4"><h3 className="font-semibold text-lunara-ink">{t('Delivery details')}</h3><p>{formatVietnamDate(order.delivery.date, language)}</p><p>{order.delivery.time_slot}</p><p>{t(method)}</p><p>{t('Cash on delivery COD')} · <span data-payment-status>{t(order.payment_status)}</span></p><p className="text-[11px] leading-relaxed">{t('Vietnam delivery time notice')}</p></section>
      </div>
      <div className="min-w-0 space-y-4">
        <section className="space-y-2 rounded-[2px] border border-lunara-border bg-lunara-cream p-4"><h3 className="text-xs font-semibold text-lunara-rose-strong">{t('Card and note')}</h3><p>{t(order.card.type)}</p>{order.card.type !== 'NONE' && order.card.message && <p className="font-display text-sm leading-relaxed break-words whitespace-pre-wrap text-lunara-ink italic">“{order.card.message}”</p>}{order.customer_note && <p className="border-t border-lunara-border pt-2 break-words whitespace-pre-wrap">{order.customer_note}</p>}</section>
        <section className="space-y-2.5 rounded-[2px] border border-lunara-border bg-lunara-cream p-4"><h3 className="font-semibold text-lunara-ink">{t('Flowers in this order')}</h3><ul className="space-y-3">{order.items.map((item, index) => <li key={item.sku + ':' + index} className="flex flex-wrap justify-between gap-2 text-lunara-ink"><span className="min-w-0 flex-1 break-words">{getLocalizedName(item, language)} ({t('Size')} {item.size}) × {item.quantity}</span><span className="font-medium">{formatVND(item.line_total, language)}</span></li>)}</ul>
          <dl className="space-y-2 border-t border-lunara-border pt-2">{[['Subtotal', order.subtotal], ['Discount', order.discount_total], ['Delivery', order.delivery_fee], ['Total', order.grand_total]].map(([label, amount]) => <div key={String(label)} className={'flex justify-between gap-3 ' + (label === 'Total' ? 'border-t border-lunara-border pt-2 text-sm font-semibold text-lunara-ink' : '')}><dt>{t(String(label))}</dt><dd>{formatVND(Number(amount), language)}</dd></div>)}</dl>
        </section>
      </div>
    </div>
    <details className="rounded-[2px] border border-lunara-border bg-lunara-cream p-4 text-xs"><summary className="font-semibold text-lunara-ink">{t('Order timeline')}</summary><ol data-order-timeline className="mt-4 space-y-4 border-l border-lunara-border pl-4">{order.timeline.map((event, index) => <li key={event.occurred_at + ':' + index}><p className="font-medium text-lunara-ink">{t(event.to_status)}</p><p className="mt-1 text-[11px]">{formatVietnamDate(event.occurred_at, language)}</p>{event.note && <p className="mt-1 break-words whitespace-pre-wrap">{event.from_status === null && event.to_status === 'PENDING' && event.note === 'Đặt hàng' ? t('Order placed') : event.note}</p>}</li>)}</ol></details>
    <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs"><p className="leading-relaxed">{t('Delivery changes hotline')} <a href={'tel:' + hotline} className="whitespace-nowrap text-lunara-rose-strong underline underline-offset-4">{hotline}</a></p><Link to="/shop" className="text-lunara-rose-strong underline hover:text-lunara-ink">{t('Order more flowers')}</Link></footer>
  </article>;
}
