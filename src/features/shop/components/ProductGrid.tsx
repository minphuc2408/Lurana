import { useLocale } from "@/shared/i18n";
import type { Product } from "../shop.types";
import { ProductCard } from "./ProductCard";
interface ProductGridProps {
  products: Product[];
  liked?: number[];
  added: number[];
  onLike?: (id: number) => void;
  onAdd: (id: number, variantId?: number) => void;
  selectedVariants?: Record<number, number>;
  onSelectVariant?: (productId: number, variantId: number) => void;
}
export function ProductGrid({
  products,
  liked,
  added,
  onLike,
  onAdd,
  selectedVariants,
  onSelectVariant
}: ProductGridProps) {
  const { t } = useLocale("shop");
  if (!products.length) return <div className="py-20 text-center text-lunara-body" role="status">{t("No flowers found matching your search.")}</div>;
  return <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
    {products.map(product => <ProductCard key={product.id} product={product} liked={false} added={added.includes(selectedVariants?.[product.id] || product.variants?.find(variant => variant.in_stock)?.id || 0)} onLike={onLike} onAdd={onAdd} selectedVariantId={selectedVariants?.[product.id]} onSelectVariant={onSelectVariant} />)}
  </div>;
}
