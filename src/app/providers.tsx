import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/shared/i18n/config";
import { CartProvider } from "@/features/cart";
import { CatalogProvider } from '@/features/shop';
export function AppProviders({
  children
}: {
  children: ReactNode;
}) {
  return <I18nextProvider i18n={i18n}><CatalogProvider><CartProvider>{children}</CartProvider></CatalogProvider></I18nextProvider>;
}
