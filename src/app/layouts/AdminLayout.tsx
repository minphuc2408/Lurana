import { Suspense } from 'react';
import { Outlet, Link, Navigate } from 'react-router';
import { ArrowLeft, Bell, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useLocale, LanguageSwitcher } from '@/shared/i18n';
import { useTheme } from '@/shared/theme/theme-store';
import { RouteLoading } from '@/shared/components/RouteLoading';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { apiErrorKey } from '@/shared/api/client';
import { featureFlags } from '@/shared/config/features';
import { useAdminLayout } from './hooks/useAdminLayout';
import { useAdminSidebar } from './hooks/useAdminSidebar';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { navItems } from './navigation';

const sidebarButton = 'inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-lunara-admin-sidebar-muted transition-colors hover:bg-lunara-admin-sidebar-hover hover:text-lunara-admin-sidebar-foreground';

function SidebarContent({ onClose, collapsed = false, onToggle }: { onClose?: () => void; collapsed?: boolean; onToggle?: () => void }) {
  const { t } = useLocale('common');
  const { location, user, handleLogout, signingOut, error } = useAdminSidebar({ onClose });
  return <div className="flex h-full flex-col text-lunara-admin-sidebar-foreground">
    <div className={cn('border-b border-lunara-admin-sidebar-border', collapsed ? 'px-2 py-5' : 'px-5 py-5')}>
      <div className={cn('flex items-center', collapsed ? 'flex-col gap-3' : 'justify-between gap-2')}>
        <Link to="/" title={t('Lunara Shop')} aria-label={t('Lunara Shop')} className="flex min-w-0 items-center gap-2 no-underline">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={32} height={32} className="size-8 shrink-0" />
          {!collapsed && <span className="font-display text-2xl tracking-tight text-lunara-admin-sidebar-logo">{t('Lunara Shop')}</span>}
        </Link>
        {onClose ? <button type="button" onClick={onClose} className={sidebarButton} aria-label={t('Close')}><X size={18} /></button> : onToggle && <button type="button" onClick={onToggle} className={sidebarButton} aria-label={t(collapsed ? 'Expand menu' : 'Collapse menu')} title={t(collapsed ? 'Expand menu' : 'Collapse menu')}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>}
      </div>
      {!collapsed && <p className="mt-2 text-xs text-lunara-admin-sidebar-muted">{t('Admin Panel')}</p>}
    </div>
    <nav aria-label={t('Main Menu')} className={cn('flex-1 space-y-1 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')}>
      {navItems.map(item => {
        const active = location.pathname === item.path || item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return <Link key={item.path} to={item.path} onClick={onClose} aria-current={active ? 'page' : undefined} title={collapsed ? t(item.label) : undefined} aria-label={collapsed ? t(item.label) : undefined} className={cn('flex min-h-11 items-center rounded-lg px-3 py-3 text-sm no-underline transition-colors', collapsed ? 'justify-center' : 'gap-3', active ? 'bg-lunara-admin-active font-medium text-lunara-on-admin-active' : 'text-lunara-admin-sidebar-foreground hover:bg-lunara-admin-sidebar-hover')}>
          <Icon size={18} strokeWidth={1.5} className={cn('shrink-0', active && 'text-lunara-admin-active-border')} />
          {!collapsed && <><span className="min-w-0 flex-1">{t(item.label)}</span>{active && <ChevronRight size={14} aria-hidden="true" />}</>}
        </Link>;
      })}
    </nav>
    <div className={cn('border-t border-lunara-admin-sidebar-border py-3', collapsed ? 'px-2' : 'px-3')}>
      <Link to="/" onClick={onClose} title={t('Back to Store')} aria-label={t('Back to Store')} className={cn('flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-lunara-admin-sidebar-muted no-underline transition-colors hover:bg-lunara-admin-sidebar-hover hover:text-lunara-admin-sidebar-foreground', collapsed ? 'justify-center' : 'gap-3')}><ArrowLeft size={17} />{!collapsed && t('Back to Store')}</Link>
    </div>
    <div className={cn('border-t border-lunara-admin-sidebar-border py-4', collapsed ? 'px-2' : 'px-4')}>
      <div className={cn('flex items-center', collapsed ? 'flex-col gap-1' : 'gap-3')}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lunara-admin-primary text-sm font-medium text-lunara-on-admin-primary">{(user?.name || t('Administrator')).charAt(0)}</span>
        {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user?.name || t('Administrator')}</p><p className="mt-0.5 text-xs text-lunara-admin-sidebar-muted">{t('Administrator')}</p></div>}
        <button data-testid="admin-logout" onClick={handleLogout} disabled={signingOut} title={t('Sign Out')} className={cn(sidebarButton, 'disabled:opacity-50')} aria-label={t('Sign Out')}><LogOut size={17} /></button>
      </div>
      {Boolean(error) && <p role="alert" className="mt-3 text-sm text-lunara-admin-sidebar-muted">{t(apiErrorKey(error))}</p>}
    </div>
  </div>;
}

export function AdminLayout() {
  const { t } = useLocale('common');
  const { user, sidebarOpen, sidebarCollapsed, setSidebarCollapsed, setSidebarOpen, currentNav } = useAdminLayout();
  const { theme, setTheme } = useTheme();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}><div data-admin-layout className="flex h-dvh overflow-hidden font-body text-lunara-ink">
    <aside data-admin-sidebar className={cn('hidden shrink-0 flex-col border-r border-lunara-admin-sidebar-border bg-lunara-sidebar transition-[width] duration-200 motion-reduce:transition-none md:flex', sidebarCollapsed ? 'w-[76px]' : 'w-64')}>
      <SidebarContent collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(collapsed => !collapsed)} />
    </aside>
    <DialogContent data-admin-mobile-menu showCloseButton={false} overlayClassName="md:hidden" className="inset-y-0 left-0 top-0 flex h-dvh w-72 max-w-[calc(100vw-3rem)] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-lunara-sidebar p-0 font-body sm:max-w-72 md:hidden">
      <DialogTitle className="sr-only">{t('Main Menu')}</DialogTitle><DialogDescription className="sr-only">{t('Admin Panel')}</DialogDescription>
      <SidebarContent onClose={() => setSidebarOpen(false)} />
    </DialogContent>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-lunara-admin-background">
      <header data-admin-header className="flex min-h-20 shrink-0 items-center justify-between gap-2 border-b border-lunara-admin-header-border bg-lunara-admin-panel px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <DialogTrigger asChild><button type="button" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-lunara-body hover:bg-lunara-admin-soft md:hidden" aria-label={t('Open menu')}><Menu size={22} /></button></DialogTrigger>
          <div className="min-w-0"><h1 className="truncate font-display text-xl leading-tight sm:text-2xl">{t(currentNav.label)}</h1><p className="mt-1 hidden text-xs text-lunara-body sm:block"><Link to="/" className="no-underline hover:text-lunara-ink">{t('Lunara Shop')}</Link><span aria-hidden="true"> / </span>{t('Admin Panel')}</p></div>
        </div>
        <div data-header-preferences className="flex shrink-0 items-center gap-1 sm:gap-3">
          {featureFlags.adminNotifications && <button type="button" className="inline-flex size-11 items-center justify-center rounded-full text-lunara-body" aria-label={t('Notifications')}><Bell size={20} /></button>}
          <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
          <LanguageSwitcher appearance="storefront" />
        </div>
      </header>
      <main data-admin-content className="min-w-0 flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-[1600px]"><Suspense fallback={<RouteLoading />}><Outlet /></Suspense></div></main>
    </div>
  </div></Dialog>;
}
