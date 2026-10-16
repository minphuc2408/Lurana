import { createContext } from "react";
import type { CartItem, ProductSize } from "./cart.types";
export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  addItem: (productId: number, size?: ProductSize | number) => boolean;
  loading: boolean;
  error: string;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}
export const CartContext = createContext<CartContextValue | null>(null);
