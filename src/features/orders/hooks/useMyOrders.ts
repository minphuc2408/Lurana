import { normalizeSearch } from "@/shared/i18n";
import { useState } from "react";
import type { OrderStatus } from "../my-orders.types";
import { getMyOrdersDemoData } from "../my-orders.service";
export function useMyOrders() {
  const {
    orders
  } = getMyOrdersDemoData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.items.some(i => [i.name, i.name_en, i.name_vi].some(name => normalizeSearch(name).includes(normalizeSearch(search))));
    const matchFilter = filter === "All" || o.status === filter;
    return matchSearch && matchFilter;
  });
  const total = (o: typeof orders[0]) => o.items.reduce((sum, i) => sum + i.price * i.qty, 0) + o.delivery;
  return {
    search,
    setSearch,
    filter,
    setFilter,
    expanded,
    setExpanded,
    filtered,
    total
  };
}
export type MyOrdersModel = ReturnType<typeof useMyOrders>;
