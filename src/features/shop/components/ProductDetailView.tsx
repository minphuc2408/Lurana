import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, ChevronRight, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { apiErrorKey } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { ProductGallery } from './ProductGallery';
import { ProductGrid } from './ProductGrid';
import type { ProductDetailModel } from '../hooks/useProductDetail';

export function ProductDetailView(model: ProductDetailModel) {
  const { t, language } = useLocale('shop');
  const common = useLocale('common');
  const product = model.product;
  const description = language === 'vi' ? product?.description_vi || product?.description_en : product?.description_en || product?.description_vi;
  const name = product ? getLocalizedName(product, language) : '';
  const category = model.category ? getLocalizedName(model.category, language) : '';
  const stock = model.variant?.in_stock ? model.variant.low_stock ? 'Low stock' : 'In stock' : 'Out of stock';
  const disabled = !model.variant?.in_stock || !model.availableQuantity || model.cartLoading || Boolean(model.catalogError);
  const pendingCopy = t('Details are being updated');
  return <main data-product-detail-page className="mx-auto max-w-[var(--lunara-content-max-width)] px-5 pt-6 pb-16 font-body text-lunara-body sm:px-8 sm:pt-10">
    {model.loading ? <div role="status" className="grid min-h-[60vh] place-items-center rounded-[2px] bg-lunara-surface p-8">{t('Loading product')}</div>
      : model.error || !product ? <section className="mx-auto my-12 max-w-lg rounded-[2px] bg-lunara-surface p-8 text-center">
        <h1 className="mb-3 font-display text-3xl text-lunara-ink">{t(model.notFound ? 'Product not found' : 'Product unavailable')}</h1>
        <p role={model.notFound ? 'status' : 'alert'} className="mb-6 text-sm leading-7">{model.notFound ? t('This arrangement is no longer available. Explore the rest of our collection.') : common.t(apiErrorKey(model.error))}</p>
        {!model.notFound && <Button onClick={model.retry} className="mb-4 rounded-[2px] bg-lunara-rose-strong text-white hover:bg-lunara-ink">{common.t('Retry')}</Button>}
        <Link to="/shop" className="flex min-h-11 items-center justify-center gap-2 text-sm text-lunara-rose-strong"><ArrowLeft size={16} />{t('Back to collection')}</Link>
      </section> : <>
        <nav aria-label={t('Breadcrumb')} className="mb-6 flex flex-wrap items-center gap-2 text-xs leading-6 sm:mb-8">
          <Link to="/" className="hover:text-lunara-rose-strong">{common.t('Home')}</Link><ChevronRight size={12} aria-hidden="true" />
          <Link data-back-to-collection to="/shop" className="hover:text-lunara-rose-strong">{t('Fresh flower collection')}</Link>
          <ChevronRight size={12} aria-hidden="true" /><span aria-current="page" className="min-w-0 break-words text-lunara-ink">{name}</span>
        </nav>
        <article data-product-detail={product.id} className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12 xl:gap-14">
          <ProductGallery {...model} />
          <div className="min-w-0 lg:py-1">
            {category && <p className="mb-3 bg-lunara-campaign text-[10px] tracking-[0.18em] text-lunara-on-campaign uppercase sm:text-xs">{category}</p>}
            <h1 className="mb-4 font-display text-[clamp(2rem,3vw,2.6rem)] leading-[1.2] break-words text-lunara-ink">{name}</h1>
            <div aria-live="polite" aria-atomic="true" className="mb-3 flex flex-wrap items-baseline gap-3">
              <span data-detail-price className="font-display text-3xl text-lunara-ink">{model.variant ? formatVND(model.variant.price, language) : common.t('Unavailable')}</span>
              {model.variant?.compare_at_price != null && model.variant.compare_at_price > model.variant.price && <del className="text-sm">{formatVND(model.variant.compare_at_price, language)}</del>}
            </div>
            {model.variant && <p data-detail-sku className="mb-5 text-[11px] break-all">{t('Product code')}: {model.variant.sku}</p>}
            {description && <p data-detail-description className="mb-7 max-w-[65ch] text-base leading-7 whitespace-pre-line">{description}</p>}
            <fieldset data-detail-sizes className="mb-4 min-w-0">
              <legend className="mb-3 text-sm font-medium text-lunara-ink uppercase">{common.t('Choose size')}</legend>
              <div className="grid grid-cols-3 gap-2">
                {product.variants.map(variant => <label key={variant.id} className="relative min-w-0">
                  <input type="radio" name="product-size" value={variant.id} checked={model.variant?.id === variant.id} onChange={() => model.selectVariant(variant.id)} disabled={!variant.in_stock} className="peer sr-only" />
                  <span className={cn('flex h-full min-h-16 flex-col items-center justify-center gap-1 rounded-[2px] border px-1 py-2 text-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lunara-rose-strong', model.variant?.id === variant.id ? 'border-lunara-rose-strong bg-lunara-blush text-lunara-ink' : 'border-lunara-border bg-lunara-card-surface', !variant.in_stock && 'opacity-50')}>
                    <span className="text-sm">{t('Size {{size}}', { size: variant.size_code })}</span>
                    <span className="text-sm leading-5 tabular-nums">{formatVND(variant.price, language)}</span>
                    {!variant.in_stock && <span className="text-[10px]">{common.t('Out of stock')}</span>}
                  </span>
                </label>)}
              </div>
            </fieldset>
            <p className="mb-6 text-sm" aria-live="polite">{common.t(stock)}</p>
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <span className="text-sm uppercase">{t('Quantity')}</span>
              <div data-detail-quantity className="inline-flex items-center rounded-[2px] border border-lunara-border bg-lunara-card-surface">
                <button type="button" aria-label={t('Decrease quantity')} disabled={disabled || model.quantity <= 1} onClick={() => model.setQuantity(model.quantity - 1)} className="inline-flex size-11 items-center justify-center disabled:opacity-35"><Minus size={12} aria-hidden="true" /></button>
                <output aria-live="polite" className="min-w-8 text-center text-base tabular-nums text-lunara-ink">{model.quantity}</output>
                <button type="button" aria-label={t('Increase quantity')} disabled={disabled || model.quantity >= model.availableQuantity} onClick={() => model.setQuantity(model.quantity + 1)} className="inline-flex size-11 items-center justify-center disabled:opacity-35"><Plus size={12} aria-hidden="true" /></button>
              </div>
            </div>
            <div data-detail-actions className="flex flex-wrap items-stretch gap-2 sm:gap-3">
              <Button data-detail-add variant="outline" disabled={disabled} onClick={model.addToCart} className="h-auto min-h-11 min-w-0 flex-1 gap-2 whitespace-normal rounded-[2px] border-lunara-secondary-link bg-lunara-card-surface px-3 py-3 text-sm text-lunara-secondary-link uppercase hover:bg-lunara-blush"><ShoppingBag size={15} className="shrink-0" aria-hidden="true" />{t('Add to Cart')}</Button>
              <Button data-order-now disabled={disabled} onClick={model.orderNow} className="h-auto min-h-11 min-w-0 flex-1 gap-2 whitespace-normal rounded-[2px] bg-lunara-rose-strong px-3 py-3 text-sm text-white uppercase hover:bg-lunara-ink">{t('Buy now')}<ArrowRight size={15} className="shrink-0" aria-hidden="true" /></Button>
              <button data-detail-favorite type="button" aria-pressed={model.favorite} aria-label={t(model.favorite ? 'Remove {{name}} from favorites' : 'Add {{name}} to favorites', { name })} onClick={model.toggleFavorite} className="hidden min-h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border border-lunara-rose-strong bg-lunara-card-surface text-lunara-rose-strong md:inline-flex"><Heart size={20} fill={model.favorite ? 'currentColor' : 'none'} strokeWidth={1.5} aria-hidden="true" /></button>
            </div>
            <p role="status" data-detail-added className="mt-2 min-h-5 text-xs text-lunara-rose-strong">{model.added ? t('Added to your cart') : ''}</p>
            {model.variant?.in_stock && !model.availableQuantity && <p className="mt-2 text-xs">{t('This size is already at its cart limit')}</p>}
            {model.cartError && <p role="alert" className="mt-2 text-sm text-lunara-ink">{common.t(model.cartError)}</p>}
            {Boolean(model.catalogError) && <div role="alert" className="mt-3 bg-lunara-blush p-4 text-sm"><p>{common.t(apiErrorKey(model.catalogError))}</p><button type="button" onClick={model.retryCatalog} className="mt-2 min-h-11 text-lunara-rose-strong underline">{common.t('Retry')}</button></div>}
            <div data-detail-service className="mt-4 space-y-2 border-t border-lunara-border pt-4 text-sm leading-6">
              <p className="flex items-start gap-2"><Truck size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-lunara-accent-secondary-strong" aria-hidden="true" /><span>{t('Two-hour flower delivery in inner Hanoi and Ho Chi Minh City')}</span></p>
              <p className="flex items-start gap-2"><ShieldCheck size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-lunara-accent-secondary-strong" aria-hidden="true" /><span>{t('Approve photos of your finished flowers before delivery')}</span></p>
            </div>
          </div>
        </article>
        <section data-product-editorial className="mt-10 space-y-3 border-t border-lunara-border pt-6 sm:mt-12 sm:pt-8">
          <h2 className="font-display text-xl text-lunara-ink">{t('Details and care guide')}</h2>
          <p className="max-w-[65ch] text-base leading-7">{pendingCopy}</p>
        </section>
        <section data-related-products className="mt-12 border-t border-lunara-border pt-8 sm:mt-16 sm:pt-12">
          <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8"><h2 className="font-display text-xl text-lunara-ink sm:text-2xl">{t('You may also like')}</h2><Link data-related-view-all to="/shop" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-xs text-lunara-secondary-link hover:underline">{t('View more')}<ArrowRight size={14} aria-hidden="true" /></Link></div>
          <ProductGrid appearance="recommendation" products={model.relatedProducts} selectedVariants={model.relatedVariants} added={model.addedRelated} onAdd={model.addRelated} />
        </section>
      </>}
  </main>;
}
