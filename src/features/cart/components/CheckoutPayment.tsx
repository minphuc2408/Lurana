import { useLocale } from '@/shared/i18n';
import { ShieldCheck, Truck } from 'lucide-react';
import { FeatureUnavailableDialog } from '@/shared/components/FeatureUnavailableDialog';
import type { CodCheckoutModel } from '../hooks/useCodCheckout';

export function CheckoutPayment(model: CodCheckoutModel) {
  const { t } = useLocale('cart');
  return <section data-checkout-payment className="space-y-4 rounded-[2px] border border-lunara-border bg-lunara-surface p-5 sm:p-6">
    <h2 className="border-b border-lunara-border pb-2 font-display text-xl leading-7 text-lunara-ink">5. {t('Payment method')}</h2>
    <fieldset disabled={model.sending} className="space-y-3">
      <legend className="sr-only">{t('Payment method')}</legend>
      {(['BANK_TRANSFER', 'COD'] as const).map(method => <label key={method} className={'flex items-start gap-3 rounded-[2px] border p-3.5 text-sm leading-relaxed ' + (model.payment === method ? 'border-lunara-rose-strong bg-lunara-cream' : 'border-lunara-border')}>
        <input name="payment-method" type="radio" value={method} checked={model.payment === method} onChange={() => model.selectPayment(method)} className="mt-0.5 size-4 shrink-0 accent-lunara-rose-strong" />
        <span><span className="block font-medium text-lunara-ink">{t(method === 'COD' ? 'Cash on delivery COD' : 'Bank transfer Internet Banking ATM')}</span><span className="mt-0.5 block text-sm">{t(method === 'COD' ? 'Pay when flowers arrive' : 'Bank transfer is coming soon')}</span></span>
      </label>)}
    </fieldset>
    <label className="block text-sm font-medium">{t('Order note optional')}<textarea name="note" maxLength={500} value={model.form.note} onChange={event => model.updateForm('note', event.target.value)} placeholder={t('Notes for the florist placeholder')} rows={2} className="mt-1 w-full rounded-[2px] border border-lunara-border bg-lunara-cream p-2.5 text-base leading-6 font-normal text-lunara-ink placeholder:text-lunara-body placeholder:opacity-100" /></label>
  </section>;
}

export function CheckoutActions(model: CodCheckoutModel) {
  const { t } = useLocale('cart');
  return <div className="space-y-4">
    <div className="flex items-start gap-2 text-sm leading-relaxed">
      <input id="checkout-terms" name="termsAccepted" type="checkbox" aria-labelledby="checkout-consent-copy" checked={model.termsAccepted} disabled={model.sending} onChange={event => model.setTermsAccepted(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-lunara-rose-strong" />
      <p id="checkout-consent-copy"><label htmlFor="checkout-terms" className="text-sm">{t('I have read and agree to')}</label>{' '}<button data-checkout-terms type="button" onClick={() => model.setTermsNoticeOpen(true)} className="text-left text-sm text-lunara-rose-strong underline underline-offset-4">{t('Terms and Conditions')}</button>{' '}{t('of the website')}</p>
    </div>
    {model.step === 'details' ? <><button data-checkout-review type="submit" form="cod-checkout" disabled={!model.canReview} className="min-h-12 w-full rounded-[2px] bg-lunara-rose-strong px-4 py-4 text-sm font-medium tracking-wider text-white uppercase hover:bg-lunara-ink disabled:opacity-50">{t('Review and place order')}</button><p className="text-center text-sm leading-relaxed">{t('Review before sending notice')}</p></> : <button data-checkout-submit type="button" onClick={model.placeOrder} disabled={model.sending || !model.canReview || !model.challenge.ready} className="min-h-12 w-full rounded-[2px] bg-lunara-rose-strong px-4 py-4 text-sm font-medium tracking-wider text-white uppercase hover:bg-lunara-ink disabled:opacity-50">{model.sending ? t('Placing order') : model.submitError ? t('Retry order') : t('Confirm and send flowers')}</button>}
    <div data-checkout-service-notes className="space-y-2 pt-2 text-sm leading-relaxed text-lunara-body">
      <p className="flex items-start gap-1.5"><ShieldCheck size={14} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-lunara-rose-strong" /><span>{t('We send you a photo of your flowers before delivery.')}</span></p>
      <p className="flex items-start gap-1.5"><Truck size={14} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-lunara-rose-strong" /><span>{t('Careful delivery keeps every petal in shape.')}</span></p>
    </div>
    <FeatureUnavailableDialog open={model.paymentNoticeOpen} onOpenChange={model.setPaymentNoticeOpen} description={t('Bank transfer coming soon')} />
    <FeatureUnavailableDialog open={model.termsNoticeOpen} onOpenChange={model.setTermsNoticeOpen} title={t('Terms and Conditions')} description={t('Terms content coming later')} />
  </div>;
}
