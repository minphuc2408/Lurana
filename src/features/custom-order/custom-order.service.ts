import { occasions, colorSchemes, flowerTypes, sizes } from "./data/custom-order.data";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getCustomOrderDemoData() {
  return structuredClone({ occasions, colorSchemes, flowerTypes, sizes });
}
