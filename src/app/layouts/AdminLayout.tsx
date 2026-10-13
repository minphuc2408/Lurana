import { useAdminLayout } from "./hooks/useAdminLayout";
import { useAdminSidebar } from "./hooks/useAdminSidebar";
import { navItems } from "./navigation";
import { Suspense } from "react";
import { RouteLoading } from "@/shared/components/RouteLoading";
import { cn } from "@/shared/lib/utils";
import { Outlet, Link, Navigate } from "react-router";
import { Flower, LogOut, Menu, X, Bell, ArrowLeft, ChevronRight } from "lucide-react";
function SidebarContent({
  onClose
}: {
  onClose?: () => void;
}) {
  const {
    location,
    navigate,
    user,
    logout,
    handleLogout
  } = useAdminSidebar({
    onClose
  });
  return <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="[padding:24px_20px_20px] [border-bottom:1px_solid_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 [text-decoration:none]">
            <Flower size={22} className="text-lunara-rose-light" />
            <span className="font-display [font-size:1.5rem] text-white [letter-spacing:0.1em]">
              lunara
            </span>
          </Link>
          {onClose && <button onClick={onClose} className="bg-transparent [border:none] [cursor:pointer] text-lunara-rose-light" aria-label="Close">
              <X size={18} />
            </button>}
        </div>
        <span className="[font-size:0.62rem] text-lunara-rose-light [text-transform:uppercase] [letter-spacing:0.18em] [padding-left:30px] [display:block] [margin-top:2px]">
          Admin Panel
        </span>
      </div>

      {/* Nav */}
      <nav className="[padding:16px_12px] [flex:1] [overflow-y:auto]">
        <p className="[font-size:0.62rem] text-lunara-rose-light [letter-spacing:0.18em] [text-transform:uppercase] [padding:0_12px_10px]">
          Main Menu
        </p>
        {navItems.map(item => {
        const active = location.pathname === item.path || item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return <Link key={item.path} to={item.path} onClick={onClose} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 [text-decoration:none] [transition:all_0.15s]", active ? "bg-[rgba(193,123,138,0.18)]" : "bg-transparent", active ? "text-[#E8B0BC]" : "text-lunara-rose-light", active ? "[border-left:3px_solid_#C17B8A]" : "[border-left:3px_solid_transparent]")}>
              <Icon size={17} />
              <span className="[font-size:0.85rem] [letter-spacing:0.04em] [flex:1]">{item.label}</span>
              {active && <ChevronRight size={13} className="[opacity:0.5]" />}
            </Link>;
      })}
      </nav>

      {/* Divider */}
      <div className="[margin:0_12px] [height:1px] bg-[rgba(255,255,255,0.06)]" />

      {/* Back to Store */}
      <div className="[padding:12px]">
        <Link to="/" onClick={onClose} className="flex items-center gap-2 px-3 py-2.5 rounded-xl [text-decoration:none] text-lunara-rose-light [font-size:0.82rem] [transition:color_0.15s]">
          <ArrowLeft size={15} />
          Back to Store
        </Link>
      </div>

      {/* User Footer */}
      <div className="[padding:12px_16px_20px] [border-top:1px_solid_rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-lunara-rose-strong [font-size:0.82rem] text-white [font-weight:700]">
            {user?.name?.charAt(0) ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="[font-size:0.82rem] text-lunara-rose-light [font-weight:500] [overflow:hidden] [text-overflow:ellipsis] [white-space:nowrap]">
              {user?.name}
            </div>
            <div className="[font-size:0.68rem] text-lunara-rose-light [margin-top:1px]">Administrator</div>
          </div>
          <button onClick={handleLogout} title="Sign Out" className="bg-transparent [border:none] [cursor:pointer] text-lunara-rose-light [padding:4px] [flex-shrink:0]" aria-label="Sign Out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>;
}
export function AdminLayout() {
  const {
    user,
    location,
    sidebarOpen,
    setSidebarOpen,
    currentNav
  } = useAdminLayout();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <div className="flex h-screen overflow-hidden font-body">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col flex-shrink-0 [width:240px] bg-lunara-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className="flex flex-col flex-shrink-0 [width:240px] bg-lunara-sidebar">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
          <div onClick={() => setSidebarOpen(false)} className="flex-1 bg-[rgba(0,0,0,0.55)] [backdrop-filter:blur(2px)]" />
        </div>}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-lunara-admin-background">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 flex-shrink-0 [height:62px] bg-white [border-bottom:1px_solid_#F0DDD5]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden bg-transparent [border:none] [cursor:pointer] text-lunara-body [padding:4px]" aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="font-display [font-size:1.25rem] text-lunara-ink [font-weight:600] [line-height:1.2]">
                {currentNav.label}
              </h1>
              <p className="[font-size:0.68rem] text-lunara-body [margin-top:1px]">
                <Link to="/" className="text-lunara-body [text-decoration:none]">Lunara</Link>
                {" / "}
                <span className="text-lunara-rose-strong">{currentNav.label}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative bg-transparent [border:none] [cursor:pointer] text-lunara-body [padding:6px]" aria-label="Notifications">
              <Bell size={19} />
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-white bg-lunara-rose-strong [font-size:0.55rem] [font-weight:700]">
                3
              </span>
            </button>

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-lunara-blush [border:1px_solid_#F0DDD5]">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-lunara-rose-strong [font-size:0.72rem] text-white [font-weight:700]">
                {user.name.charAt(0)}
              </div>
              <span className="[font-size:0.78rem] text-lunara-ink [font-weight:500]">{user.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-lunara-rose-strong text-white [font-size:0.6rem] [letter-spacing:0.08em] [text-transform:uppercase]">
                admin
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<RouteLoading />}><Outlet /></Suspense>
        </main>
      </div>
    </div>;
}
