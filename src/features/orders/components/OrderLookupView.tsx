import { useLocale } from '@/shared/i18n';
import { ApiError, apiErrorKey } from '@/shared/api/client';
import { OrderDetailView } from './OrderDetailView';
import type { OrderLookupModel } from '../hooks/useOrderLookup';
import { TurnstileChallenge } from '@/shared/components/TurnstileChallenge';

export function OrderLookupView(model: OrderLookupModel) {
  const { t } = useLocale("orders");
  return <div className="min-h-screen bg-lunara-cream px-6 py-12 font-body"><div className="mx-auto max-w-4xl"><h1 className="font-display text-4xl text-lunara-ink">{t('Track order')}</h1><p className="mt-3 text-lunara-body">{t('Order lookup instructions')}</p>
    <form data-order-lookup onSubmit={event => { event.preventDefault(); model.search(); }} className="my-8 grid items-end gap-5 rounded-2xl border border-lunara-border bg-white p-6 sm:grid-cols-2">
      <label className="text-sm text-lunara-body">{t('Order number')}<input name="orderNumber" required maxLength={100} value={model.orderNumber} onChange={event => model.setOrderNumber(event.target.value)} className="mt-2 w-full rounded-xl border border-lunara-border bg-lunara-surface px-4 py-3 text-lunara-ink" /></label>
      <label className="text-sm text-lunara-body">{t('Sender or recipient phone')}<input name="phone" type="tel" required maxLength={30} autoComplete="tel" value={model.phone} onChange={event => model.setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-lunara-border bg-lunara-surface px-4 py-3 text-lunara-ink" /></label>
      <div className="min-w-0 sm:col-span-2"><TurnstileChallenge action="lookup" {...model.challenge} /></div>
      <button data-lookup-submit type="submit" disabled={model.loading || !model.challenge.ready} className="rounded-full bg-lunara-rose-strong px-6 py-3 text-white disabled:opacity-50">{model.loading ? t('Looking up order') : t('Find order')}</button>
    </form>
    {model.loading && <p role="status" className="mb-6 text-lunara-body">{t('Looking up order')}</p>}
    {Boolean(model.error) && <div role="alert" className="mb-6 rounded-xl border border-lunara-border bg-lunara-blush p-5 text-lunara-ink">{model.error instanceof ApiError && model.error.code === 'NOT_FOUND' ? t('Order not found') : t(apiErrorKey(model.error))}</div>}
    {model.order && <OrderDetailView order={model.order} />}
  </div></div>;
}
