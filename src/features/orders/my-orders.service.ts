import { peonyImage, lilyImage, sunflowerImage, mixedImage, orders } from "./data/my-orders.data";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getMyOrdersDemoData() {
  return structuredClone({ peonyImage, lilyImage, sunflowerImage, mixedImage, orders });
}
