import { stats } from "../data/dashboard-stats";
import { useState } from "react";
import { getAdminDashboardDemoData } from "../admin-dashboard.service";
export function useAdminDashboard() {
  const {
    salesData,
    categoryData,
    topProducts,
    recentOrders,
    statusColor
  } = getAdminDashboardDemoData();
  const [period, setPeriod] = useState("6M");
  return {
    period,
    setPeriod,
    salesData,
    categoryData,
    topProducts,
    recentOrders,
    statusColor,
    stats
  };
}
export type AdminDashboardModel = ReturnType<typeof useAdminDashboard>;
