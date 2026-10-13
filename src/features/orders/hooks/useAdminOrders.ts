import { useState } from "react";
import type { OrderStatus } from "../admin-orders.types";
import { getAdminOrdersDemoData } from "../admin-orders.service";
export function useAdminOrders() {
  const {
    allOrders,
    statusConfig,
    tabs,
    ITEMS_PER_PAGE
  } = getAdminOrdersDemoData();
  const [activeTab, setActiveTab] = useState<OrderStatus>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState(allOrders);
  const filtered = orders.filter(o => {
    const matchTab = activeTab === "All" || o.status === activeTab;
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const tabCount = (tab: OrderStatus) => tab === "All" ? orders.length : orders.filter(o => o.status === tab).length;
  const updateStatus = (id: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? {
      ...o,
      status
    } : o));
  };
  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    page,
    setPage,
    filtered,
    totalPages,
    paginated,
    tabCount,
    updateStatus,
    statusConfig,
    tabs
  };
}
export type AdminOrdersModel = ReturnType<typeof useAdminOrders>;
