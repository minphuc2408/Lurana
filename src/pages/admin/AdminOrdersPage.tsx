import { AdminOrdersView, useAdminOrders } from "@/features/orders";
export default function AdminOrdersPage() {
  const model = useAdminOrders();
  return <AdminOrdersView {...model} />;
}
