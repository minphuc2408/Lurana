import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, ShoppingBag, Users, Package, ArrowUp, ArrowDown, Eye, DollarSign, RefreshCw } from "lucide-react";
import { Link } from "react-router";

const salesData = [
  { month: "Oct", revenue: 42000, orders: 38 },
  { month: "Nov", revenue: 58000, orders: 52 },
  { month: "Dec", revenue: 89000, orders: 78 },
  { month: "Jan", revenue: 61000, orders: 55 },
  { month: "Feb", revenue: 73000, orders: 65 },
  { month: "Mar", revenue: 94000, orders: 87 },
];

const categoryData = [
  { name: "Bouquets", value: 45, color: "#C17B8A" },
  { name: "Arrangements", value: 28, color: "#D4A0AC" },
  { name: "Gift Sets", value: 17, color: "#7A9E7E" },
  { name: "Dried Flowers", value: 10, color: "#D4B896" },
];

const topProducts = [
  { name: "Blush Peony Bouquet", sales: 127, revenue: "₱152,400", trend: "up" },
  { name: "Lavender Dreams", sales: 98, revenue: "₱93,100", trend: "up" },
  { name: "Garden Party Mix", sales: 74, revenue: "₱99,900", trend: "down" },
  { name: "White Lily Elegance", sales: 61, revenue: "₱67,100", trend: "up" },
  { name: "Sunshine Daisy Mix", sales: 55, revenue: "₱46,750", trend: "up" },
];

const recentOrders = [
  { id: "LN-2026-1201", customer: "Maria Santos", item: "Blush Peony × 2", total: "₱2,550", status: "Processing", time: "2 min ago" },
  { id: "LN-2026-1200", customer: "Isabel Cruz", item: "Lavender Dreams × 1", total: "₱1,100", status: "Delivered", time: "14 min ago" },
  { id: "LN-2026-1199", customer: "Andrea Reyes", item: "Garden Party × 1", total: "₱1,500", status: "In Transit", time: "1 hr ago" },
  { id: "LN-2026-1198", customer: "Sofia Lim", item: "White Lily × 2", total: "₱2,350", status: "Delivered", time: "3 hr ago" },
];

const stats = [
  { label: "Total Revenue", value: "₱417,000", sub: "+18% from last month", trend: "up", icon: <DollarSign size={20} />, color: "#C17B8A", bg: "#FDF0F3" },
  { label: "Total Orders", value: "375", sub: "+12% from last month", trend: "up", icon: <ShoppingBag size={20} />, color: "#7A9E7E", bg: "#EDF7EF" },
  { label: "Total Customers", value: "248", sub: "+8% from last month", trend: "up", icon: <Users size={20} />, color: "#5B8DD9", bg: "#EDF3FC" },
  { label: "Pending Orders", value: "23", sub: "4 need attention", trend: "down", icon: <Package size={20} />, color: "#D4A020", bg: "#FDF8E8" },
];

const statusColor: Record<string, { bg: string; color: string }> = {
  Delivered: { bg: "#EDF7EF", color: "#7A9E7E" },
  "In Transit": { bg: "#EDF3FC", color: "#5B8DD9" },
  Processing: { bg: "#FDF0F3", color: "#C17B8A" },
  Cancelled: { bg: "#F5F0F0", color: "#9A7080" },
};

