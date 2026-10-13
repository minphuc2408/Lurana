import { AdminCustomersView, useAdminCustomers } from "@/features/admin";
export default function AdminCustomersPage() {
  const model = useAdminCustomers();
  return <AdminCustomersView {...model} />;
}
