import { Link } from 'react-router';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { formatVND } from '@/shared/lib/format';
import { CartItemList } from './CartItemList';
import type { CodCheckoutModel } from '../hooks/useCodCheckout';

export function CartView(model: CodCheckoutModel) {
  const { t, language } = useLocale('cart');
  const common = useLocale('common');
  const subtotal = model.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return <main data-cart-overview className="mx-auto max-w-[1240px] px-5 py-6 sm:px-8 sm:py-10">
    <nav aria-label={t('Breadcrumb')} className="flex flex-wrap items-center gap-2 py-4 text-xs text-lunara-body"><Link to="/">{common.t('Home')}</Link><span aria-hidden="true">/</span><span aria-current="page">{common.t('Cart')}</span></nav>
    <div className="mb-8 border-b border-lunara-border pb-6"><span className="mb-1 block text-[11px] font-medium tracking-[0.16em] text-lunara-rose-strong uppercase">{t('A message waiting to be sent')}</span><h1 className="font-display text-3xl tracking-tight text-lunara-ink sm:text-4xl">{t('Your flower cart')}</h1></div>
    {model.catalogLoading ? <p role="status">{t('Loading catalog')}</p> : model.catalogError ? <div role="alert">{t(apiErrorKey(model.catalogError))}<button type="button" onClick={model.reloadCatalog} className="ml-4 min-h-11 text-lunara-rose-strong underline">{t('Retry')}</button></div> : !model.items.length ? <section data-empty-cart className="mx-auto max-w-md space-y-4 py-24 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-lunara-blush text-lunara-body"><ShoppingBag size={24} strokeWidth={1.5} aria-hidden="true" /></div>
      <h2 className="font-display text-2xl text-lunara-ink">{t('Your flower cart is empty')}</h2><p className="text-xs leading-relaxed sm:text-sm">{t('Choose flowers for someone special')}</p>
      <Link to="/shop" className="inline-flex min-h-11 items-center gap-2 rounded-[2px] bg-lunara-rose-strong px-8 py-3.5 text-xs font-medium tracking-wider text-white uppercase hover:bg-lunara-ink">{t('Explore fresh flowers')}<ArrowRight size={16} aria-hidden="true" /></Link>
    </section> : <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
      <div className="min-w-0 space-y-4 lg:col-span-8"><CartItemList {...model} /><div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs"><Link to="/shop" className="text-lunara-rose-strong underline hover:text-lunara-ink">{t('Continue choosing flowers')}</Link><p>{t('Choose delivery and your card at checkout')}</p></div>{model.error && <p role="alert" className="text-sm text-lunara-ink">{t(model.error)}</p>}</div>
      <aside aria-label={t('Order Summary')} className="min-w-0 space-y-5 rounded-[2px] border border-lunara-border bg-lunara-surface p-6 lg:col-span-4">
        <h2 className="border-b border-lunara-border pb-3 font-display text-xl text-lunara-ink">{t('Order Summary')}</h2>
        <dl className="space-y-2.5 text-xs"><div className="flex justify-between gap-4"><dt>{t('Flower subtotal')}</dt><dd data-cart-subtotal className="font-medium text-lunara-ink">{formatVND(subtotal, language)}</dd></div>
          {model.quote && <div data-cart-delivery-fee className="flex justify-between gap-4"><dt>{t('Delivery')}</dt><dd>{formatVND(model.quote.delivery_fee, language)}</dd></div>}
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-lunara-border pt-3"><dt className="text-sm font-medium text-lunara-ink">{t(model.quote ? 'Total' : 'Provisional total')}</dt><dd data-cart-total className="font-display text-2xl text-lunara-ink">{formatVND(model.quote?.grand_total ?? subtotal, language)}</dd></div>
        </dl>
        <Link data-proceed-checkout to="/checkout" aria-disabled={model.sending} onClick={event => { if (model.sending) event.preventDefault(); else model.startCheckout(); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-lunara-rose-strong px-4 py-4 text-center text-xs font-medium tracking-wider text-white uppercase transition-colors hover:bg-lunara-ink">{t(model.sending ? 'Placing order' : 'Proceed to Checkout')}<ArrowRight size={16} aria-hidden="true" /></Link>
        <p className="text-center text-[11px] leading-relaxed">{t('Choose delivery date and review your card next')}</p>
      </aside>
    </div>}
  </main>;
}
