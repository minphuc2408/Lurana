import { LoginView, useLogin } from "@/features/auth";
export default function LoginPage() {
  const model = useLogin();
  return <LoginView {...model} />;
}
