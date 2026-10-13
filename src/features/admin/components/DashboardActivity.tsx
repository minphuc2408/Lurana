import { useLocale, getLocalizedName } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { AdminDashboardModel } from "../hooks/useAdminDashboard";
export function DashboardActivity(model: AdminDashboardModel) {
  const { t, language } = useLocale("admin");
  const {
    salesData,
    topProducts
  } = model;
  return <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Orders Chart */}
        <div className="rounded-2xl p-6 bg-white [border:1px_solid_#F0DDD5]">
          <h2 className="font-display [font-size:1.15rem] text-lunara-ink [margin-bottom:4px]">{t("Monthly Orders")}</h2>
          <p className="[font-size:0.72rem] text-lunara-body [margin-bottom:16px]">{t("Order volume over time")}</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={salesData.map(row => ({ ...row, month: t(row.month) }))} margin={{
          top: 5,
          right: 10,
          left: 0,
          bottom: 5
        }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD5" />
              <XAxis dataKey="month" tick={{
            fontSize: 11,
            fill: "#9A7080"
          }} axisLine={false} tickLine={false} />
              <YAxis tick={{
            fontSize: 11,
            fill: "#9A7080"
          }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{
            backgroundColor: "white",
            border: "1px solid #F0DDD5",
            borderRadius: "12px",
            fontSize: "0.8rem"
          }} />
              <Bar name={t("Orders")} dataKey="orders" fill="#D4A0AC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl p-6 bg-white [border:1px_solid_#F0DDD5]">
          <h2 className="font-display [font-size:1.15rem] text-lunara-ink [margin-bottom:4px]">{t("Top Products")}</h2>
          <p className="[font-size:0.72rem] text-lunara-body [margin-bottom:14px]">{t("Best performing arrangements")}</p>
          <div className="flex flex-col gap-3">
            {topProducts.map((p, i) => <div key={p.name} className="flex items-center gap-3">
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 [font-size:0.72rem] text-lunara-rose-strong [font-weight:600]", i === 0 ? "bg-lunara-blush" : "bg-[#F5F0F2]")}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="[font-size:0.85rem] text-lunara-ink [overflow:hidden] [text-overflow:ellipsis] [white-space:nowrap]">{getLocalizedName(p, language)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <progress value={p.sales / 130 * 100} max="100" aria-label={t("Progress")} className="h-1 rounded-full block w-full appearance-none overflow-hidden [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-current [&::-moz-progress-bar]:bg-current text-lunara-rose-light [max-width:100px]" />
                    <span className="[font-size:0.68rem] text-lunara-body">{p.sales} {t("sold")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="[font-size:0.85rem] text-lunara-rose-strong [font-weight:500]">{p.revenue}</span>
                  {p.trend === "up" ? <ArrowUp size={11} className="text-[#426647]" /> : <ArrowDown size={11} className="text-[#E87A5B]" />}
                </div>
              </div>)}
          </div>
        </div>
      </div>;
}
