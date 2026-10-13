import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/shared/i18n/config";
import { AuthProvider } from "@/features/auth";
import { CartProvider } from "@/features/cart";
export function AppProviders({
  children
}: {
  children: ReactNode;
}) {
  return <I18nextProvider i18n={i18n}><AuthProvider><CartProvider>{children}</CartProvider></AuthProvider></I18nextProvider>;
}
