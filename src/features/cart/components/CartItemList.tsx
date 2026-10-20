import { Link } from 'react-router';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import type { QuoteCartModel } from '../hooks/useQuoteCart';

export function CartItemList({ items, updateQty, removeItem, sending = false }: QuoteCartModel & { sending?: boolean }) {
  const { t, language } = useLocale('cart');
  return <div>
    <div aria-hidden="true" className="hidden grid-cols-12 border-b border-lunara-border pb-3 text-sm tracking-wider text-lunara-body uppercase sm:grid">
      <span className="col-span-5">{t('Flower products')}</span>
      <span className="col-span-2 text-center">{t('Unit price')}</span>
      <span className="col-span-3 text-center">{t('Quantity')}</span>
      <span className="col-span-2 text-right">{t('Line subtotal')}</span>
    </div>
    <ul className="divide-y divide-lunara-border">
      {items.map(item => {
        const name = getLocalizedName(item, language) || t('Unavailable');
        const path = item.slug ? '/shop/' + encodeURIComponent(item.slug) : '/shop';
        return <li key={item.id} data-cart-item={item.variantId} className="grid grid-cols-1 items-center gap-4 py-5 sm:grid-cols-12">
          <div className="flex min-w-0 items-start gap-4 sm:col-span-5">
            <Link to={path} className="block aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-[2px] bg-lunara-blush">
              <ImageWithFallback src={item.image} alt={name} className="h-full w-full object-cover" />
            </Link>
            <div className="min-w-0 space-y-1">
              <h3 className="font-display text-base leading-snug break-words text-lunara-ink"><Link to={path} className="transition-colors hover:text-lunara-rose-strong">{name}</Link></h3>
              <p className="text-sm text-lunara-body">{t('Size:')} {item.sizeCode || t(item.size)}</p>
              <button type="button" onClick={() => removeItem(item.id)} disabled={sending} aria-label={t('Remove {{value0}}', { value0: name })} className="inline-flex min-h-11 items-center gap-1 text-sm text-lunara-rose-strong hover:text-lunara-ink"><Trash2 size={14} aria-hidden="true" />{t('Remove item')}</button>
            </div>
          </div>
          <p className="min-w-0 text-sm break-words text-lunara-ink sm:col-span-2 sm:text-center"><span className="mr-2 text-lunara-body sm:hidden">{t('Unit price')}:</span>{item.name ? formatVND(item.price, language) : t('Unavailable')}</p>
          <div className="flex items-center sm:col-span-3 sm:justify-center">
            <div className="inline-flex items-center rounded-[2px] border border-lunara-border bg-lunara-surface">
              <button type="button" disabled={sending || item.qty <= 1} onClick={() => updateQty(item.id, -1)} aria-label={t('Decrease quantity')} className="flex size-11 items-center justify-center text-lunara-body hover:text-lunara-ink disabled:opacity-40"><Minus size={14} aria-hidden="true" /></button>
              <span data-cart-quantity className="min-w-6 px-1 text-center text-base font-medium tabular-nums text-lunara-ink">{item.qty}</span>
              <button type="button" disabled={sending || item.qty >= (item.maxQuantity ?? 20)} onClick={() => updateQty(item.id, 1)} aria-label={t('Increase quantity')} className="flex size-11 items-center justify-center text-lunara-body hover:text-lunara-ink disabled:opacity-40"><Plus size={14} aria-hidden="true" /></button>
            </div>
          </div>
          <p data-cart-line-total className="min-w-0 text-sm font-medium break-words text-lunara-ink sm:col-span-2 sm:text-right"><span className="mr-2 text-lunara-body sm:hidden">{t('Line subtotal')}:</span>{item.name ? formatVND(item.price * item.qty, language) : t('Unavailable')}</p>
        </li>;
      })}
    </ul>
  </div>;
}
