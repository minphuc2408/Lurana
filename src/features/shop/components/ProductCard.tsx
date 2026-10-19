import { Link } from 'react-router';
import { Dropdown } from "@/shared/ui/dropdown";
import { useLocale, getLocalizedName } from "@/shared/i18n";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { cn } from "@/shared/lib/utils";
import { formatVND } from "@/shared/lib/format";
import type { Product } from "../shop.types";
import { useWishlist } from '../WishlistProvider';
interface ProductCardProps {
  appearance?: 'default' | 'featured' | 'recommendation';
  product: Product;
  liked?: boolean;
  added: boolean;
  onLike?: (id: number) => void;
  onAdd: (id: number, variantId?: number) => void;
  selectedVariantId?: number;
  onSelectVariant?: (productId: number, variantId: number) => void;
}
export function ProductCard({ appearance = 'default', product, added, onAdd, selectedVariantId, onSelectVariant }: ProductCardProps) {
  const { t, language } = useLocale("shop");
  const wishlist = useWishlist();
  const favorite = wishlist.items.some(item => item.id === product.id);
  const favoriteButton = <button type="button" data-product-favorite={product.id} aria-pressed={favorite} aria-label={t(favorite ? 'Remove {{name}} from favorites' : 'Add {{name}} to favorites', { name: getLocalizedName(product, language) })} onClick={() => wishlist.toggle(product)} className="absolute top-3 right-3 z-10 hidden size-10 items-center justify-center rounded-[2px] border border-lunara-border bg-lunara-card-surface/95 text-lunara-rose-strong shadow-xs md:inline-flex"><Heart size={18} strokeWidth={1.5} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" /></button>;
  const variants = product.variants || [];
  const variant = variants.find(item => item.id === selectedVariantId) || variants.find(item => item.in_stock) || variants[0];
  const description = language === 'vi' ? product.description_vi || product.description_en : product.description_en || product.description_vi;
  const detailPath = product.slug ? `/shop/${encodeURIComponent(product.slug)}` : '/shop';
  if (appearance === 'featured' || appearance === 'recommendation') return <article data-product-id={product.id} data-product-appearance={appearance} className="group relative flex h-full min-w-0 flex-col">
    {favoriteButton}
    <Link to={detailPath} data-product-image-link aria-label={t('View {{name}}', { name: getLocalizedName(product, language) })} className="relative mb-3 block aspect-[4/5] overflow-hidden rounded-[2px] bg-lunara-blush sm:mb-4">
      <ImageWithFallback src={product.image} alt={getLocalizedName(product, language)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none" />
      <span aria-hidden="true" className="absolute inset-0 flex items-end bg-lunara-ink/10 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none">
        <span className="w-full rounded-[2px] border border-lunara-border bg-lunara-card-surface py-2 text-center text-xs font-medium text-lunara-ink shadow-xs">{t('View details')} →</span>
      </span>
    </Link>
    <div className="flex flex-1 flex-col justify-between">
      <div>
        <h3 className="font-display text-base leading-snug text-lunara-ink transition-colors group-hover:text-lunara-rose-strong sm:text-[17px]"><Link to={detailPath} data-product-name-link className="block truncate">{getLocalizedName(product, language)}</Link></h3>
        {description && appearance !== 'recommendation' && <Link to={detailPath} data-product-description-link className="mt-1 block text-xs leading-5 text-lunara-body hover:text-lunara-rose-strong"><p className="line-clamp-1">{description}</p></Link>}
        {!variant?.in_stock && <p className="mt-1 text-xs leading-5 text-lunara-body">{t('Out of stock')}</p>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
        <span data-product-price className="text-sm font-medium tracking-tight text-lunara-ink sm:text-base">{variant ? formatVND(variant.price, language) : t('Unavailable')}</span>
        {appearance !== 'recommendation' && <Button type="button" data-product-add variant="outline" size="icon" disabled={!variant?.in_stock} onClick={() => onAdd(product.id, variant?.id)} aria-label={t("Add {{value0}} to cart", { value0: getLocalizedName(product, language) })} title={variant?.in_stock ? added ? t('Added') : t('Add to Cart') : t('Out of stock')} className={cn("size-11 rounded-full border-lunara-product-action-border bg-lunara-product-action text-lunara-on-product-action hover:border-lunara-product-action-hover hover:bg-lunara-product-action-hover hover:text-white focus-visible:ring-lunara-rose-strong [&_svg]:size-3.5", added && "border-lunara-rose-strong text-lunara-rose-strong")}>
          {added ? <Check aria-hidden="true" strokeWidth={1.8} /> : <ShoppingBag aria-hidden="true" strokeWidth={1.8} />}
        </Button>}
        <span role="status" className="sr-only">{!variant?.in_stock ? t('Out of stock') : added ? t('Added') : ''}</span>
      </div>
    </div>
  </article>;
  return <article data-product-id={product.id} className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-lunara-surface shadow-sm shadow-lunara-ink/5 transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lg hover:shadow-lunara-rose-strong/10 motion-safe:hover:-translate-y-1 motion-reduce:transition-none">
    {favoriteButton}
    <Link to={detailPath} data-product-image-link aria-label={t('View {{name}}', { name: getLocalizedName(product, language) })} className="block aspect-[4/5] overflow-hidden bg-lunara-blush">
      <ImageWithFallback src={product.image} alt={getLocalizedName(product, language)} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" />
    </Link>
    <div className="flex flex-1 flex-col p-3 sm:p-5">
      {product.tag && <p className="mb-2 bg-lunara-campaign text-[0.6rem] font-semibold tracking-[0.12em] text-lunara-on-campaign uppercase">{t(product.tag)}</p>}
      <h3 className="mb-2 font-display text-lg leading-snug font-medium text-lunara-ink"><Link to={detailPath} data-product-name-link className="transition-colors hover:text-lunara-rose-strong">{getLocalizedName(product, language)}</Link></h3>
      {description && <Link to={detailPath} data-product-description-link className="mb-4 block text-xs leading-5 text-lunara-body transition-colors hover:text-lunara-rose-strong"><p className="line-clamp-2">{description}</p></Link>}
      <label className="mt-auto block text-xs text-lunara-body">
        {t('Choose size')}
        <Dropdown aria-label={t('Size for {{name}}', { name: getLocalizedName(product, language) })} value={variant?.id || ''} onValueChange={value => onSelectVariant?.(product.id, Number(value))} className="mt-1.5 min-h-11 w-full rounded-lg border border-lunara-border bg-lunara-cream px-3 py-2 text-sm text-lunara-ink">
          {variants.map(item => <option key={item.id} value={item.id} disabled={!item.in_stock}>{item.size_code}{!item.in_stock ? ` — ${t('Out of stock')}` : ''}</option>)}
        </Dropdown>
      </label>
      <p className="mt-2 mb-3 text-[0.65rem] leading-5 text-lunara-body">{variant?.in_stock ? variant.low_stock ? t('Low stock') : t('In stock') : t('Out of stock')}</p>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <span data-product-price className="text-sm font-semibold text-lunara-ink">{variant ? formatVND(variant.price, language) : t('Unavailable')}</span>
        <Button data-product-add variant="ghost" disabled={!variant?.in_stock} onClick={() => onAdd(product.id, variant?.id)} aria-label={t("Add {{value0}} to cart", { value0: getLocalizedName(product, language) })} className={cn("h-auto min-h-11 gap-2 rounded-full bg-lunara-rose-strong px-4 py-2 text-xs font-medium text-white hover:bg-lunara-ink hover:text-white focus-visible:ring-lunara-ink [&_svg]:size-3.5", added && "bg-lunara-ink")}>
          <ShoppingBag aria-hidden="true" />{added ? t('Added') : t('Add to Cart')}
        </Button>
      </div>
    </div>
  </article>;
}
