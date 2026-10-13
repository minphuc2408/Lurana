import { DashboardRecentOrders } from "./DashboardRecentOrders";
import { DashboardActivity } from "./DashboardActivity";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardStats } from "./DashboardStats";
import { ShoppingBag, Package } from "lucide-react";
import { Link } from "react-router";
import type { AdminDashboardModel } from "../hooks/useAdminDashboard";
export function AdminDashboardView(model: AdminDashboardModel) {
  return <div className="p-6 font-body">
      {/* Welcome bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="[font-size:0.78rem] text-lunara-body">Tuesday, March 17, 2026</p>
          <h2 className="font-display [font-size:1.6rem] text-lunara-ink [font-weight:600] [margin-top:2px]">
            Good morning, Tan Kurt 🌸
          </h2>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/orders" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-lunara-body [text-decoration:none] [font-size:0.78rem] [border:1px_solid_#F0DDD5]">
            <ShoppingBag size={14} /> View Orders
          </Link>
          <Link to="/admin/stock" className="flex items-center gap-2 px-4 py-2 rounded-full bg-lunara-rose-strong text-white [text-decoration:none] [font-size:0.78rem] [border:none]">
            <Package size={14} /> Manage Stock
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <DashboardStats {...model} />

      {/* Charts Row */}
      <DashboardCharts {...model} />

      {/* Bottom Row */}
      <DashboardActivity {...model} />

      {/* Recent Orders Table */}
      <DashboardRecentOrders {...model} />
    </div>;
}
