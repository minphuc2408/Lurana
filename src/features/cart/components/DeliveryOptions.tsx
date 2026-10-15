import { useLocale } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { apiErrorKey } from '@/shared/api/client';
import type { QuoteCartModel } from '../hooks/useQuoteCart';
export function DeliveryOptions(model: QuoteCartModel) {
  const { t, language } = useLocale("cart");
  const province = model.options?.provinces.find(item => item.province_name === model.province);
  return <section className="mt-8 rounded-2xl border border-lunara-border bg-white p-6">
    <h2 className="mb-5 font-display text-2xl text-lunara-ink">{t('Delivery Options')}</h2>
    {model.optionsError ? <div role="alert">{t(apiErrorKey(model.optionsError))}<button onClick={model.retry} className="ml-4 rounded-full bg-lunara-rose-strong px-4 py-2 text-white">{t('Retry')}</button></div> : !model.options ? <p role="status">{t('Loading delivery options')}</p> : <div className="space-y-5">
      <label className="block text-sm text-lunara-body">{t('Province')}<input aria-label={t('Province')} placeholder={t('Enter province or city')} value={model.province} onChange={event => model.setProvince(event.target.value)} className="mt-2 w-full rounded-xl border border-lunara-border bg-lunara-surface px-4 py-3 text-lunara-ink" /></label>
      <label className="block text-sm text-lunara-body">{t('Ward')}<input aria-label={t('Ward')} placeholder={t('Enter ward or commune')} value={model.ward} onChange={event => model.setWard(event.target.value)} className="mt-2 w-full rounded-xl border border-lunara-border bg-lunara-surface px-4 py-3 text-lunara-ink" /></label>
      {province && province.default_fee !== null && <p className="text-sm text-lunara-body">{t('Default delivery fee {{fee}}', { fee: formatVND(province.default_fee, language) })}</p>}
      <fieldset className="space-y-3"><legend className="mb-3 text-sm text-lunara-body">{t('Delivery method')}</legend>{model.options.methods.map(item => <label key={item.code} className="flex items-center justify-between gap-3 rounded-xl border border-lunara-border p-4 text-lunara-ink"><span className="flex items-center gap-3"><input type="radio" name="delivery-method" value={item.code} checked={model.method === item.code} onChange={() => model.setMethod(item.code)} className="accent-lunara-rose-strong" />{t(item.code === 'STANDARD' ? 'Standard Delivery' : item.code === 'EXPRESS' ? 'Express Delivery' : 'Same-Day Delivery')}</span><span className="text-sm text-lunara-body">{t('Surcharge {{fee}}', { fee: formatVND(item.surcharge, language) })}</span></label>)}</fieldset>
    </div>}
  </section>;
}
