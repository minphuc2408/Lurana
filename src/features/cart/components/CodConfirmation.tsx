import { Link } from 'react-router';
import { CheckCircle } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { formatVND, formatVietnamDate } from '@/shared/lib/format';
import type { OrderSummary } from '@/features/orders';

export function CodConfirmation({ order }: { order: OrderSummary }) {
  const { t, language } = useLocale("cart");
  return <section data-order-confirmation className="mx-auto max-w-2xl rounded-2xl border border-lunara-border bg-white p-8 text-center">
    <CheckCircle className="mx-auto text-lunara-rose-strong" size={48} /><h2 className="mt-5 font-display text-3xl text-lunara-ink">{t('Order received')}</h2>
    <p className="mt-4 text-lunara-body">{t('Your order number')}</p><p data-order-number className="mt-2 break-all text-2xl font-semibold text-lunara-rose-strong">{order.order_number}</p><p className="mt-3 text-sm text-lunara-body">{formatVietnamDate(order.placed_at, language)}</p>
    <dl className="my-6 space-y-3 border-y border-lunara-border py-6">{[['Subtotal', order.subtotal], ['Delivery', order.delivery_fee], ['Total', order.grand_total]].map(([label, amount]) => <div key={String(label)} className="flex justify-between gap-4"><dt>{t(String(label))}</dt><dd>{formatVND(Number(amount), language)}</dd></div>)}</dl>
    <p className="mb-6 text-lunara-body">{t('Cash on delivery COD')}</p><div className="flex flex-wrap justify-center gap-4"><Link data-confirmation-track to={`/orders/track?order=${encodeURIComponent(order.order_number)}`} className="rounded-full bg-lunara-rose-strong px-6 py-3 text-white">{t('Track this order')}</Link><Link to="/shop" className="rounded-full border border-lunara-border px-6 py-3 text-lunara-body">{t('Continue Shopping')}</Link></div>
  </section>;
}
