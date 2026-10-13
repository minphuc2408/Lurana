import type { DeliveryOption, ProductSize } from "../cart.types";
export const demoCart: { productId: number; qty: number; size: ProductSize }[] = [
  { productId: 1, qty: 1, size: "Medium" }, { productId: 4, qty: 2, size: "Large" }, { productId: 5, qty: 1, size: "Small" },
];
export const deliveryOptions: DeliveryOption[] = [
  { id: "standard", label: "Standard Delivery", sublabel: "3-5 business days", price: 150 },
  { id: "express", label: "Express Delivery", sublabel: "Next day delivery", price: 300 },
  { id: "sameday", label: "Same-Day Delivery", sublabel: "Order before 12PM", price: 500 },
];
