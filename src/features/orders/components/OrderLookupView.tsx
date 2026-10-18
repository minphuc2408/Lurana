import { AlertCircle, Search } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { ApiError, apiErrorKey } from '@/shared/api/client';
import { OrderLookupResult } from './OrderLookupResult';
import type { OrderLookupModel } from '../hooks/useOrderLookup';
import { TurnstileChallenge } from '@/shared/components/TurnstileChallenge';

export function OrderLookupView(model: OrderLookupModel) {
  const { t } = useLocale('orders');
  const notFound = model.error instanceof ApiError && model.error.code === 'NOT_FOUND';
  return <main data-order-lookup-page className="mx-auto w-full max-w-[1240px] px-5 py-6 font-body sm:px-8 sm:py-10 [--lunara-ink:var(--lunara-editorial-ink)] [--lunara-body:var(--lunara-editorial-body)] [--lunara-border:var(--lunara-editorial-border)] [--lunara-surface:var(--lunara-editorial-surface)]">
    <header data-lookup-header className="mb-8 border-b border-lunara-border pb-6 text-center"><h1 className="font-display text-3xl tracking-tight text-lunara-ink sm:text-4xl">{t('Track flower delivery progress')}</h1></header>
    <div data-lookup-content className="w-full">
    <div data-lookup-form-panel className="mb-10 w-full rounded-[2px] border border-lunara-border bg-lunara-surface p-5 sm:p-8">
      <form data-order-lookup onSubmit={event => { event.preventDefault(); model.search(); }} className="grid grid-cols-1 items-end gap-4 sm:grid-cols-12">
        <label className="block min-w-0 text-xs font-medium text-lunara-body sm:col-span-5">{t('Order number')}<input name="orderNumber" required maxLength={100} autoComplete="off" placeholder="LN-…" value={model.orderNumber} onChange={event => model.setOrderNumber(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-[2px] border border-lunara-border bg-lunara-cream p-2.5 text-xs font-normal text-lunara-ink" /></label>
        <label className="block min-w-0 text-xs font-medium text-lunara-body sm:col-span-4">{t('Sender or recipient phone')}<input name="phone" type="tel" required maxLength={30} autoComplete="tel" placeholder="09…" value={model.phone} onChange={event => model.setPhone(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-[2px] border border-lunara-border bg-lunara-cream p-2.5 text-xs font-normal text-lunara-ink" /></label>
        <button data-lookup-submit type="submit" disabled={model.loading || !model.challenge.ready} className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[2px] bg-lunara-rose-strong px-3 py-2.5 text-xs font-medium tracking-wider text-white uppercase transition-colors hover:bg-lunara-ink disabled:opacity-50 sm:col-span-3"><Search size={14} aria-hidden="true" />{model.loading ? t('Looking up order') : t('Find order')}</button>
        <div className="min-w-0 sm:col-span-12"><TurnstileChallenge action="lookup" {...model.challenge} /></div>
      </form>
    </div>
    {model.loading && <p role="status" className="mb-6 text-xs text-lunara-body">{t('Looking up order')}</p>}
    {Boolean(model.error) && <section role="alert" className={'mb-6 w-full space-y-3 rounded-[2px] border border-lunara-border bg-lunara-surface p-6 text-lunara-ink ' + (notFound ? 'sm:p-10 text-center' : '')}><AlertCircle size={32} strokeWidth={1.5} aria-hidden="true" className={notFound ? 'mx-auto text-lunara-rose-strong' : 'text-lunara-rose-strong'} /><h2 className="font-display text-xl">{notFound ? t('No matching order') : t(apiErrorKey(model.error))}</h2>{notFound && <p className="text-xs leading-relaxed text-lunara-body">{t('Order not found')}</p>}</section>}
    {model.order && <OrderLookupResult order={model.order} />}
    </div>
  </main>;
}
