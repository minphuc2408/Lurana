import { useCart } from "@/features/cart";
import { useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "@/features/auth";
export function useMainLayout() {
  const {
    itemCount
  } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout
  } = useAuth();
  const navLinks = [{
    to: "/",
    label: "Home"
  }, {
    to: "/shop",
    label: "Shop"
  }, {
    to: "/request",
    label: "Custom Orders"
  }, {
    to: "/orders",
    label: "My Orders"
  }];
  const isActive = (path: string) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };
  return {
    itemCount,
    menuOpen,
    setMenuOpen,
    adminOpen,
    setAdminOpen,
    location,
    navigate,
    user,
    logout,
    navLinks,
    isActive,
    handleLogout
  };
}