export function Dashboard() {
  const [period, setPeriod] = useState("6M");

  return (
    <div className="p-6" style={{ fontFamily: "'Jost', sans-serif" }}>
      {/* Welcome bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={{ fontSize: "0.78rem", color: "#9A7080" }}>Tuesday, March 17, 2026</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", color: "#3D2228", fontWeight: 600, marginTop: "2px" }}>
            Good morning, Tan Kurt 🌸
          </h2>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/orders"
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: "white", color: "#6B4C55", textDecoration: "none", fontSize: "0.78rem", border: "1px solid #F0DDD5" }}
          >
            <ShoppingBag size={14} /> View Orders
          </Link>
          <Link
            to="/admin/stock"
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: "#C17B8A", color: "white", textDecoration: "none", fontSize: "0.78rem", border: "none" }}
          >
            <Package size={14} /> Manage Stock
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: stat.trend === "up" ? "#EDF7EF" : "#FFF0EE", color: stat.trend === "up" ? "#7A9E7E" : "#E87A5B", fontSize: "0.7rem" }}
              >
                {stat.trend === "up" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {stat.trend === "up" ? "Up" : "Down"}
              </div>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 600, color: "#3D2228", lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#6B4C55", marginTop: "4px" }}>{stat.label}</div>
            <div style={{ fontSize: "0.7rem", color: stat.trend === "up" ? "#7A9E7E" : "#E87A5B", marginTop: "3px" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", color: "#3D2228" }}>Revenue Overview</h2>
              <p style={{ fontSize: "0.72rem", color: "#9A7080", marginTop: "2px" }}>Monthly revenue trends</p>
            </div>
            <div className="flex gap-1">
              {["3M", "6M", "1Y"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1 rounded-full"
                  style={{
                    border: `1px solid ${period === p ? "#C17B8A" : "#F0DDD5"}`,
                    backgroundColor: period === p ? "#C17B8A" : "transparent",
                    color: period === p ? "white" : "#9A7080",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C17B8A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C17B8A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9A7080" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9A7080" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "white", border: "1px solid #F0DDD5", borderRadius: "12px", fontSize: "0.8rem" }}
                formatter={(value) => [`₱${Number(value).toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#C17B8A" strokeWidth={2.5} fill="url(#colorRev)" dot={{ fill: "#C17B8A", strokeWidth: 0, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", color: "#3D2228", marginBottom: "4px" }}>Sales by Category</h2>
          <p style={{ fontSize: "0.72rem", color: "#9A7080", marginBottom: "12px" }}>Product distribution</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #F0DDD5", borderRadius: "10px", fontSize: "0.8rem" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span style={{ fontSize: "0.78rem", color: "#6B4C55" }}>{cat.name}</span>
                </div>
                <span style={{ fontSize: "0.78rem", color: "#3D2228", fontWeight: 500 }}>{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Orders Chart */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", color: "#3D2228", marginBottom: "4px" }}>Monthly Orders</h2>
          <p style={{ fontSize: "0.72rem", color: "#9A7080", marginBottom: "16px" }}>Order volume over time</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9A7080" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9A7080" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #F0DDD5", borderRadius: "12px", fontSize: "0.8rem" }} />
              <Bar dataKey="orders" fill="#D4A0AC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", color: "#3D2228", marginBottom: "4px" }}>Top Products</h2>
          <p style={{ fontSize: "0.72rem", color: "#9A7080", marginBottom: "14px" }}>Best performing arrangements</p>
          <div className="flex flex-col gap-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: i === 0 ? "#F9EDE9" : "#F5F0F2", fontSize: "0.72rem", color: "#C17B8A", fontWeight: 600 }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: "0.85rem", color: "#3D2228", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1 rounded-full" style={{ width: `${(p.sales / 130) * 100}%`, backgroundColor: "#D4A0AC", maxWidth: "100px" }} />
                    <span style={{ fontSize: "0.68rem", color: "#9A7080" }}>{p.sales} sold</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span style={{ fontSize: "0.85rem", color: "#C17B8A", fontWeight: 500 }}>{p.revenue}</span>
                  {p.trend === "up" ? <ArrowUp size={11} style={{ color: "#7A9E7E" }} /> : <ArrowDown size={11} style={{ color: "#E87A5B" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #F0DDD5" }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", color: "#3D2228" }}>Recent Orders</h2>
            <p style={{ fontSize: "0.72rem", color: "#9A7080", marginTop: "2px" }}>Latest incoming orders</p>
          </div>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1 px-4 py-2 rounded-full"
            style={{ fontSize: "0.78rem", color: "#C17B8A", textDecoration: "none", border: "1px solid #F0DDD5", backgroundColor: "#F9EDE9" }}
          >
            <Eye size={13} /> View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#FDFBF9" }}>
                {["Order ID", "Customer", "Items", "Total", "Status", "Time"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#9A7080",
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={{ borderTop: "1px solid #F0DDD5" }}>
                  <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "#C17B8A", fontWeight: 500 }}>{order.id}</td>
                  <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "#3D2228" }}>{order.customer}</td>
                  <td style={{ padding: "14px 16px", fontSize: "0.82rem", color: "#6B4C55" }}>{order.item}</td>
                  <td style={{ padding: "14px 16px", fontSize: "0.88rem", color: "#3D2228", fontWeight: 500 }}>{order.total}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="px-3 py-1 rounded-full" style={{ ...statusColor[order.status], fontSize: "0.72rem", fontWeight: 500 }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "0.78rem", color: "#9A7080" }}>{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
