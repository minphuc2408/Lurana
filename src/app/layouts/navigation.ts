import { LayoutDashboard, ShoppingBag, Package, Users, MessageSquare, Settings, Truck } from "lucide-react";
import { featureFlags } from '@/shared/config/features';
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
  icon: Truck,
  label: 'Delivery fees',
  path: '/admin/delivery-zones'
}, ...[{
  icon: Users,
  label: "Customers",
  path: "/admin/customers", enabled: featureFlags.adminCustomers
}, {
  icon: MessageSquare,
  label: "Custom Requests",
  path: "/admin/requests", enabled: featureFlags.customRequests
}, {
  icon: Settings,
  label: "Settings",
  path: "/admin/settings", enabled: featureFlags.adminSettings
}].filter(item => item.enabled)];
