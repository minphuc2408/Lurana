import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { apiErrorKey } from '@/shared/api/client';
import type { QuoteCartModel } from '../hooks/useQuoteCart';
export function CartSummary(model: QuoteCartModel) {
  const { t, language } = useLocale("cart");
  return <section className="h-fit rounded-2xl border border-lunara-border bg-white p-6 lg:sticky lg:top-24" aria-label={t('Order Summary')}>
    <h2 className="mb-5 font-display text-2xl text-lunara-ink">{t('Order Summary')}</h2>
    {model.quoteLoading && <p role="status">{t('Updating quote')}</p>}
    {Boolean(model.quoteError) && <div role="alert" className="mb-4 text-lunara-ink">{t(apiErrorKey(model.quoteError))}<button onClick={model.retry} className="mt-3 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div>}
    {!model.quote && !model.quoteError && !model.quoteLoading && <p role="status">{t('Select delivery for quote')}</p>}
    {model.quote?.issues.map(issue => <p key={issue.variant_id} role="alert" className="mb-3 text-lunara-ink">{t(issue.code === 'OUT_OF_STOCK' ? 'Stock issue {{name}} {{available}}' : 'Unavailable item {{name}}', { name: getLocalizedName(model.items.find(item => item.variantId === issue.variant_id) || {}, language) || '#' + issue.variant_id, available: issue.available })}</p>)}
    <dl className="space-y-3 border-y border-lunara-border py-5">
      {[['Subtotal', model.quote?.subtotal], ['Delivery', model.quote?.delivery_fee], ['Total', model.quote?.grand_total]].map(([label, amount]) => <div key={String(label)} className="flex justify-between gap-4"><dt>{t(String(label))}</dt><dd data-quote-amount={String(label)} className="font-medium text-lunara-rose-strong">{typeof amount === 'number' ? formatVND(amount, language) : '—'}</dd></div>)}
    </dl>
    <p className="mt-5 text-sm leading-6 text-lunara-body">{t('Quote only notice')}</p>
  </section>;
}
