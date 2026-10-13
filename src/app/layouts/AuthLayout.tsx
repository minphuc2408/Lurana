import { Outlet } from "react-router";
import { LanguageSwitcher } from "@/shared/i18n";

export function AuthLayout() {
  return <div className="relative">
    <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6"><LanguageSwitcher /></div>
    <Outlet />
  </div>;
}
