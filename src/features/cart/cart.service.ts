import type { CartAction, CartItem, DeliveryOption } from "./cart.types.ts";
export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  if (action.type === "clear") return [];
  if (action.type === "remove") return items.filter(item => item.id !== action.id);
  if (action.type === "quantity") {
    if (!Number.isInteger(action.delta)) return items;
    return items.map(item => item.id === action.id ? { ...item, qty: Math.min(99, Math.max(1, item.qty + action.delta)) } : item);
  }
  if (!Number.isInteger(action.item.qty) || action.item.qty < 1 || !Number.isFinite(action.item.price) || action.item.price < 0) return items;
  const existing = items.find(item => item.id === action.item.id);
  return existing ? items.map(item => item.id === action.item.id ? { ...item, qty: Math.min(99, item.qty + action.item.qty) } : item) : [...items, { ...action.item, qty: Math.min(99, action.item.qty) }];
}
export function calculateCart(items: CartItem[], delivery: string, couponApplied: boolean, options: DeliveryOption[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = items.length ? (options.find(option => option.id === delivery)?.price ?? 150) : 0;
  const discount = couponApplied ? Math.floor(subtotal * 0.1) : 0;
  return { subtotal, deliveryFee, discount, total: subtotal + deliveryFee - discount };
}
export function validateCheckout(form: { firstName: string; lastName: string; email: string; phone: string; address: string; city: string }) {
  if (Object.values(form).some(value => !value.trim())) return "Please complete all delivery information fields.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
  return "";
}
