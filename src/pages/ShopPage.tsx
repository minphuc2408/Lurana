import { ShopView, useProducts } from "@/features/shop";
import { useCart } from "@/features/cart";
export default function ShopPage() {
  const model = useProducts();
  const cart = useCart();
  return <ShopView {...model} added={cart.items.map(item => item.variantId || 0)} toggleAdd={cart.addItem} itemCount={cart.itemCount} cartError={cart.error} />;
}
