import { Link } from 'react-router';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { apiErrorKey } from '@/shared/api/client';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import type { CodCheckoutModel } from '../hooks/useCodCheckout';

export function CartSummary(model: CodCheckoutModel) {
  const { t, language } = useLocale('cart');
  const subtotal = model.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return <section aria-label={t('Order Summary')} className="space-y-6">
    <div className="flex items-baseline justify-between gap-3 border-b border-lunara-border pb-3"><h2 className="font-display text-xl text-lunara-ink">{t('Your flower order')}</h2><Link to="/cart" className="text-xs text-lunara-rose-strong hover:text-lunara-ink">{t('Edit cart')}</Link></div>
    <ul className="max-h-[300px] space-y-4 divide-y divide-lunara-border overflow-y-auto pr-1">{model.items.map(item => <li key={item.id} className="flex min-w-0 items-center gap-3 pt-3 first:pt-0">
      <ImageWithFallback src={item.image} alt={getLocalizedName(item, language) || t('Unavailable')} className="h-16 w-14 shrink-0 rounded-[2px] bg-lunara-blush object-cover" />
      <div className="min-w-0 flex-1 text-xs"><h3 className="truncate font-display text-sm text-lunara-ink">{getLocalizedName(item, language) || t('Unavailable')}</h3><p>{t('Size:')} {item.sizeCode || t(item.size)} × {item.qty}</p></div><span className="max-w-[45%] text-right text-xs font-medium break-words text-lunara-ink">{formatVND(item.price * item.qty, language)}</span>
    </li>)}</ul>
    {model.quoteLoading && <p role="status" className="text-xs">{t('Updating quote')}</p>}
    {Boolean(model.quoteError) && <div role="alert" className="text-xs text-lunara-ink">{t(apiErrorKey(model.quoteError))}<button type="button" onClick={model.retry} className="ml-3 min-h-11 text-lunara-rose-strong underline">{t('Retry')}</button></div>}
    {model.quote?.issues.map(issue => <p key={issue.variant_id} role="alert" className="text-xs text-lunara-ink">{t(issue.code === 'OUT_OF_STOCK' ? 'Stock issue {{name}} {{available}}' : 'Unavailable item {{name}}', { name: getLocalizedName(model.items.find(item => item.variantId === issue.variant_id) || {}, language) || '#' + issue.variant_id, available: issue.available })}</p>)}
    <dl className="space-y-2.5 border-t border-lunara-border pt-4 text-xs">
      <div className="flex justify-between gap-4"><dt>{t('Flower subtotal')}</dt><dd data-quote-amount="Subtotal" className="font-medium text-lunara-ink">{formatVND(model.quote?.subtotal ?? subtotal, language)}</dd></div>
      {model.quote && <div data-checkout-delivery-fee className="flex justify-between gap-4"><dt>{t('Delivery')}</dt><dd data-quote-amount="Delivery">{formatVND(model.quote.delivery_fee, language)}</dd></div>}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-lunara-border pt-3"><dt className="text-sm font-semibold text-lunara-ink">{t(model.quote ? 'Total' : 'Provisional total')}</dt><dd data-quote-amount="Total" className="font-display text-2xl text-lunara-ink sm:text-3xl">{formatVND(model.quote?.grand_total ?? subtotal, language)}</dd></div>
    </dl>
    <p className="text-[11px] leading-relaxed">{t('Server confirms final total')}</p>
  </section>;
}
