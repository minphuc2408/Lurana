import { Link } from 'react-router';
import { Heart, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { getLocalizedName, useLocale } from '@/shared/i18n';
import { formatVND } from '@/shared/lib/format';
import { catalogCardPrice } from '../shop.service';
import { useWishlist } from '../WishlistProvider';

export function WishlistDrawer() {
  const { t, language } = useLocale('shop');
  const wishlist = useWishlist();
  return <Dialog open={wishlist.open} onOpenChange={open => { if (!open) wishlist.close(); }}>
    <DialogContent data-wishlist-drawer className="top-0 right-0 left-auto flex h-dvh w-1/4 min-w-64 max-w-[480px] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-l border-lunara-border bg-lunara-card-surface p-0 font-body text-lunara-body shadow-xl sm:max-w-[480px] data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
      onCloseAutoFocus={event => { event.preventDefault(); wishlist.restoreFocus(); }}>
      <div className="border-b border-lunara-border px-5 pt-6 pb-5 pr-10">
        <DialogTitle className="font-display text-xl text-lunara-ink">{t('Favorite flowers ({{count}})', { count: wishlist.items.length })}</DialogTitle>
        <DialogDescription className="sr-only">{t('Flowers you like during this visit')}</DialogDescription>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {!wishlist.items.length ? <div data-wishlist-empty className="flex flex-col items-center gap-4 py-12 text-center text-sm"><Heart size={30} strokeWidth={1.3} aria-hidden="true" /><p>{t('No favorite flowers yet')}</p></div>
          : <ul className="divide-y divide-lunara-border">{wishlist.items.map(product => <li key={product.id} data-wishlist-item={product.id} className="relative flex gap-3 py-5 pr-5">
            <Link to={'/shop/' + product.slug} onClick={wishlist.close} className="w-14 shrink-0"><ImageWithFallback src={product.image} alt={getLocalizedName(product, language)} className="aspect-[4/5] w-full rounded-[2px] bg-lunara-blush object-cover" /></Link>
            <div className="min-w-0"><Link to={'/shop/' + product.slug} onClick={wishlist.close} className="block font-display text-sm leading-6 break-words text-lunara-ink hover:text-lunara-rose-strong">{getLocalizedName(product, language)}</Link><p className="mt-1 text-xs">{formatVND(catalogCardPrice(product), language)}</p></div>
            <button type="button" onClick={() => wishlist.remove(product.id)} aria-label={t('Remove {{name}} from favorites', { name: getLocalizedName(product, language) })} className="absolute top-4 -right-2 inline-flex size-8 items-center justify-center text-lunara-body hover:text-lunara-rose-strong"><X size={14} aria-hidden="true" /></button>
          </li>)}</ul>}
      </div>
      <div className="border-t border-lunara-border p-5"><button type="button" data-wishlist-continue onClick={wishlist.close} className="min-h-11 w-full rounded-[2px] bg-lunara-rose-strong px-3 py-3 text-xs font-medium text-white hover:bg-lunara-ink">{t('Continue exploring flowers')}</button></div>
    </DialogContent>
  </Dialog>;
}
