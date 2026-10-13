import type { OrderStatus } from "../admin-orders.types";
export const allOrders = [{
  id: "LN-2026-1201",
  customer: "Maria Santos",
  email: "maria.santos@email.com",
  items: "Blush Peony × 2",
  total: 2550,
  date: "Mar 17, 2026",
  status: "Processing",
  payment: "GCash"
}, {
  id: "LN-2026-1200",
  customer: "Isabel Cruz",
  email: "isabel.c@email.com",
  items: "Lavender Dreams × 1",
  total: 1100,
  date: "Mar 17, 2026",
  status: "Delivered",
  payment: "Card"
}, {
  id: "LN-2026-1199",
  customer: "Andrea Reyes",
  email: "andreyr@email.com",
  items: "Garden Party Mix × 1",
  total: 1500,
  date: "Mar 16, 2026",
  status: "In Transit",
  payment: "GCash"
}, {
  id: "LN-2026-1198",
  customer: "Sofia Lim",
  email: "sofia.l@email.com",
  items: "White Lily × 2",
  total: 2350,
  date: "Mar 16, 2026",
  status: "Delivered",
  payment: "Card"
}, {
  id: "LN-2026-1197",
  customer: "Camille Tan",
  email: "camilletan@email.com",
  items: "Red Rose Romance × 3",
  total: 4500,
  date: "Mar 15, 2026",
  status: "Pending",
  payment: "GCash"
}, {
  id: "LN-2026-1196",
  customer: "Rachel Go",
  email: "r.go@email.com",
  items: "Pastel Tulip Set × 1",
  total: 900,
  date: "Mar 15, 2026",
  status: "Delivered",
  payment: "COD"
}, {
  id: "LN-2026-1195",
  customer: "Bea Santos",
  email: "beasantos@email.com",
  items: "Sunshine Daisy × 2",
  total: 1700,
  date: "Mar 14, 2026",
  status: "Cancelled",
  payment: "Card"
}, {
  id: "LN-2026-1194",
  customer: "Diane Uy",
  email: "dianeuy@email.com",
  items: "Wildflower Meadow × 1",
  total: 750,
  date: "Mar 14, 2026",
  status: "Delivered",
  payment: "GCash"
}, {
  id: "LN-2026-1193",
  customer: "Trisha Reyes",
  email: "trisha.r@email.com",
  items: "Blush Peony × 1, White Lily × 1",
  total: 2300,
  date: "Mar 13, 2026",
  status: "Processing",
  payment: "Card"
}, {
  id: "LN-2026-1192",
  customer: "Jenna Flores",
  email: "jflores@email.com",
  items: "Lavender Dreams × 2",
  total: 1900,
  date: "Mar 12, 2026",
  status: "Pending",
  payment: "GCash"
}];
export const statusConfig: Record<string, {
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
  Pending: {
    bg: "#FDF8E8",
    color: "#D4A020"
  },
  Cancelled: {
    bg: "#F5F0F0",
    color: "#9A7080"
  }
};
export const tabs: OrderStatus[] = ["All", "Pending", "Processing", "In Transit", "Delivered", "Cancelled"];
export const ITEMS_PER_PAGE = 7;
