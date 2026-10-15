import { AdminLoginView, useAdminLogin } from "@/features/auth";
export default function LoginPage() {
  const model = useAdminLogin();
  return <AdminLoginView {...model} />;
}
