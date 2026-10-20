import { navItems } from "../navigation";
import { useLocation } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
export function useAdminLayout() {
  const {
    user
  } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) setSidebarOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  const currentNav = navItems.find(n => location.pathname === n.path || n.path !== "/admin/dashboard" && location.pathname.startsWith(n.path)) ?? navItems[0];
  return {
    user,
    location,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentNav
  };
}
