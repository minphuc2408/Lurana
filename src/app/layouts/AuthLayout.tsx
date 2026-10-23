import { Outlet } from "react-router";
import { LanguageSwitcher } from "@/shared/i18n";
import { useFieldFocus } from '@/shared/hooks/useFieldFocus';

export function AuthLayout() {
  useFieldFocus({ documentScope: true });
  return <div data-admin-auth className="relative">
    <div data-header-preferences className="absolute right-5 top-5 z-20 flex items-center gap-2 sm:right-8 sm:top-8"><LanguageSwitcher appearance="storefront" /></div>
    <Outlet />
  </div>;
}
