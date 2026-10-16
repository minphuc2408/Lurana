import { useLocale } from '@/shared/i18n';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/shared/ui/dialog';
import { FeatureUnavailable } from '@/shared/components/FeatureUnavailable';
import type { CodCheckoutModel } from '../hooks/useCodCheckout';

export function CheckoutPayment(model: CodCheckoutModel) {
  const { t } = useLocale("cart");
  return <section data-checkout-payment className="mt-5 rounded-2xl border border-lunara-border bg-white p-5 sm:p-6">
    <fieldset disabled={model.sending} className="space-y-4">
      <legend className="mb-5 font-display text-2xl text-lunara-ink">{t('Payment method')}</legend>
      {(['BANK_TRANSFER', 'COD'] as const).map(method => <label key={method} className="flex items-start gap-3 rounded-xl border border-lunara-border p-4 text-sm leading-6 text-lunara-ink">
        <input name="payment-method" type="radio" value={method} checked={model.payment === method} onChange={() => model.selectPayment(method)} className="mt-1 size-4 shrink-0 accent-lunara-rose-strong" />
        <span><span className="font-medium">{t(method === 'COD' ? 'Cash on delivery COD' : 'Bank transfer Internet Banking ATM')}</span>{method === 'COD' && <span className="mt-1 block text-lunara-body">{t('Pay when flowers arrive')}</span>}</span>
      </label>)}
    </fieldset>
    <div className="mt-5 flex items-start gap-3 text-sm leading-6 text-lunara-body">
      <input id="checkout-terms" name="termsAccepted" type="checkbox" aria-labelledby="checkout-consent-copy" checked={model.termsAccepted} disabled={model.sending} onChange={event => model.setTermsAccepted(event.target.checked)} className="mt-1 size-4 shrink-0 accent-lunara-rose-strong" />
      <p id="checkout-consent-copy"><label htmlFor="checkout-terms">{t('I have read and agree to')}</label>{' '}<button data-checkout-terms type="button" onClick={() => model.setTermsNoticeOpen(true)} className="text-left text-lunara-rose-strong underline underline-offset-4">{t('Terms and Conditions')}</button>{' '}{t('of the website')}</p>
    </div>
    {model.step === 'details' ? <>
      <button data-checkout-review type="submit" form="cod-checkout" disabled={!model.canReview} className="mt-5 w-full rounded-full bg-lunara-rose-strong px-5 py-3 text-white disabled:opacity-50">{t('Review and place order')}</button>
      <p className="mt-3 text-center text-xs leading-5 text-lunara-body">{t('Review before sending notice')}</p>
    </> : <button data-checkout-submit type="button" onClick={model.placeOrder} disabled={model.sending || !model.canReview || !model.challenge.ready} className="mt-5 w-full rounded-full bg-lunara-rose-strong px-5 py-3 text-white disabled:opacity-50">{model.sending ? t('Placing order') : model.submitError ? t('Retry order') : t('Place Order')}</button>}
    <Dialog open={model.paymentNoticeOpen} onOpenChange={model.setPaymentNoticeOpen}>
      <DialogContent className="rounded-2xl border-lunara-border bg-lunara-cream font-body">
        <DialogTitle className="sr-only">{t('Bank transfer Internet Banking ATM')}</DialogTitle>
        <DialogDescription className="sr-only">{t('Bank transfer coming soon')}</DialogDescription>
        <FeatureUnavailable inline description={t('Bank transfer coming soon')} />
        <DialogClose asChild><button type="button" className="rounded-full bg-lunara-rose-strong px-6 py-3 text-white">{t('Close')}</button></DialogClose>
      </DialogContent>
    </Dialog>
    <Dialog open={model.termsNoticeOpen} onOpenChange={model.setTermsNoticeOpen}>
      <DialogContent className="rounded-2xl border-lunara-border bg-lunara-cream font-body">
        <DialogTitle className="font-display text-2xl text-lunara-ink">{t('Terms and Conditions')}</DialogTitle>
        <DialogDescription className="text-lunara-body">{t('Terms content coming later')}</DialogDescription>
        <DialogClose asChild><button type="button" className="rounded-full bg-lunara-rose-strong px-6 py-3 text-white">{t('Close')}</button></DialogClose>
      </DialogContent>
    </Dialog>
  </section>;
}
