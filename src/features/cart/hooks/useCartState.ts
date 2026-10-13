import { useReducer } from "react";
import { getProduct } from "@/features/shop";
import { demoCart } from "../data/cart.data";
import { cartReducer } from "../cart.service";
import type { CartItem, ProductSize } from "../cart.types";
function makeItem(productId: number, size: ProductSize, qty = 1): CartItem | null {
  const product = getProduct(productId);
  return product ? { id: `${productId}:${size}`, productId, name: product.name, name_en: product.name_en, name_vi: product.name_vi, name_vn: product.name_vn, price: product.price, image: product.image, size, qty } : null;
}
function initialItems() {
  return demoCart.map(item => makeItem(item.productId, item.size, item.qty)).filter((item): item is CartItem => item !== null);
}
export function useCartState() {
  const [items, dispatch] = useReducer(cartReducer, undefined, initialItems);
  const addItem = (productId: number, size: ProductSize = "Medium") => { const item = makeItem(productId, size); if (item) dispatch({ type: "add", item }); };
  return { items, itemCount: items.reduce((count, item) => count + item.qty, 0), addItem,
    updateQty: (id: string, delta: number) => dispatch({ type: "quantity", id, delta }),
    removeItem: (id: string) => dispatch({ type: "remove", id }), clearCart: () => dispatch({ type: "clear" }) };
}
