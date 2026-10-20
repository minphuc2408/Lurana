import { AlertCircle, Search } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { ApiError, apiErrorKey } from '@/shared/api/client';
import { OrderLookupResult } from './OrderLookupResult';
import type { OrderLookupModel } from '../hooks/useOrderLookup';
import { TurnstileChallenge } from '@/shared/components/TurnstileChallenge';
import { useFieldFocus } from '@/shared/hooks/useFieldFocus';

export function OrderLookupView(model: OrderLookupModel) {
  const { t } = useLocale('orders');
  const formRef = useFieldFocus();
  const notFound = model.error instanceof ApiError && model.error.code === 'NOT_FOUND';
  return <main data-order-lookup-page className="w-full pb-10 font-body sm:pb-16 [--lunara-ink:var(--lunara-editorial-ink)] [--lunara-body:var(--lunara-editorial-body)] [--lunara-border:var(--lunara-editorial-border)] [--lunara-surface:var(--lunara-editorial-surface)]">
    <h1 className="sr-only">{t('Track flower delivery progress')}</h1>
    <div data-lookup-content className="w-full">
    <div data-lookup-form-panel className="mb-10 w-full bg-lunara-lookup-panel">
      <form ref={formRef} data-order-lookup onSubmit={event => { event.preventDefault(); model.search(); }} className="mx-auto grid max-w-[var(--lunara-content-max-width)] grid-cols-1 items-end gap-5 px-5 py-10 sm:grid-cols-12 sm:px-8 sm:py-12">
        <label className="block min-w-0 text-sm font-medium text-lunara-ink sm:col-span-5">{t('Order number')}<input name="orderNumber" required maxLength={100} autoComplete="off" placeholder="LN-…" value={model.orderNumber} onChange={event => model.setOrderNumber(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-[2px] border-0 bg-lunara-cream px-4 py-3 text-base leading-6 font-normal text-lunara-ink placeholder:text-lunara-body placeholder:opacity-100" /></label>
        <label className="block min-w-0 text-sm font-medium text-lunara-ink sm:col-span-4">{t('Sender or recipient phone')}<input name="phone" type="tel" required maxLength={30} autoComplete="tel" placeholder="09…" value={model.phone} onChange={event => model.setPhone(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-[2px] border-0 bg-lunara-cream px-4 py-3 text-base leading-6 font-normal text-lunara-ink placeholder:text-lunara-body placeholder:opacity-100" /></label>
        <button data-lookup-submit type="submit" disabled={model.loading || !model.challenge.ready} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-lunara-lookup-button px-4 py-3 text-sm font-medium text-lunara-lookup-button-foreground transition-colors hover:bg-lunara-lookup-button-hover hover:text-lunara-lookup-button-foreground-hover disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-3"><Search size={16} aria-hidden="true" />{model.loading ? t('Looking up order') : t('Find order')}</button>
        <div className="min-w-0 sm:col-span-12"><TurnstileChallenge action="lookup" {...model.challenge} /></div>
      </form>
    </div>
    <div className="mx-auto max-w-[var(--lunara-content-max-width)] px-5 sm:px-8">
    {model.loading && <p role="status" className="mb-6 text-sm text-lunara-body">{t('Looking up order')}</p>}
    {Boolean(model.error) && <section role="alert" className={'mb-6 w-full space-y-3 rounded-[2px] border border-lunara-border bg-lunara-surface p-6 text-lunara-ink ' + (notFound ? 'sm:p-10 text-center' : '')}><AlertCircle size={32} strokeWidth={1.5} aria-hidden="true" className={notFound ? 'mx-auto text-lunara-rose-strong' : 'text-lunara-rose-strong'} /><h2 className="font-display text-xl">{notFound ? t('No matching order') : t(apiErrorKey(model.error))}</h2>{notFound && <p className="text-sm leading-relaxed text-lunara-body">{t('Order not found')}</p>}</section>}
    {model.order && <OrderLookupResult order={model.order} />}
    </div>
    </div>
  </main>;
}
