import { SignupView, useSignup } from "@/features/auth";
export default function SignupPage() {
  const model = useSignup();
  return <SignupView {...model} />;
}
