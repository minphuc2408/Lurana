import { LayoutDashboard, ShoppingBag, Package, Users, MessageSquare, Settings } from "lucide-react";
export const navItems = [{
  icon: LayoutDashboard,
  label: "Dashboard",
  path: "/admin/dashboard"
}, {
  icon: ShoppingBag,
  label: "Orders",
  path: "/admin/orders"
}, {
  icon: Package,
  label: "Products",
  path: "/admin/stock"
}, {
  icon: Users,
  label: "Customers",
  path: "/admin/customers"
}, {
  icon: MessageSquare,
  label: "Custom Requests",
  path: "/admin/requests"
}, {
  icon: Settings,
  label: "Settings",
  path: "/admin/settings"
}];
