import { Outlet } from "react-router";
import { LanguageSwitcher } from "@/shared/i18n";
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { useTheme } from '@/shared/theme/theme-store';

export function AuthLayout() {
  const { theme, setTheme } = useTheme();
  return <div className="relative">
    <div data-header-preferences className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6"><ThemeSwitcher theme={theme} onThemeChange={setTheme} /><LanguageSwitcher appearance="storefront" /></div>
    <Outlet />
  </div>;
}
