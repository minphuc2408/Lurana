import { useState } from "react";
import { Search, Mail, Package, UserCheck, UserX, Star } from "lucide-react";

const customers = [
  { id: 1, name: "Maria Santos", email: "mariasantos@sample.com", phone: "+63 912 345 6789", orders: 12, spent: 18400, lastOrder: "Mar 17, 2026", joined: "Jan 2025", status: "Active", vip: true },
  { id: 2, name: "Isabel Cruz", email: "isabel.c@email.com", phone: "+63 917 234 5678", orders: 8, spent: 9200, lastOrder: "Mar 17, 2026", joined: "Mar 2025", status: "Active", vip: false },
  { id: 3, name: "Andrea Reyes", email: "andreyr@email.com", phone: "+63 918 345 6790", orders: 5, spent: 6750, lastOrder: "Mar 16, 2026", joined: "Jun 2025", status: "Active", vip: false },
  { id: 4, name: "Sofia Lim", email: "sofia.l@email.com", phone: "+63 919 456 7891", orders: 15, spent: 22100, lastOrder: "Mar 16, 2026", joined: "Nov 2024", status: "Active", vip: true },
  { id: 5, name: "Camille Tan", email: "camilletan@email.com", phone: "+63 916 567 8902", orders: 3, spent: 4500, lastOrder: "Mar 15, 2026", joined: "Jan 2026", status: "Active", vip: false },
  { id: 6, name: "Rachel Go", email: "r.go@email.com", phone: "+63 915 678 9013", orders: 7, spent: 8300, lastOrder: "Mar 15, 2026", joined: "Sep 2025", status: "Active", vip: false },
  { id: 7, name: "Bea Santos", email: "beasantos@email.com", phone: "+63 914 789 0124", orders: 2, spent: 2500, lastOrder: "Mar 14, 2026", joined: "Feb 2026", status: "Inactive", vip: false },
  { id: 8, name: "Diane Uy", email: "dianeuy@email.com", phone: "+63 913 890 1235", orders: 10, spent: 13600, lastOrder: "Mar 14, 2026", joined: "Apr 2025", status: "Active", vip: true },
  { id: 9, name: "Trisha Reyes", email: "trisha.r@email.com", phone: "+63 912 901 2346", orders: 6, spent: 7800, lastOrder: "Mar 13, 2026", joined: "Jul 2025", status: "Active", vip: false },
  { id: 10, name: "Jenna Flores", email: "jflores@email.com", phone: "+63 911 012 3457", orders: 4, spent: 5200, lastOrder: "Mar 12, 2026", joined: "Dec 2025", status: "Active", vip: false },
];

const avatarColors = ["#C17B8A", "#7A9E7E", "#5B8DD9", "#D4A020", "#9B6BA8", "#E87A5B"];

