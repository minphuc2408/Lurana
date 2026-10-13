import { useLocale } from "@/shared/i18n";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { ShoppingBag, Users, Package, ArrowUp, ArrowDown, DollarSign } from "lucide-react";
import type { AdminDashboardModel } from "../hooks/useAdminDashboard";
export function DashboardStats(model: AdminDashboardModel) {
  const { t } = useLocale("admin");
  const {
    stats
  } = model;
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => {
      const Icon = icons[stat.icon];
      return <div key={stat.label} className="rounded-2xl p-5 bg-white [border:1px_solid_#F0DDD5]">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClass(stat.bg, "backgroundColor"))}>
                <span className={cn("", colorClass(stat.color, "color"))}>{<Icon size={20} />}</span>
              </div>
              <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full [font-size:0.7rem]", stat.trend === "up" ? "bg-[#EDF7EF]" : "bg-[#FFF0EE]", stat.trend === "up" ? "text-[#426647]" : "text-[#E87A5B]")}>
                {stat.trend === "up" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {stat.trend === "up" ? t("Up") : t("Down")}
              </div>
            </div>
            <div className="font-display [font-size:1.8rem] [font-weight:600] text-lunara-ink [line-height:1]">
              {stat.value}
            </div>
            <div className="[font-size:0.78rem] text-lunara-body [margin-top:4px]">{t(stat.label)}</div>
            <div className={cn("[font-size:0.7rem] [margin-top:3px]", stat.trend === "up" ? "text-[#426647]" : "text-[#E87A5B]")}>{t(stat.sub)}</div>
          </div>;
    })}
      </div>;
}
const icons: Record<string, LucideIcon> = {
  DollarSign,
  ShoppingBag,
  Users,
  Package
};
