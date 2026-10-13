import { AdminRequestsView, useAdminRequests } from "@/features/custom-order";
export default function AdminRequestsPage() {
  const model = useAdminRequests();
  return <AdminRequestsView {...model} />;
}
