import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { ReactNode } from "react";
export function AdminRoute({
  children
}: {
  children: ReactNode;
}) {
  const {
    user
  } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
