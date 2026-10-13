import { navItems } from "../navigation";
import { useLocation } from "react-router";
import { useState } from "react";
import { useAuth } from "@/features/auth";
export function useAdminLayout() {
  const {
    user
  } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentNav = navItems.find(n => location.pathname === n.path || n.path !== "/admin/dashboard" && location.pathname.startsWith(n.path)) ?? navItems[0];
  return {
    user,
    location,
    sidebarOpen,
    setSidebarOpen,
    currentNav
  };
}
