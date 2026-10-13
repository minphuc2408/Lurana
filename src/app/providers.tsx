import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth";
import { CartProvider } from "@/features/cart";
export function AppProviders({
  children
}: {
  children: ReactNode;
}) {
  return <AuthProvider><CartProvider>{children}</CartProvider></AuthProvider>;
}
