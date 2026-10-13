import { useLocale } from "@/shared/i18n";
import type { Product } from "../shop.types";
import { ProductCard } from "./ProductCard";
interface ProductGridProps {
  products: Product[];
  liked: number[];
  added: number[];
  onLike: (id: number) => void;
  onAdd: (id: number) => void;
}
export function ProductGrid({
  products,
  liked,
  added,
  onLike,
  onAdd
}: ProductGridProps) {
  const { t } = useLocale("shop");
  if (!products.length) return <div className="py-20 text-center text-lunara-body" role="status">{t("No flowers found matching your search.")}</div>;
  return <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
    {products.map(product => <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} added={added.includes(product.id)} onLike={onLike} onAdd={onAdd} />)}
  </div>;
}
