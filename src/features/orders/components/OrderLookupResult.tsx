import { Link } from 'react-router';
import { BadgeCheck, CheckCircle2, CircleX, Clock, Flower2, Heart, Sprout, Truck } from 'lucide-react';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import { orderProgress } from '../order-progress';
import type { OrderDetail } from '../order-api.types';

const milestoneIcons = { PENDING: Clock, CONFIRMED: BadgeCheck, PREPARING: Flower2, IN_TRANSIT: Truck, DELIVERED: CheckCircle2 };
const progressIcons = { ...milestoneIcons, CONFIRMED: Sprout, PREPARING: Heart };
const milestoneLabels = { PENDING: 'Request received', CONFIRMED: 'Conditioning flowers', PREPARING: 'Arranging flowers & writing your card', IN_TRANSIT: 'On the way', DELIVERED: 'Delivered to your hands' };
const milestoneDescriptions = { PENDING: 'Your flower request is received', CONFIRMED: 'Selecting the freshest buds', PREPARING: 'Our florists carefully craft every stem', IN_TRANSIT: 'Delivered gently to protect every petal', DELIVERED: 'Flower delivery completed' };
const statusIcons = { ...milestoneIcons, CANCELLED: CircleX };
const hotline = '0987656789';
export function OrderLookupResult({ order }: { order: OrderDetail }) {
  const { t, language } = useLocale('orders');
  const cancelled = order.status_code === 'CANCELLED';
  const progress = orderProgress(order);
  const StatusIcon = statusIcons[order.status_code];
  const cancellation = cancelled ? [...order.timeline].reverse().find(event => event.to_status === 'CANCELLED') : undefined;
  const method = order.delivery.method_code === 'STANDARD' ? 'Standard Delivery' : order.delivery.method_code === 'EXPRESS' ? 'Express Delivery' : 'Same-Day Delivery';
  return <article data-order-detail data-lookup-result className="w-full min-w-0 space-y-8 rounded-[2px] border border-lunara-border bg-lunara-surface p-5 text-lunara-body sm:p-10">
    <header className="flex flex-col justify-between gap-3 border-b border-lunara-border pb-6 sm:flex-row sm:items-center">
      <div className="min-w-0"><span className="text-sm font-medium tracking-wider text-lunara-rose-strong uppercase">{t('Order number')}</span><h2 data-detail-order-number className="font-display text-2xl break-all text-lunara-ink sm:text-3xl">{order.order_number}</h2><p className="mt-0.5 text-sm">{t('Placed at')}: {formatVietnamDate(order.placed_at, language)}</p></div>
      <span data-order-status data-status-code={order.status_code} className="inline-flex items-center gap-2 self-start rounded-[2px] border border-lunara-rose-strong/40 bg-lunara-blush px-3.5 py-1.5 text-sm font-medium text-lunara-ink sm:self-center"><StatusIcon size={15} strokeWidth={1.8} aria-hidden="true" />{t(order.status_code)}</span>
    </header>
    {cancelled && <section data-order-cancellation className="flex items-start gap-3 rounded-[2px] border border-lunara-border bg-lunara-cream p-4 text-sm leading-relaxed"><CircleX size={20} className="shrink-0 text-lunara-rose-strong" aria-hidden="true" /><div><h3 className="text-sm font-medium text-lunara-ink">{t('CANCELLED')}</h3>{cancellation && <p className="mt-1">{formatVietnamDate(cancellation.occurred_at, language)}</p>}{cancellation?.note && <p className="mt-1 whitespace-pre-wrap">{cancellation.note}</p>}</div></section>}
    <section aria-labelledby="lookup-progress-title" className="py-3 md:py-5">
      <h3 id="lookup-progress-title" className="font-display text-xl text-lunara-ink uppercase sm:text-2xl">{t('Order progress')}</h3>
      <div aria-hidden="true" className="mt-4 mb-8 h-0.5 w-9 bg-lunara-rose md:mb-10" />
      <ol data-order-progress className="grid grid-cols-1 gap-7 md:grid-cols-5 md:gap-0">{progress.map((step, index) => {
        const Icon = progressIcons[step.code];
        return <li key={step.code} data-progress-code={step.code} data-reached={step.reached} aria-current={step.current ? 'step' : undefined} className="relative flex min-w-0 items-center gap-5 md:flex-col md:gap-0 md:text-center">
          {index < progress.length - 1 && <span aria-hidden="true" className="absolute top-20 bottom-[-28px] left-10 w-px bg-lunara-rose/60 md:top-12 md:bottom-auto md:left-[calc(50%+60px)] md:h-px md:w-[calc(100%-120px)]" />}
          <div className="relative mb-3 shrink-0 md:mb-8">
            <div className={'flex size-20 items-center justify-center rounded-full md:size-24 ' + (step.current ? 'bg-lunara-rose-strong text-white ring-8 ring-lunara-rose/15 outline-8 outline-lunara-rose/5' : 'bg-lunara-blush/70 text-lunara-rose-strong')}>
              <Icon className="size-9 md:size-11" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <span aria-hidden="true" className="absolute -bottom-3 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-lunara-rose-strong font-display text-sm text-white md:-bottom-5 md:size-7 md:text-base">{index + 1}</span>
          </div>
          <div className="min-w-0 md:px-1.5">
            <span className="block font-display text-lg leading-snug text-lunara-ink md:text-base">{t(milestoneLabels[step.code])}</span>
            <span className="mt-2 block text-sm leading-relaxed md:text-sm md:leading-relaxed">{t(milestoneDescriptions[step.code])}</span>
          </div>
        </li>;
      })}</ol>
    </section>
    <div className="grid grid-cols-1 gap-6 border-t border-lunara-border pt-6 text-sm md:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <section className="space-y-1.5 rounded-[2px] border border-lunara-border bg-lunara-cream p-4"><h3 className="text-sm font-semibold text-lunara-ink">{t('Recipient')}</h3><p className="text-sm font-medium break-words text-lunara-ink">{order.recipient.name}</p><p>{order.recipient.phone}</p><p className="break-words">{order.recipient.address_line}, {order.recipient.ward_name}, {order.recipient.province_name}</p></section>
        <section className="space-y-1.5 rounded-[2px] border border-lunara-border bg-lunara-cream p-4"><h3 className="font-semibold text-lunara-ink">{t('Delivery details')}</h3><p>{formatVietnamDate(order.delivery.date, language)}</p><p>{order.delivery.time_slot}</p><p>{t(method)}</p><p>{t('Cash on delivery COD')} · <span data-payment-status>{t(order.payment_status)}</span></p><p className="text-sm leading-relaxed">{t('Vietnam delivery time notice')}</p></section>
      </div>
      <div className="min-w-0 space-y-4">
        <section className="space-y-2 rounded-[2px] border border-lunara-border bg-lunara-cream p-4"><h3 className="text-sm font-semibold text-lunara-rose-strong">{t('Card and note')}</h3><p>{t(order.card.type)}</p>{order.card.type !== 'NONE' && order.card.message && <p className="font-display text-sm leading-relaxed break-words whitespace-pre-wrap text-lunara-ink italic">“{order.card.message}”</p>}{order.customer_note && <p className="border-t border-lunara-border pt-2 break-words whitespace-pre-wrap">{order.customer_note}</p>}</section>
        <section className="space-y-2.5 rounded-[2px] border border-lunara-border bg-lunara-cream p-4"><h3 className="font-semibold text-lunara-ink">{t('Flowers in this order')}</h3><ul className="space-y-3">{order.items.map((item, index) => <li key={item.sku + ':' + index} className="flex flex-wrap justify-between gap-2 text-lunara-ink"><span className="min-w-0 flex-1 break-words">{getLocalizedName(item, language)} ({t('Size')} {item.size}) × {item.quantity}</span><span className="font-medium">{formatVND(item.line_total, language)}</span></li>)}</ul>
          <dl className="space-y-2 border-t border-lunara-border pt-2">{[['Subtotal', order.subtotal], ['Discount', order.discount_total], ['Delivery', order.delivery_fee], ['Total', order.grand_total]].map(([label, amount]) => <div key={String(label)} className={'flex justify-between gap-3 ' + (label === 'Total' ? 'border-t border-lunara-border pt-2 text-sm font-semibold text-lunara-ink' : '')}><dt>{t(String(label))}</dt><dd>{formatVND(Number(amount), language)}</dd></div>)}</dl>
        </section>
      </div>
    </div>
    <details className="rounded-[2px] border border-lunara-border bg-lunara-cream p-4 text-sm"><summary className="font-semibold text-lunara-ink">{t('Order timeline')}</summary><ol data-order-timeline className="mt-4 space-y-4 border-l border-lunara-border pl-4">{order.timeline.map((event, index) => <li key={event.occurred_at + ':' + index}><p className="font-medium text-lunara-ink">{t(event.to_status)}</p><p className="mt-1 text-sm">{formatVietnamDate(event.occurred_at, language)}</p>{event.note && <p className="mt-1 break-words whitespace-pre-wrap">{event.from_status === null && event.to_status === 'PENDING' && event.note === 'Đặt hàng' ? t('Order placed') : event.note}</p>}</li>)}</ol></details>
    <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm"><p className="leading-relaxed">{t('Delivery changes hotline')} <a href={'tel:' + hotline} className="whitespace-nowrap text-lunara-rose-strong underline underline-offset-4">{hotline}</a></p><Link to="/shop" className="text-lunara-rose-strong underline hover:text-lunara-ink">{t('Order more flowers')}</Link></footer>
  </article>;
}
