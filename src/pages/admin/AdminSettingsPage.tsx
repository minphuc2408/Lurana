import { AdminSettingsView, useAdminSettings } from "@/features/admin";
export default function AdminSettingsPage() {
  const model = useAdminSettings();
  return <AdminSettingsView {...model} />;
}
