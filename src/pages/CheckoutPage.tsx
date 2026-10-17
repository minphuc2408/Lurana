import { CheckoutView, useCheckout } from '@/features/cart';
export default function CheckoutPage() {
  const model = useCheckout();
  return <CheckoutView {...model} />;
}
