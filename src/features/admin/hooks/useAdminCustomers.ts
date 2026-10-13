import { useState } from "react";
import { getAdminCustomersDemoData } from "../admin-customers.service";
export function useAdminCustomers() {
  const {
    customers,
    avatarColors
  } = getAdminCustomersDemoData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive" | "VIP">("All");
  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || filter === "VIP" && c.vip || c.status === filter;
    return matchSearch && matchFilter;
  });
  const totalSpent = customers.reduce((a, c) => a + c.spent, 0);
  const totalOrders = customers.reduce((a, c) => a + c.orders, 0);
  const vipCount = customers.filter(c => c.vip).length;
  const activeCount = customers.filter(c => c.status === "Active").length;
  return {
    search,
    setSearch,
    filter,
    setFilter,
    filtered,
    totalSpent,
    totalOrders,
    vipCount,
    activeCount,
    customers,
    avatarColors
  };
}
export type AdminCustomersModel = ReturnType<typeof useAdminCustomers>;
