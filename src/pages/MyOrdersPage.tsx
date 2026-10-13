import { MyOrdersView, useMyOrders } from "@/features/orders";
export default function MyOrdersPage() {
  const model = useMyOrders();
  return <MyOrdersView {...model} />;
}
