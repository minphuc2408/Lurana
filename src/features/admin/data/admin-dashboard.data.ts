export const salesData = [{
  month: "Oct",
  revenue: 42000,
  orders: 38
}, {
  month: "Nov",
  revenue: 58000,
  orders: 52
}, {
  month: "Dec",
  revenue: 89000,
  orders: 78
}, {
  month: "Jan",
  revenue: 61000,
  orders: 55
}, {
  month: "Feb",
  revenue: 73000,
  orders: 65
}, {
  month: "Mar",
  revenue: 94000,
  orders: 87
}];
export const categoryData = [{
  name: "Bouquets",
  value: 45,
  color: "#C17B8A"
}, {
  name: "Arrangements",
  value: 28,
  color: "#D4A0AC"
}, {
  name: "Gift Sets",
  value: 17,
  color: "#7A9E7E"
}, {
  name: "Dried Flowers",
  value: 10,
  color: "#D4B896"
}];
export const topProducts = [{
  name: "Blush Peony Bouquet",
  sales: 127,
  revenue: "₱152,400",
  trend: "up"
}, {
  name: "Lavender Dreams",
  sales: 98,
  revenue: "₱93,100",
  trend: "up"
}, {
  name: "Garden Party Mix",
  sales: 74,
  revenue: "₱99,900",
  trend: "down"
}, {
  name: "White Lily Elegance",
  sales: 61,
  revenue: "₱67,100",
  trend: "up"
}, {
  name: "Sunshine Daisy Mix",
  sales: 55,
  revenue: "₱46,750",
  trend: "up"
}];
export const recentOrders = [{
  id: "LN-2026-1201",
  customer: "Maria Santos",
  item: "Blush Peony × 2",
  total: "₱2,550",
  status: "Processing",
  time: "2 min ago"
}, {
  id: "LN-2026-1200",
  customer: "Isabel Cruz",
  item: "Lavender Dreams × 1",
  total: "₱1,100",
  status: "Delivered",
  time: "14 min ago"
}, {
  id: "LN-2026-1199",
  customer: "Andrea Reyes",
  item: "Garden Party × 1",
  total: "₱1,500",
  status: "In Transit",
  time: "1 hr ago"
}, {
  id: "LN-2026-1198",
  customer: "Sofia Lim",
  item: "White Lily × 2",
  total: "₱2,350",
  status: "Delivered",
  time: "3 hr ago"
}];
export const statusColor: Record<string, {
  bg: string;
  color: string;
}> = {
  Delivered: {
    bg: "#EDF7EF",
    color: "#7A9E7E"
  },
  "In Transit": {
    bg: "#EDF3FC",
    color: "#5B8DD9"
  },
  Processing: {
    bg: "#FDF0F3",
    color: "#C17B8A"
  },
  Cancelled: {
    bg: "#F5F0F0",
    color: "#9A7080"
  }
};
