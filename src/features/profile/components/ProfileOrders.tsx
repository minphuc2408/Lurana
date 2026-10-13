import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Package } from "lucide-react";
import type { ProfileModel } from "../hooks/useProfile";
export function ProfileOrders(model: ProfileModel) {
  const { t } = useLocale("profile");
  const {
    statusColor,
    recentOrders
  } = model;
  // Redirect to login if not authenticated
  return <div className="pb-16">
            <div className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
              {recentOrders.map((order, i) => <div key={order.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4", i < recentOrders.length - 1 ? "[border-bottom:1px_solid_#F0DDD5]" : "[border-bottom:none]")}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-lunara-blush">
                      <Package size={18} className="text-lunara-rose-strong" />
                    </div>
                    <div>
                      <div className="font-display [font-size:1rem] text-lunara-ink [font-weight:500]">{order.id}</div>
                      <div className="[font-size:0.78rem] text-lunara-body">{order.date} · {order.items}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display [font-size:1rem] text-lunara-rose-strong [font-weight:600]">{order.total}</span>
                    <span className={cn("px-3 py-1 rounded-full [font-size:0.75rem] [font-weight:500]", colorClass(`${statusColor(order.status)}20`, "backgroundColor"), colorClass(statusColor(order.status), "color"))}>
                      {t(order.status)}
                    </span>
                  </div>
                </div>)}
            </div>
          </div>;
}
