import { AdminDashboardView, useAdminDashboard } from "@/features/admin";
export default function AdminDashboardPage() {
  const model = useAdminDashboard();
  return <AdminDashboardView {...model} />;
}
