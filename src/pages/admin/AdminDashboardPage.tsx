import { AdminApiDashboardView, useAdminApiDashboard } from "@/features/admin";
export default function AdminDashboardPage() {
  const model = useAdminApiDashboard();
  return <AdminApiDashboardView {...model} />;
}
