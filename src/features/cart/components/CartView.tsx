import { useLocale } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { Link } from 'react-router';
import { ShoppingBag } from 'lucide-react';
import { CartItemList } from './CartItemList';
import { CartSummary } from './CartSummary';
import { CodCheckoutForm } from './CodCheckoutForm';
import { CodOrderReview } from './CodOrderReview';
import { CodConfirmation } from './CodConfirmation';
import { CheckoutPayment } from './CheckoutPayment';
import type { CodCheckoutModel } from '../hooks/useCodCheckout';
export function CartView(model: CodCheckoutModel) {
  const { t } = useLocale("cart");
  return <div className="min-h-screen bg-lunara-cream font-body">
    <div className="bg-lunara-blush px-6 py-12"><div className="mx-auto max-w-7xl"><h1 className="font-display text-4xl font-semibold text-lunara-ink">{t(model.step === 'success' ? 'Order received' : 'Checkout')}</h1><p className="mt-3 text-lunara-body">{t('Cash on delivery COD')}</p></div></div>
    <div className="mx-auto max-w-7xl px-6 py-10">
      {model.step === 'success' && model.order ? <CodConfirmation order={model.order} /> : model.catalogLoading ? <p role="status">{t('Loading catalog')}</p> : model.catalogError ? <div role="alert">{t(apiErrorKey(model.catalogError))}<button onClick={model.reloadCatalog} className="ml-4 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div> : !model.items.length ? <div data-empty-cart className="py-20 text-center"><ShoppingBag size={48} className="mx-auto mb-4 text-lunara-rose-strong" /><p>{t('Your cart is empty.')}</p><Link to="/shop" className="text-lunara-rose-strong">{t('Browse flowers →')}</Link></div> : <div className="grid gap-8 lg:grid-cols-3"><div className="min-w-0 lg:col-span-2">{model.step === 'details' ? <div className="space-y-6"><CartItemList {...model} /><CodCheckoutForm {...model} /></div> : <CodOrderReview {...model} />}</div><div className="min-w-0 self-start"><CartSummary {...model} /><CheckoutPayment {...model} /></div></div>}
    </div>
  </div>;
}