export function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive" | "VIP">("All");

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "VIP" && c.vip) ||
      c.status === filter;
    return matchSearch && matchFilter;
  });

  const totalSpent = customers.reduce((a, c) => a + c.spent, 0);
  const totalOrders = customers.reduce((a, c) => a + c.orders, 0);
  const vipCount = customers.filter((c) => c.vip).length;
  const activeCount = customers.filter((c) => c.status === "Active").length;

  return (
    <div className="p-6" style={{ fontFamily: "'Jost', sans-serif" }}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Customers", value: customers.length, icon: <UserCheck size={18} />, color: "#5B8DD9", bg: "#EDF3FC" },
          { label: "Active Customers", value: activeCount, icon: <UserCheck size={18} />, color: "#7A9E7E", bg: "#EDF7EF" },
          { label: "VIP Members", value: vipCount, icon: <Star size={18} />, color: "#D4A020", bg: "#FDF8E8" },
          { label: "Total Revenue", value: `₱${totalSpent.toLocaleString()}`, icon: <Package size={18} />, color: "#C17B8A", bg: "#FDF0F3" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.7rem", fontWeight: 600, color: "#3D2228", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#6B4C55", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "white", border: "1px solid #F0DDD5", width: "fit-content" }}>
          {(["All", "Active", "Inactive", "VIP"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-lg"
              style={{
                background: filter === f ? "#C17B8A" : "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.78rem",
                color: filter === f ? "white" : "#9A7080",
                fontWeight: filter === f ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9A7080" }} />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full pl-9 pr-4 py-2.5"
            style={{ border: "1px solid #F0DDD5", backgroundColor: "white", fontSize: "0.82rem", color: "#3D2228", outline: "none", width: "240px" }}
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#FDFBF9" }}>
                {["Customer", "Contact", "Orders", "Total Spent", "Last Order", "Joined", "Status", "Actions"].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#9A7080", fontSize: "0.88rem" }}>
                    No customers found
                  </td>
                </tr>
              ) : (
                filtered.map((customer, idx) => (
                  <tr key={customer.id} style={{ borderTop: "1px solid #F0DDD5" }}>
                    {/* Customer */}
                    <td style={{ padding: "14px 16px" }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: avatarColors[idx % avatarColors.length],
                            fontSize: "0.82rem",
                            color: "white",
                            fontWeight: 700,
                          }}
                        >
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ fontSize: "0.88rem", color: "#3D2228", fontWeight: 500 }}>{customer.name}</span>
                            {customer.vip && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FDF8E8", color: "#D4A020", fontSize: "0.6rem" }}>
                                <Star size={9} fill="#D4A020" /> VIP
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#9A7080", marginTop: "1px" }}>#{customer.id.toString().padStart(4, "0")}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.8rem", color: "#6B4C55" }}>{customer.email}</div>
                      <div style={{ fontSize: "0.72rem", color: "#9A7080", marginTop: "2px" }}>{customer.phone}</div>
                    </td>

                    {/* Orders */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                        style={{ backgroundColor: "#F9EDE9", color: "#C17B8A", fontSize: "0.85rem", fontWeight: 600 }}
                      >
                        {customer.orders}
                      </span>
                    </td>

                    {/* Spent */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "0.88rem", color: "#3D2228", fontWeight: 600 }}>₱{customer.spent.toLocaleString()}</span>
                    </td>

                    {/* Last Order */}
                    <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#9A7080", whiteSpace: "nowrap" }}>
                      {customer.lastOrder}
                    </td>

                    {/* Joined */}
                    <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#9A7080" }}>
                      {customer.joined}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: customer.status === "Active" ? "#EDF7EF" : "#F5F0F0",
                          color: customer.status === "Active" ? "#7A9E7E" : "#9A7080",
                          fontSize: "0.72rem",
                          fontWeight: 500,
                        }}
                      >
                        {customer.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px" }}>
                      <div className="flex gap-1.5">
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          title="Send Email"
                          style={{ backgroundColor: "#F9EDE9", border: "none", cursor: "pointer", color: "#C17B8A" }}
                        >
                          <Mail size={12} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          title="View Orders"
                          style={{ backgroundColor: "#F9EDE9", border: "none", cursor: "pointer", color: "#C17B8A" }}
                        >
                          <Package size={12} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          title={customer.status === "Active" ? "Deactivate" : "Activate"}
                          style={{
                            backgroundColor: customer.status === "Active" ? "#FFF0F0" : "#EDF7EF",
                            border: "none",
                            cursor: "pointer",
                            color: customer.status === "Active" ? "#E8453C" : "#7A9E7E",
                          }}
                        >
                          {customer.status === "Active" ? <UserX size={12} /> : <UserCheck size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #F0DDD5" }}>
          <span style={{ fontSize: "0.78rem", color: "#9A7080" }}>
            Showing {filtered.length} of {customers.length} customers
          </span>
          <span style={{ fontSize: "0.78rem", color: "#9A7080" }}>
            Total orders: <strong style={{ color: "#3D2228" }}>{totalOrders}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
