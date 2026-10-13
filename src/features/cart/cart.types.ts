export type Step = "cart" | "checkout" | "confirmation";
export type ProductSize = "Small" | "Medium" | "Large";
import type { LocalizedNameFields } from "@/shared/i18n/language";
export interface CartItem extends LocalizedNameFields {
  id: string;
  productId: number;
  name: string;
  price: number;
  qty: number;
  image: string;
  size: ProductSize;
}
export interface DeliveryOption { id: string; label: string; sublabel: string; price: number; }
export interface CheckoutForm { firstName: string; lastName: string; email: string; phone: string; address: string; city: string; notes: string; }
export type CartAction = { type: "add"; item: CartItem } | { type: "quantity"; id: string; delta: number } | { type: "remove"; id: string } | { type: "clear" };
