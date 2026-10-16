import { Link } from 'react-router';
import { ArrowLeft, ChevronDown, ChevronRight, Flower2, PackageCheck, Truck } from 'lucide-react';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { apiErrorKey } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { Dropdown } from '@/shared/ui/dropdown';
import { ProductGallery } from './ProductGallery';
import type { ProductDetailModel } from '../hooks/useProductDetail';

export function ProductDetailView(model: ProductDetailModel) {
  const { t, language } = useLocale("shop");
  const common = useLocale('common');
  const product = model.product;
  const description = language === 'vi' ? product?.description_vi || product?.description_en : product?.description_en || product?.description_vi;
  const name = product ? getLocalizedName(product, language) : '';
  const category = model.category ? getLocalizedName(model.category, language) : '';
  const stock = model.variant?.in_stock ? model.variant.low_stock ? 'Low stock' : 'In stock' : 'Out of stock';
  const details = [
    ...(category ? [{ label: 'Category', value: category }] : []),
    ...(model.variant ? [{ label: 'Product code', value: model.variant.sku }, { label: 'Selected size', value: model.variant.size_code }] : []),
    { label: 'Availability', value: common.t(stock) },
  ];
  return <main className="mx-auto max-w-[1400px] px-4 pt-5 pb-16 font-body text-lunara-body sm:px-6 lg:px-10">
    {model.loading ? <div role="status" className="grid min-h-[60vh] place-items-center rounded-3xl bg-lunara-surface p-8">{t('Loading product')}</div>
      : model.error || !product ? <section className="mx-auto my-12 max-w-lg rounded-3xl bg-lunara-surface p-8 text-center shadow-sm">
        <h1 className="mb-3 font-display text-3xl text-lunara-ink">{t(model.notFound ? 'Product not found' : 'Product unavailable')}</h1>
        <p role={model.notFound ? 'status' : 'alert'} className="mb-6 text-sm leading-7">{model.notFound ? t('This arrangement is no longer available. Explore the rest of our collection.') : common.t(apiErrorKey(model.error))}</p>
        {!model.notFound && <Button onClick={model.retry} className="mb-4 rounded-full bg-lunara-rose-strong text-white hover:bg-lunara-ink">{common.t('Retry')}</Button>}
        <Link to="/shop" className="flex min-h-11 items-center justify-center gap-2 text-sm text-lunara-rose-strong"><ArrowLeft size={16} />{t('Back to collection')}</Link>
      </section> : <>
        <Link data-back-to-collection to="/shop" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-lunara-rose-strong"><ArrowLeft size={16} />{t('Back to collection')}</Link>
        <article data-product-detail={product.id} className="grid min-w-0 gap-7 rounded-[2rem] bg-lunara-surface p-4 shadow-md shadow-lunara-ink/5 sm:p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 lg:p-8">
          <ProductGallery {...model} />
          <div className="min-w-0 py-1 lg:py-0">
            <nav aria-label={t('Breadcrumb')} className="mb-5 flex flex-wrap items-center gap-2 text-xs leading-6 text-lunara-body">
              <Link to="/" className="hover:text-lunara-rose-strong">{common.t('Home')}</Link><ChevronRight size={12} aria-hidden="true" />
              <Link to={product.category_code ? `/shop?category=${encodeURIComponent(product.category_code)}` : '/shop'} className="hover:text-lunara-rose-strong">{category || t('Our Collection')}</Link>
              <ChevronRight size={12} aria-hidden="true" /><span aria-current="page" className="min-w-0 break-words text-lunara-rose-strong">{name}</span>
            </nav>
            <h1 className="mb-3 font-display text-[clamp(2rem,3.5vw,3rem)] leading-[1.15] break-words text-lunara-ink">{name}</h1>
            {model.variant && <p data-detail-sku className="mb-5 text-xs tracking-wide break-all">{t('Product code')}: {model.variant.sku}</p>}
            <div aria-live="polite" aria-atomic="true" className="mb-5 flex flex-wrap items-baseline gap-3">
              {model.variant?.compare_at_price != null && model.variant.compare_at_price > model.variant.price && <del className="text-sm text-lunara-body">{formatVND(model.variant.compare_at_price, language)}</del>}
              <span data-detail-price className="text-2xl font-semibold text-lunara-rose-strong sm:text-3xl">{model.variant ? formatVND(model.variant.price, language) : common.t('Unavailable')}</span>
            </div>
            {description && <p data-detail-description className="mb-6 text-sm leading-7 whitespace-pre-line">{description}</p>}
            <label className="mb-3 block text-sm font-medium text-lunara-ink">{common.t('Choose size')}
              <Dropdown aria-label={common.t('Choose size')} value={model.variant?.id || ''} onValueChange={value => model.selectVariant(Number(value))} className="mt-2 bg-lunara-cream">
                {product.variants.map(variant => <option key={variant.id} value={variant.id} disabled={!variant.in_stock}>{variant.size_code}{!variant.in_stock ? ` — ${common.t('Out of stock')}` : ''}</option>)}
              </Dropdown>
            </label>
            <p className="mb-5 text-xs text-lunara-body" aria-live="polite">{common.t(stock)}</p>
            <dl aria-label={t('Product details')} className="mb-6 overflow-hidden rounded-2xl bg-lunara-cream text-sm">
              {details.map(row => <div key={row.label} className="grid grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] gap-4 border-b border-lunara-border px-4 py-3.5 last:border-0 sm:px-5"><dt className="font-medium text-lunara-ink">{t(row.label)}</dt><dd className="min-w-0 break-words">{row.value}</dd></div>)}
            </dl>
            <Button data-order-now disabled={!model.variant?.in_stock || model.cartLoading || Boolean(model.catalogError)} onClick={model.orderNow} className="relative min-h-13 w-full gap-3 rounded-full bg-lunara-rose-strong px-6 py-4 text-sm font-semibold text-white hover:bg-lunara-ink">{t('Order flowers now')}</Button>
            {model.cartError && <p role="alert" className="mt-3 text-sm text-lunara-ink">{common.t(model.cartError)}</p>}
            {Boolean(model.catalogError) && <div role="alert" className="mt-3 rounded-2xl bg-lunara-blush p-4 text-sm"><p>{common.t(apiErrorKey(model.catalogError))}</p><button type="button" onClick={model.retryCatalog} className="mt-2 min-h-11 text-lunara-rose-strong underline">{common.t('Retry')}</button></div>}
            {/* <p className="mt-3 mb-6 text-center text-xs leading-6">{t('Choose your size, then continue to your cart to arrange delivery.')}</p> */}
            <details open className="group rounded-2xl bg-lunara-blush/65 p-5">
              <summary className="flex min-h-6 items-center justify-between gap-4 text-sm font-medium text-lunara-ink [&::-webkit-details-marker]:hidden">{t('A note about your flowers')}<ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary>
              <ul className="mt-4 list-disc space-y-2 pl-4 text-xs leading-6"><li>{t('Each arrangement is handcrafted, so its shape and placement may vary slightly.')}</li><li>{t('Seasonal flowers and foliage may vary with availability.')}</li><li>{t('Colours may appear slightly different in photographs and on your screen.')}</li></ul>
            </details>
          </div>
        </article>
        <section aria-label={t('Shopping with Lunarra')} className="mt-6 grid gap-5 rounded-2xl bg-lunara-blush/70 p-6 sm:grid-cols-3 sm:gap-6">
          {[{ icon: Truck, title: 'Delivery to your door', text: 'Check delivery areas and fees in your cart.' }, { icon: Flower2, title: 'Handcrafted with care', text: 'Thoughtful arrangements for every occasion.' }, { icon: PackageCheck, title: 'Cash on delivery', text: 'Review your order before confirming.' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-3"><Icon size={25} strokeWidth={1.5} className="mt-0.5 shrink-0 text-lunara-rose-strong" aria-hidden="true" /><div><h2 className="mb-1 text-sm font-medium text-lunara-ink">{t(title)}</h2><p className="text-xs leading-5">{t(text)}</p></div></div>)}
        </section>

      </>}
  </main>;
}
