import { useState } from "react";
import { Search, Eye, Check, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";

type OrderStatus = "All" | "Pending" | "Processing" | "In Transit" | "Delivered" | "Cancelled";

const allOrders = [
  { id: "LN-2026-1201", customer: "Maria Santos", email: "maria.santos@email.com", items: "Blush Peony × 2", total: 2550, date: "Mar 17, 2026", status: "Processing", payment: "GCash" },
  { id: "LN-2026-1200", customer: "Isabel Cruz", email: "isabel.c@email.com", items: "Lavender Dreams × 1", total: 1100, date: "Mar 17, 2026", status: "Delivered", payment: "Card" },
  { id: "LN-2026-1199", customer: "Andrea Reyes", email: "andreyr@email.com", items: "Garden Party Mix × 1", total: 1500, date: "Mar 16, 2026", status: "In Transit", payment: "GCash" },
  { id: "LN-2026-1198", customer: "Sofia Lim", email: "sofia.l@email.com", items: "White Lily × 2", total: 2350, date: "Mar 16, 2026", status: "Delivered", payment: "Card" },
  { id: "LN-2026-1197", customer: "Camille Tan", email: "camilletan@email.com", items: "Red Rose Romance × 3", total: 4500, date: "Mar 15, 2026", status: "Pending", payment: "GCash" },
  { id: "LN-2026-1196", customer: "Rachel Go", email: "r.go@email.com", items: "Pastel Tulip Set × 1", total: 900, date: "Mar 15, 2026", status: "Delivered", payment: "COD" },
  { id: "LN-2026-1195", customer: "Bea Santos", email: "beasantos@email.com", items: "Sunshine Daisy × 2", total: 1700, date: "Mar 14, 2026", status: "Cancelled", payment: "Card" },
  { id: "LN-2026-1194", customer: "Diane Uy", email: "dianeuy@email.com", items: "Wildflower Meadow × 1", total: 750, date: "Mar 14, 2026", status: "Delivered", payment: "GCash" },
  { id: "LN-2026-1193", customer: "Trisha Reyes", email: "trisha.r@email.com", items: "Blush Peony × 1, White Lily × 1", total: 2300, date: "Mar 13, 2026", status: "Processing", payment: "Card" },
  { id: "LN-2026-1192", customer: "Jenna Flores", email: "jflores@email.com", items: "Lavender Dreams × 2", total: 1900, date: "Mar 12, 2026", status: "Pending", payment: "GCash" },
];

const statusConfig: Record<string, { bg: string; color: string }> = {
  Delivered: { bg: "#EDF7EF", color: "#7A9E7E" },
  "In Transit": { bg: "#EDF3FC", color: "#5B8DD9" },
  Processing: { bg: "#FDF0F3", color: "#C17B8A" },
  Pending: { bg: "#FDF8E8", color: "#D4A020" },
  Cancelled: { bg: "#F5F0F0", color: "#9A7080" },
};

const tabs: OrderStatus[] = ["All", "Pending", "Processing", "In Transit", "Delivered", "Cancelled"];
const ITEMS_PER_PAGE = 7;

export function AdminOrders() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState(allOrders);

  const filtered = orders.filter((o) => {
    const matchTab = activeTab === "All" || o.status === activeTab;
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const tabCount = (tab: OrderStatus) =>
    tab === "All" ? orders.length : orders.filter((o) => o.status === tab).length;

  const updateStatus = (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <div className="p-6" style={{ fontFamily: "'Jost', sans-serif" }}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <p style={{ fontSize: "0.78rem", color: "#9A7080" }}>
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
        </p>
        <div className="relative">
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9A7080" }} />
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-full pl-9 pr-4 py-2.5"
            style={{ border: "1px solid #F0DDD5", backgroundColor: "white", fontSize: "0.82rem", color: "#3D2228", outline: "none", width: "260px" }}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 flex-wrap mb-5 p-1 rounded-xl" style={{ backgroundColor: "white", border: "1px solid #F0DDD5", width: "fit-content" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg"
            style={{
              background: activeTab === tab ? "#C17B8A" : "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.78rem",
              color: activeTab === tab ? "white" : "#9A7080",
              fontWeight: activeTab === tab ? 500 : 400,
              transition: "all 0.15s",
            }}
          >
            {tab}
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: activeTab === tab ? "rgba(255,255,255,0.25)" : "#F0DDD5",
                color: activeTab === tab ? "white" : "#9A7080",
                fontSize: "0.65rem",
                fontWeight: 600,
              }}
            >
              {tabCount(tab)}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#FDFBF9" }}>
                {["Order ID", "Customer", "Items", "Total", "Date", "Payment", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "0.68rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#9A7080",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#9A7080", fontSize: "0.88rem" }}>
                    No orders found
                  </td>
                </tr>
              ) : (
                paginated.map((order) => (
                  <tr key={order.id} style={{ borderTop: "1px solid #F0DDD5" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#C17B8A", fontWeight: 600 }}>{order.id}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#3D2228", fontWeight: 500 }}>{order.customer}</div>
                        <div style={{ fontSize: "0.72rem", color: "#9A7080", marginTop: "1px" }}>{order.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.82rem", color: "#6B4C55", maxWidth: "180px" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{order.items}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "0.88rem", color: "#3D2228", fontWeight: 600 }}>₱{order.total.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#9A7080", whiteSpace: "nowrap" }}>{order.date}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F9EDE9", color: "#C17B8A", fontSize: "0.7rem" }}>
                        {order.payment}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className="px-3 py-1 rounded-full" style={{ ...statusConfig[order.status], fontSize: "0.72rem", fontWeight: 500 }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div className="flex gap-1.5">
                        {order.status === "Pending" && (
                          <button
                            onClick={() => updateStatus(order.id, "Processing")}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            title="Approve"
                            style={{ backgroundColor: "#EDF7EF", border: "none", cursor: "pointer", color: "#7A9E7E" }}
                          >
                            <Check size={12} />
                          </button>
                        )}
                        {(order.status === "Processing" || order.status === "Pending") && (
                          <button
                            onClick={() => updateStatus(order.id, "Cancelled")}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            title="Cancel"
                            style={{ backgroundColor: "#FFF0F0", border: "none", cursor: "pointer", color: "#E8453C" }}
                          >
                            <X size={12} />
                          </button>
                        )}
                        {order.status === "Processing" && (
                          <button
                            onClick={() => updateStatus(order.id, "In Transit")}
                            className="px-2.5 h-7 rounded-lg flex items-center justify-center"
                            title="Mark as Shipped"
                            style={{ backgroundColor: "#EDF3FC", border: "none", cursor: "pointer", color: "#5B8DD9", fontSize: "0.65rem", whiteSpace: "nowrap" }}
                          >
                            Ship
                          </button>
                        )}
                        {order.status === "In Transit" && (
                          <button
                            onClick={() => updateStatus(order.id, "Delivered")}
                            className="px-2.5 h-7 rounded-lg flex items-center justify-center"
                            title="Mark Delivered"
                            style={{ backgroundColor: "#EDF7EF", border: "none", cursor: "pointer", color: "#7A9E7E", fontSize: "0.65rem" }}
                          >
                            Deliver
                          </button>
                        )}
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          title="View"
                          style={{ backgroundColor: "#F9EDE9", border: "none", cursor: "pointer", color: "#C17B8A" }}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #F0DDD5" }}>
            <span style={{ fontSize: "0.78rem", color: "#9A7080" }}>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ border: "1px solid #F0DDD5", backgroundColor: "white", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#D0B0B8" : "#6B4C55" }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ border: "1px solid #F0DDD5", backgroundColor: "white", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#D0B0B8" : "#6B4C55" }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
