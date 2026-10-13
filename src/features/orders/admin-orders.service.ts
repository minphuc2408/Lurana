import { allOrders, statusConfig, tabs, ITEMS_PER_PAGE } from "./data/admin-orders.data";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getAdminOrdersDemoData() {
  return structuredClone({ allOrders, statusConfig, tabs, ITEMS_PER_PAGE });
}
