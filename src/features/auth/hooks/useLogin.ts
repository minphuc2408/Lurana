import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "./useAuth";
import { getLoginDemoData } from "../login.service";
export function useLogin() {
  const {
    bgImage
  } = getLoginDemoData();
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Invalid credentials.");
      return;
    }

    // Redirect admin to dashboard, regular users to home
    if (result.user?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };
  return {
    showPass,
    setShowPass,
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    error,
    loading,
    handleSignIn,
    bgImage
  };
}
export type LoginModel = ReturnType<typeof useLogin>;
