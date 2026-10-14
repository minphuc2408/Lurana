import type { CartAction, CartItem, DeliveryOption } from "./cart.types.ts";
import { z } from 'zod';
import { MAX_CART_LINES, MAX_QTY_PER_LINE } from '../../../shared/constants.ts';
const persistedCart = z.object({ version: z.literal(1), lines: z.array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE) })).max(MAX_CART_LINES) });
export const CART_STORAGE_KEY = 'lunara.cart.v1';
export function readCart(storage?: Pick<Storage, 'getItem'>): { variantId: number; quantity: number }[] {
  try {
    const source = storage || (typeof localStorage !== 'undefined' ? localStorage : undefined);
    const parsed = persistedCart.safeParse(JSON.parse(source?.getItem(CART_STORAGE_KEY) || 'null'));
    if (!parsed.success) return [];
    const lines = new Map<number, number>();
    for (const line of parsed.data.lines) { const quantity = (lines.get(line.variantId) || 0) + line.quantity; if (quantity > MAX_QTY_PER_LINE) return []; lines.set(line.variantId, quantity); }
    return [...lines].map(([variantId, quantity]) => ({ variantId, quantity }));
  } catch { return []; }
}
export function saveCart(items: CartItem[], storage?: Pick<Storage, 'setItem'>) {
  try {
    const target = storage || (typeof localStorage !== 'undefined' ? localStorage : undefined);
    target?.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, lines: items.filter(item => item.variantId).map(item => ({ variantId: item.variantId, quantity: item.qty })) }));
  } catch { /* Browser storage may be disabled; the in-memory cart still works. */ }
}
export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  if (action.type === "clear") return [];
  if (action.type === 'restore') return action.items;
  if (action.type === "remove") return items.filter(item => item.id !== action.id);
  if (action.type === "quantity") {
    if (!Number.isInteger(action.delta)) return items;
    return items.map(item => item.id === action.id ? { ...item, qty: Math.min(item.maxQuantity || MAX_QTY_PER_LINE, Math.max(1, item.qty + action.delta)) } : item);
  }
  if (!Number.isInteger(action.item.qty) || action.item.qty < 1 || !Number.isFinite(action.item.price) || action.item.price < 0) return items;
  const existing = items.find(item => item.id === action.item.id);
  if (!existing && (items.length >= MAX_CART_LINES || action.item.maxQuantity === 0)) return items;
  const max = action.item.maxQuantity || MAX_QTY_PER_LINE;
  return existing ? items.map(item => item.id === action.item.id ? { ...action.item, qty: Math.min(max, item.qty + action.item.qty) } : item) : [...items, { ...action.item, qty: Math.min(max, action.item.qty) }];
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
