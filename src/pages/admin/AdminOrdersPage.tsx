import { AdminApiOrdersView, useAdminApiOrders } from "@/features/admin";
export default function AdminOrdersPage() {
  const model = useAdminApiOrders();
  return <AdminApiOrdersView {...model} />;
}
