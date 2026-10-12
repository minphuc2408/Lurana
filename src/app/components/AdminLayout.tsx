import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Users, MessageSquare,
  Settings, Flower, LogOut, Menu, X, Bell, ArrowLeft, ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
  { icon: Package, label: "Products", path: "/admin/stock" },
  { icon: Users, label: "Customers", path: "/admin/customers" },
  { icon: MessageSquare, label: "Custom Requests", path: "/admin/requests" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <Flower size={22} style={{ color: "#D4A0AC" }} />
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "white", letterSpacing: "0.1em" }}>
              lunara
            </span>
          </Link>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6A4050" }}>
              <X size={18} />
            </button>
          )}
        </div>
        <span
          style={{
            fontSize: "0.62rem",
            color: "#6A4050",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            paddingLeft: "30px",
            display: "block",
            marginTop: "2px",
          }}
        >
          Admin Panel
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
        <p style={{ fontSize: "0.62rem", color: "#4A2830", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0 12px 10px" }}>
          Main Menu
        </p>
        {navItems.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5"
              style={{
                textDecoration: "none",
                backgroundColor: active ? "rgba(193,123,138,0.18)" : "transparent",
                color: active ? "#E8B0BC" : "#6A4050",
                borderLeft: `3px solid ${active ? "#C17B8A" : "transparent"}`,
                transition: "all 0.15s",
              }}
            >
              <Icon size={17} />
              <span style={{ fontSize: "0.85rem", letterSpacing: "0.04em", flex: 1 }}>{item.label}</span>
              {active && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ margin: "0 12px", height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />

      {/* Back to Store */}
      <div style={{ padding: "12px" }}>
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{
            textDecoration: "none",
            color: "#4A2830",
            fontSize: "0.82rem",
            transition: "color 0.15s",
          }}
        >
          <ArrowLeft size={15} />
          Back to Store
        </Link>
      </div>

      {/* User Footer */}
      <div style={{ padding: "12px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#C17B8A", fontSize: "0.82rem", color: "white", fontWeight: 700 }}
          >
            {user?.name?.charAt(0) ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div
              style={{
                fontSize: "0.82rem",
                color: "#D4A0AC",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#4A2830", marginTop: "1px" }}>Administrator</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#4A2830", padding: "4px", flexShrink: 0 }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const currentNav =
    navItems.find(
      (n) =>
        location.pathname === n.path ||
        (n.path !== "/admin/dashboard" && location.pathname.startsWith(n.path))
    ) ?? navItems[0];

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Jost', sans-serif" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0"
        style={{ width: "240px", backgroundColor: "#1A0D12" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className="flex flex-col flex-shrink-0" style={{ width: "240px", backgroundColor: "#1A0D12" }}>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
          <div
            className="flex-1"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#F8F4F2" }}>
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: "62px", backgroundColor: "white", borderBottom: "1px solid #F0DDD5" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B4C55", padding: "4px" }}
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", color: "#3D2228", fontWeight: 600, lineHeight: 1.2 }}>
                {currentNav.label}
              </h1>
              <p style={{ fontSize: "0.68rem", color: "#B090A0", marginTop: "1px" }}>
                <Link to="/" style={{ color: "#B090A0", textDecoration: "none" }}>Lunara</Link>
                {" / "}
                <span style={{ color: "#C17B8A" }}>{currentNav.label}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              className="relative"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9A7080", padding: "6px" }}
            >
              <Bell size={19} />
              <span
                className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "#C17B8A", fontSize: "0.55rem", fontWeight: 700 }}
              >
                3
              </span>
            </button>

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F9EDE9", border: "1px solid #F0DDD5" }}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#C17B8A", fontSize: "0.72rem", color: "white", fontWeight: 700 }}
              >
                {user.name.charAt(0)}
              </div>
              <span style={{ fontSize: "0.78rem", color: "#3D2228", fontWeight: 500 }}>{user.name}</span>
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#C17B8A", color: "white", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                admin
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
