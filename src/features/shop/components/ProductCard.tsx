import { useLocale, getLocalizedName } from "@/shared/i18n";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { cn } from "@/shared/lib/utils";
import { formatMoney } from "@/shared/lib/format";
import type { Product } from "../shop.types";
interface ProductCardProps {
  product: Product;
  liked: boolean;
  added: boolean;
  onLike: (id: number) => void;
  onAdd: (id: number) => void;
}
export function ProductCard({
  product,
  liked,
  added,
  onLike,
  onAdd
}: ProductCardProps) {
  const { t, language } = useLocale("shop");
  return <article className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div className="relative aspect-[3/4] overflow-hidden">
      <ImageWithFallback src={product.image} alt={getLocalizedName(product, language)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      {product.tag && <span className="absolute top-3 left-3 rounded-full bg-lunara-rose-strong px-3 py-1 text-[0.65rem] tracking-[0.1em] text-white uppercase">{t(product.tag)}</span>}
      <Button variant="ghost" size="icon" onClick={() => onLike(product.id)} aria-label={t("Wishlist {{value0}}", { value0: getLocalizedName(product, language) })} aria-pressed={liked} className="absolute top-3 right-3 rounded-full bg-white text-lunara-rose-strong shadow-md hover:bg-lunara-blush focus-visible:ring-lunara-ink">
        <Heart size={16} fill={liked ? "currentColor" : "none"} />
      </Button>
    </div>
    <div className="p-4">
      <h3 className="mb-1 font-display text-base font-medium text-lunara-ink">{getLocalizedName(product, language)}</h3>
      <div className="mb-3 flex items-center gap-1">
        <span className="text-xs text-lunara-rose-strong">★ {product.rating}</span>
        <span className="text-[0.72rem] text-lunara-body">({product.reviews})</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.95rem] font-medium text-lunara-rose-strong">{formatMoney(product.price)}</span>
        <Button variant="ghost" onClick={() => onAdd(product.id)} aria-label={t("Add {{value0}} to cart", { value0: getLocalizedName(product, language) })} className={cn("h-auto gap-1 rounded-full border border-lunara-rose px-3 py-2 text-[0.72rem] hover:bg-lunara-blush hover:text-lunara-rose-strong focus-visible:ring-lunara-ink [&_svg]:size-3", added ? "bg-lunara-rose-strong text-white" : "bg-transparent text-lunara-rose-strong")}>
          <ShoppingBag size={12} /> {added ? t("Added") : t("Add")}
        </Button>
      </div>
    </div>
  </article>;
}
