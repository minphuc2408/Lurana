import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { AdminDashboardModel } from "../hooks/useAdminDashboard";
export function DashboardCharts(model: AdminDashboardModel) {
  const { t } = useLocale("admin");
  const {
    period,
    setPeriod,
    salesData,
    categoryData
  } = model;
  return <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl p-6 bg-white [border:1px_solid_#F0DDD5]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display [font-size:1.15rem] text-lunara-ink">{t("Revenue Overview")}</h2>
              <p className="[font-size:0.72rem] text-lunara-body [margin-top:2px]">{t("Monthly revenue trends")}</p>
            </div>
            <div className="flex gap-1">
              {["3M", "6M", "1Y"].map(p => <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 rounded-full [font-size:0.7rem] [cursor:pointer]", period === p ? "[border:1px_solid_#C17B8A]" : "[border:1px_solid_#F0DDD5]", period === p ? "bg-lunara-rose-strong" : "bg-transparent", period === p ? "text-white" : "text-lunara-body")}>
                  {p}
                </button>)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={salesData.map(row => ({ ...row, month: t(row.month) }))} margin={{
          top: 5,
          right: 10,
          left: 0,
          bottom: 5
        }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C17B8A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C17B8A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD5" />
              <XAxis dataKey="month" tick={{
            fontSize: 11,
            fill: "#9A7080"
          }} axisLine={false} tickLine={false} />
              <YAxis tick={{
            fontSize: 11,
            fill: "#9A7080"
          }} axisLine={false} tickLine={false} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{
            backgroundColor: "white",
            border: "1px solid #F0DDD5",
            borderRadius: "12px",
            fontSize: "0.8rem"
          }} formatter={value => [`₱${Number(value).toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#C17B8A" strokeWidth={2.5} fill="url(#colorRev)" dot={{
            fill: "#C17B8A",
            strokeWidth: 0,
            r: 4
          }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="rounded-2xl p-6 bg-white [border:1px_solid_#F0DDD5]">
          <h2 className="font-display [font-size:1.15rem] text-lunara-ink [margin-bottom:4px]">{t("Sales by Category")}</h2>
          <p className="[font-size:0.72rem] text-lunara-body [margin-bottom:12px]">{t("Product distribution")}</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={categoryData.map(row => ({ ...row, name: t(row.name) }))} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{
            backgroundColor: "white",
            border: "1px solid #F0DDD5",
            borderRadius: "10px",
            fontSize: "0.8rem"
          }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {categoryData.map(cat => <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", colorClass(cat.color, "backgroundColor"))} />
                  <span className="[font-size:0.78rem] text-lunara-body">{t(cat.name)}</span>
                </div>
                <span className="[font-size:0.78rem] text-lunara-ink [font-weight:500]">{cat.value}%</span>
              </div>)}
          </div>
        </div>
      </div>;
}
