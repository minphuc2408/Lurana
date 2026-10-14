import { useLocale, getLocalizedName } from "@/shared/i18n";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { cn } from "@/shared/lib/utils";
import { formatVND } from "@/shared/lib/format";
import type { Product } from "../shop.types";
interface ProductCardProps {
  product: Product;
  liked: boolean;
  added: boolean;
  onLike: (id: number) => void;
  onAdd: (id: number, variantId?: number) => void;
  selectedVariantId?: number;
  onSelectVariant?: (productId: number, variantId: number) => void;
}
export function ProductCard({
  product,
  liked,
  added,
  onLike,
  onAdd,
  selectedVariantId,
  onSelectVariant
}: ProductCardProps) {
  const { t, language } = useLocale("shop");
  const variants = product.variants || [];
  const variant = variants.find(item => item.id === selectedVariantId) || variants.find(item => item.in_stock) || variants[0];
  return <article data-product-id={product.id} className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div className="relative aspect-[3/4] overflow-hidden">
      <ImageWithFallback src={product.image} alt={getLocalizedName(product, language)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      {product.tag && <span className="absolute top-3 left-3 rounded-full bg-lunara-rose-strong px-3 py-1 text-[0.65rem] tracking-[0.1em] text-white uppercase">{t(product.tag)}</span>}
    </div>
    <div className="p-4">
      <h3 className="mb-1 font-display text-base font-medium text-lunara-ink">{getLocalizedName(product, language)}</h3>
      <label className="mb-3 block text-sm text-lunara-body">
        {t('Choose size')}
        <select aria-label={t('Size for {{name}}', { name: getLocalizedName(product, language) })} value={variant?.id || ''} onChange={event => onSelectVariant?.(product.id, Number(event.target.value))} className="mt-1 w-full rounded-lg border border-lunara-border bg-lunara-surface px-3 py-2 text-lunara-ink">
          {variants.map(item => <option key={item.id} value={item.id} disabled={!item.in_stock}>{item.size_code}{!item.in_stock ? ` — ${t('Out of stock')}` : ''}</option>)}
        </select>
      </label>
      <p className="mb-3 text-xs text-lunara-body">{variant?.in_stock ? variant.low_stock ? t('Low stock') : t('In stock') : t('Out of stock')}</p>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <span data-product-price className="text-[0.95rem] font-medium text-lunara-rose-strong">{variant ? formatVND(variant.price, language) : t('Unavailable')}</span>
        <Button variant="ghost" disabled={!variant?.in_stock} onClick={() => onAdd(product.id, variant?.id)} aria-label={t("Add {{value0}} to cart", { value0: getLocalizedName(product, language) })} className={cn("h-auto gap-1 rounded-full border border-lunara-rose px-3 py-2 text-[0.72rem] hover:bg-lunara-blush hover:text-lunara-rose-strong focus-visible:ring-lunara-ink [&_svg]:size-3", added ? "bg-lunara-rose-strong text-white" : "bg-transparent text-lunara-rose-strong")}>
          <ShoppingBag size={12} /> {added ? t("Added") : t("Add")}
        </Button>
      </div>
    </div>
  </article>;
}
