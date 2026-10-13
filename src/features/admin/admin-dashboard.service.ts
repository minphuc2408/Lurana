import { salesData, categoryData, topProducts, recentOrders, statusColor } from "./data/admin-dashboard.data";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getAdminDashboardDemoData() {
  return structuredClone({ salesData, categoryData, topProducts, recentOrders, statusColor });
}
