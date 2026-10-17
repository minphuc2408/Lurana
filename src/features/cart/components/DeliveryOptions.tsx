import { useLocale } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { apiErrorKey } from '@/shared/api/client';
import type { QuoteCartModel } from '../hooks/useQuoteCart';
import { Combobox } from '@/shared/ui/combobox';
import { deliveryWardOptions, normalizeAddressSearch } from '../delivery-address';
export function DeliveryOptions(model: QuoteCartModel & { embedded?: boolean; hideMethods?: boolean }) {
  const { t, language } = useLocale("cart");
  const province = model.options?.provinces.find(item => item.province_name === model.province);
  return <section className={model.embedded ? 'text-xs [&_input]:rounded-[2px] [&_input]:bg-lunara-cream [&_input]:p-2.5 [&_input]:text-xs [&_label]:text-xs' : 'mt-8 rounded-2xl border border-lunara-border bg-white p-6'}>
    {!model.embedded && <h2 className="mb-5 font-display text-2xl text-lunara-ink">{t('Delivery Options')}</h2>}
    {model.optionsError ? <div role="alert">{t(apiErrorKey(model.optionsError))}<button type="button" onClick={model.retry} className="ml-4 rounded-full bg-lunara-rose-strong px-4 py-2 text-white">{t('Retry')}</button></div> : !model.options ? <p role="status">{t('Loading delivery options')}</p> : <div className="space-y-5">{!model.options.provinces.length && <p role="status" className="text-sm text-lunara-body">{t('No configured delivery areas')}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Combobox name="province_name" label={t('Province')} placeholder={t('Select or search city')} emptyText={t('No matching location')} value={model.province} onValueChange={model.setProvince} normalize={normalizeAddressSearch} options={model.options.provinces.map(city => ({ value: city.province_name, label: city.province_name }))} />
        <Combobox key={model.province} name="ward_name" label={t('Ward')} placeholder={t(model.province ? 'Select or search ward' : 'Select city first')} emptyText={t('No matching location')} value={model.ward} onValueChange={model.setWard} normalize={normalizeAddressSearch} disabled={!model.province} options={deliveryWardOptions(model.province, model.options)} />
      </div>
      {province && province.default_fee !== null && <p className="text-sm text-lunara-body">{t('Default delivery fee {{fee}}', { fee: formatVND(province.default_fee, language) })}</p>}
      {!model.hideMethods && <DeliveryMethods {...model} />}
    </div>}
  </section>;
}

export function DeliveryMethods(model: QuoteCartModel) {
  const { t, language } = useLocale("cart");
  return <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2"><legend className="mb-2 text-xs text-lunara-body">{t('Delivery method')}</legend>{model.options?.methods.map(item => <label key={item.code} className={'flex min-w-0 flex-col gap-1.5 rounded-[2px] border p-3 text-xs text-lunara-ink ' + (model.method === item.code ? 'border-lunara-rose-strong bg-lunara-cream' : 'border-lunara-border')}><span className="flex items-center gap-3"><input type="radio" name="delivery-method" value={item.code} checked={model.method === item.code} onChange={() => model.setMethod(item.code)} className="accent-lunara-rose-strong" />{t(item.code === 'STANDARD' ? 'Standard Delivery' : item.code === 'EXPRESS' ? 'Express Delivery' : 'Same-Day Delivery')}</span><span className="pl-6 text-[11px] text-lunara-body">{t('Surcharge {{fee}}', { fee: formatVND(item.surcharge, language) })}</span></label>)}</fieldset>;
}
