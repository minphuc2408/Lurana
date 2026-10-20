import { useLocale, LanguageSwitcher } from "@/shared/i18n";
import { useAdminLayout } from "./hooks/useAdminLayout";
import { useAdminSidebar } from "./hooks/useAdminSidebar";
import { navItems } from "./navigation";
import { Suspense } from "react";
import { RouteLoading } from "@/shared/components/RouteLoading";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { cn } from "@/shared/lib/utils";
import { apiErrorKey } from '@/shared/api/client';
import { featureFlags } from '@/shared/config/features';
import { Outlet, Link, Navigate } from "react-router";
import { Flower, LogOut, Menu, X, Bell, ArrowLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
function SidebarContent({
  onClose,
  collapsed = false,
  onToggle
}: {
  onClose?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const { t, language } = useLocale("common");
  const {
    location,
    navigate,
    user,
    logout,
    handleLogout, signingOut, error
  } = useAdminSidebar({
    onClose
  });
  return <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("[border-bottom:1px_solid_rgba(255,255,255,0.08)]", collapsed ? "[padding:24px_12px_20px]" : "[padding:24px_20px_20px]")}>
        <div className={cn("flex items-center", collapsed ? "flex-col justify-center gap-3" : "justify-between")}>
            <Link to="/" title={t("Lunara Shop")} aria-label={t("Lunara Shop")} className="flex items-center gap-2 [text-decoration:none]">
              <Flower size={22} className="text-lunara-rose-light" />
              {!collapsed && <span className="font-display [font-size:1.5rem] text-white [letter-spacing:0.1em]">{t('Lunara Shop')}</span>}
            </Link>
            {onClose && <button type="button" onClick={onClose} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-transparent text-lunara-rose-light" aria-label={t("Close")}>
                <X size={18} />
            </button>}
            {!onClose && onToggle && <button type="button" onClick={onToggle} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-transparent text-lunara-rose-light" aria-label={t(collapsed ? "Expand menu" : "Collapse menu")} title={t(collapsed ? "Expand menu" : "Collapse menu")}>
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>}
        </div>
        {!collapsed && <span className="[font-size:0.62rem] text-lunara-rose-light [text-transform:uppercase] [letter-spacing:0.18em] [padding-left:30px] [display:block] [margin-top:2px]">{t("Admin Panel")}</span>}
      </div>

      {/* Nav */}
      <nav aria-label={t('Main Menu')} className={cn("[flex:1] [overflow-y:auto]", collapsed ? "[padding:16px_8px]" : "[padding:16px_12px]")}>
        {!collapsed && <p className="[font-size:0.62rem] text-lunara-rose-light [letter-spacing:0.18em] [text-transform:uppercase] [padding:0_12px_10px]">{t("Main Menu")}</p>}
        {navItems.map(item => {
        const active = location.pathname === item.path || item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return <Link key={item.path} to={item.path} onClick={onClose} aria-current={active ? 'page' : undefined} title={collapsed ? t(item.label) : undefined} aria-label={collapsed ? t(item.label) : undefined} className={cn("flex min-h-11 items-center rounded-xl mb-0.5 [text-decoration:none] [transition:all_0.15s]", collapsed ? "justify-center px-3 py-2.5" : "gap-3 px-3 py-2.5", active ? "bg-lunara-admin-active" : "bg-transparent", active ? "text-lunara-on-admin-active" : "text-lunara-rose-light", active ? "border-l-[3px] border-l-lunara-admin-active-border" : "[border-left:3px_solid_transparent]")}>
              <Icon size={17} />
              {!collapsed && <span className="[font-size:0.85rem] [letter-spacing:0.04em] [flex:1]">{t(item.label)}</span>}
              {!collapsed && active && <ChevronRight size={13} className="[opacity:0.5]" />}
            </Link>;
      })}
      </nav>

      {/* Divider */}
      <div className="[margin:0_12px] [height:1px] bg-[rgba(255,255,255,0.06)]" />

      {/* Back to Store */}
      <div className={cn(collapsed ? "[padding:12px_8px]" : "[padding:12px]")}>
        <Link to="/" onClick={onClose} title={t("Back to Store")} aria-label={t("Back to Store")} className={cn("flex items-center rounded-xl [text-decoration:none] text-lunara-rose-light [font-size:0.82rem] [transition:color_0.15s]", collapsed ? "justify-center px-3 py-2.5" : "gap-2 px-3 py-2.5")}>
          <ArrowLeft size={15} />
          {!collapsed && t("Back to Store")}</Link>
      </div>

      {/* User Footer */}
      <div className={cn("[border-top:1px_solid_rgba(255,255,255,0.06)]", collapsed ? "[padding:12px_8px_20px]" : "[padding:12px_16px_20px]")}>
        <div className={cn("flex items-center", collapsed ? "justify-center gap-2" : "gap-3")}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-lunara-rose-strong [font-size:0.82rem] text-white [font-weight:700]">
            {(user?.name || t('Administrator')).charAt(0)}
          </div>
          {!collapsed && <div className="flex-1 min-w-0">
            <div className="[font-size:0.82rem] text-lunara-rose-light [font-weight:500] [overflow:hidden] [text-overflow:ellipsis] [white-space:nowrap]">
              {user?.name || t('Administrator')}
            </div>
            <div className="[font-size:0.68rem] text-lunara-rose-light [margin-top:1px]">{t("Administrator")}</div>
          </div>}
          <button data-testid="admin-logout" onClick={handleLogout} disabled={signingOut} title={t("Sign Out")} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-transparent text-lunara-rose-light disabled:opacity-50" aria-label={t("Sign Out")}>
            <LogOut size={15} />
          </button>
        </div>
        {Boolean(error) && <p role="alert" className="mt-3 text-sm text-lunara-rose-light">{t(apiErrorKey(error))}</p>}
      </div>
    </div>;
}
export function AdminLayout() {
  const { t, language } = useLocale("common");
  const {
    user,
    location,
    sidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    setSidebarOpen,
    currentNav
  } = useAdminLayout();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}><div className="flex h-dvh overflow-hidden font-body">
      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex flex-col flex-shrink-0 bg-lunara-sidebar transition-[width] duration-200", sidebarCollapsed ? "[width:72px]" : "[width:240px]")}>
        <SidebarContent collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(collapsed => !collapsed)} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <DialogContent data-admin-mobile-menu showCloseButton={false} overlayClassName="md:hidden" className="inset-y-0 left-0 top-0 flex h-dvh w-60 max-w-[calc(100vw-3rem)] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-lunara-sidebar p-0 font-body sm:max-w-60 md:hidden">
          <DialogTitle className="sr-only">{t('Main Menu')}</DialogTitle>
          <DialogDescription className="sr-only">{t('Admin Panel')}</DialogDescription>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
      </DialogContent>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-lunara-admin-background">
        {/* Top Bar */}
        <header className="flex items-center justify-between gap-2 px-4 sm:px-6 flex-shrink-0 [height:62px] border-b border-b-lunara-admin-header-border bg-white">
          <div className="flex min-w-0 items-center gap-3">
            <DialogTrigger asChild><button className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-transparent text-lunara-body md:hidden" aria-label={t("Open menu")}>
              <Menu size={22} />
            </button></DialogTrigger>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg leading-tight text-lunara-ink sm:text-xl">
                {t(currentNav.label)}
              </h1>
              <p className="mt-0.5 hidden text-xs text-lunara-body sm:block">
                <Link to="/" className="text-lunara-body [text-decoration:none]">{t('Lunara Shop')}</Link>
                {" / "}
                <span className="text-lunara-rose-strong">{t(currentNav.label)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            {featureFlags.adminNotifications && <button className="relative bg-transparent [border:none] [cursor:pointer] text-lunara-body [padding:6px]" aria-label={t("Notifications")}>
              <Bell size={19} />
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-white bg-lunara-rose-strong [font-size:0.55rem] [font-weight:700]">
                3
              </span>
            </button>}

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-lunara-admin-header-border bg-lunara-blush">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-lunara-rose-strong [font-size:0.72rem] text-white [font-weight:700]">
                {(user.name || t('Administrator')).charAt(0)}
              </div>
              <span className="[font-size:0.78rem] text-lunara-ink [font-weight:500]">{user.name || t('Administrator')}</span>
              <span className="px-2 py-0.5 rounded-full bg-lunara-rose-strong text-white [font-size:0.6rem] [letter-spacing:0.08em] [text-transform:uppercase]">
                {t("admin")}</span>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<RouteLoading />}><Outlet /></Suspense>
        </main>
      </div>
    </div></Dialog>;
}
