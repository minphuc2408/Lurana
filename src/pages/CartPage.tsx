import { CartView, useCheckout } from "@/features/cart";
export default function CartPage() {
  const model = useCheckout();
  return <CartView {...model} />;
}
