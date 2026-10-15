import { AdminApiProductsView, useAdminApiProducts } from "@/features/admin";
export default function AdminStockPage() {
  const model = useAdminApiProducts();
  return <AdminApiProductsView {...model} />;
}
