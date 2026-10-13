import { salesData, categoryData, topProducts, recentOrders, statusColor } from "./data/admin-dashboard.data";
import { getProducts } from "@/features/shop";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getAdminDashboardDemoData() {
  const products = getProducts();
  const localizedProducts = topProducts.map(row => {
    const product = products.find(product => product.name === row.name);
    return { ...row, name_en: product?.name_en, name_vi: product?.name_vi };
  });
  return structuredClone({ salesData, categoryData, topProducts: localizedProducts, recentOrders, statusColor });
}
