import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { CartSummary } from './CartSummary';
import { CodCheckoutForm } from './CodCheckoutForm';
import { CodOrderReview } from './CodOrderReview';
import { CodConfirmation } from './CodConfirmation';
import { CheckoutActions } from './CheckoutPayment';
import type { CodCheckoutModel } from '../hooks/useCodCheckout';

export function CheckoutView(model: CodCheckoutModel) {
  const { t } = useLocale('cart');
  return <main data-checkout-page className="mx-auto max-w-[1240px] px-5 py-6 sm:px-8 sm:py-10">
    {model.step === 'success' && model.order ? <CodConfirmation order={model.order} /> : <>
      <div className="mb-8 border-b border-lunara-border pb-6 text-center"><h1 className="font-display text-3xl tracking-tight text-lunara-ink sm:text-4xl">{t(model.step === 'review' ? 'Confirm your order' : 'Flower delivery and payment')}</h1></div>
      {model.catalogLoading ? <p role="status">{t('Loading catalog')}</p> : model.catalogError ? <div role="alert">{t(apiErrorKey(model.catalogError))}<button type="button" onClick={model.reloadCatalog} className="ml-4 min-h-11 text-lunara-rose-strong underline">{t('Retry')}</button></div> : !model.items.length ? <section data-empty-cart className="space-y-4 py-16 text-center"><h2 className="font-display text-2xl text-lunara-ink">{t('Your flower cart is empty')}</h2><Link to="/shop" className="inline-flex min-h-11 items-center rounded-[2px] bg-lunara-rose-strong px-8 py-3 text-xs text-white">{t('Explore fresh flowers')}</Link></section> : <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="min-w-0 lg:col-span-7">{model.step === 'details' ? <CodCheckoutForm {...model} /> : <CodOrderReview {...model} />}</div>
        <aside className="min-w-0 space-y-6 rounded-[2px] border border-lunara-border bg-lunara-surface p-6 lg:sticky lg:top-28 lg:col-span-5"><CartSummary {...model} /><CheckoutActions {...model} /></aside>
      </div>}
    </>}
  </main>;
}
