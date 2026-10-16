import { useLocale, getLocalizedName } from "@/shared/i18n";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { cn } from "@/shared/lib/utils";
import { formatVND } from "@/shared/lib/format";
import type { Product } from "../shop.types";
interface ProductCardProps {
  product: Product;
  liked?: boolean;
  added: boolean;
  onLike?: (id: number) => void;
  onAdd: (id: number, variantId?: number) => void;
  selectedVariantId?: number;
  onSelectVariant?: (productId: number, variantId: number) => void;
}
export function ProductCard({ product, added, onAdd, selectedVariantId, onSelectVariant }: ProductCardProps) {
  const { t, language } = useLocale("shop");
  const variants = product.variants || [];
  const variant = variants.find(item => item.id === selectedVariantId) || variants.find(item => item.in_stock) || variants[0];
  const description = language === 'vi' ? product.description_vi || product.description_en : product.description_en || product.description_vi;
  return <article data-product-id={product.id} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-lunara-border bg-lunara-surface transition-colors hover:border-lunara-rose">
    <div className="aspect-[4/3] overflow-hidden bg-lunara-blush">
      <ImageWithFallback src={product.image} alt={getLocalizedName(product, language)} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" />
    </div>
    <div className="flex flex-1 flex-col p-3 sm:p-5">
      {product.tag && <p className="mb-2 text-[0.6rem] font-semibold tracking-[0.12em] text-lunara-rose-strong uppercase">{t(product.tag)}</p>}
      <h3 className="mb-2 font-display text-lg leading-snug font-medium text-lunara-ink">{getLocalizedName(product, language)}</h3>
      {description && <p className="mb-4 line-clamp-2 text-xs leading-5 text-lunara-body">{description}</p>}
      <label className="mt-auto block text-xs text-lunara-body">
        {t('Choose size')}
        <select aria-label={t('Size for {{name}}', { name: getLocalizedName(product, language) })} value={variant?.id || ''} onChange={event => onSelectVariant?.(product.id, Number(event.target.value))} className="mt-1.5 min-h-11 w-full rounded-lg border border-lunara-border bg-lunara-cream px-3 py-2 text-sm text-lunara-ink">
          {variants.map(item => <option key={item.id} value={item.id} disabled={!item.in_stock}>{item.size_code}{!item.in_stock ? ` — ${t('Out of stock')}` : ''}</option>)}
        </select>
      </label>
      <p className="mt-2 mb-3 text-[0.65rem] leading-5 text-lunara-body">{variant?.in_stock ? variant.low_stock ? t('Low stock') : t('In stock') : t('Out of stock')}</p>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-lunara-border pt-3">
        <span data-product-price className="text-sm font-semibold text-lunara-ink">{variant ? formatVND(variant.price, language) : t('Unavailable')}</span>
        <Button variant="ghost" disabled={!variant?.in_stock} onClick={() => onAdd(product.id, variant?.id)} aria-label={t("Add {{value0}} to cart", { value0: getLocalizedName(product, language) })} className={cn("h-auto min-h-11 gap-2 rounded-full bg-lunara-rose-strong px-4 py-2 text-xs font-medium text-white hover:bg-lunara-ink hover:text-white focus-visible:ring-lunara-ink [&_svg]:size-3.5", added && "bg-lunara-ink")}>
          <ShoppingBag aria-hidden="true" />{added ? t('Added') : t('Add to Cart')}
        </Button>
      </div>
    </div>
  </article>;
}
