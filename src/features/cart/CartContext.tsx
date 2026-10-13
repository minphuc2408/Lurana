import type { ReactNode } from "react";
import { CartContext } from "./cart.context";
import { useCartState } from "./hooks/useCartState";
export function CartProvider({
  children
}: {
  children: ReactNode;
}) {
  const cart = useCartState();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}
