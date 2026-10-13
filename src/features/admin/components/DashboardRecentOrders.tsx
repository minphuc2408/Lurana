import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Eye } from "lucide-react";
import { Link } from "react-router";
import type { AdminDashboardModel } from "../hooks/useAdminDashboard";
export function DashboardRecentOrders(model: AdminDashboardModel) {
  const {
    recentOrders,
    statusColor
  } = model;
  return <div className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
        <div className="flex items-center justify-between p-5 [border-bottom:1px_solid_#F0DDD5]">
          <div>
            <h2 className="font-display [font-size:1.15rem] text-lunara-ink">Recent Orders</h2>
            <p className="[font-size:0.72rem] text-lunara-body [margin-top:2px]">Latest incoming orders</p>
          </div>
          <Link to="/admin/orders" className="flex items-center gap-1 px-4 py-2 rounded-full [font-size:0.78rem] text-lunara-rose-strong [text-decoration:none] [border:1px_solid_#F0DDD5] bg-lunara-blush">
            <Eye size={13} /> View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="[width:100%] [border-collapse:collapse]">
            <thead>
              <tr className="bg-lunara-surface">
                {["Order ID", "Customer", "Items", "Total", "Status", "Time"].map(h => <th key={h} className="[text-align:left] [padding:12px_16px] [font-size:0.7rem] [letter-spacing:0.1em] [text-transform:uppercase] text-lunara-body [font-weight:500]">
                    {h}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => <tr key={order.id} className="[border-top:1px_solid_#F0DDD5]">
                  <td className="[padding:14px_16px] [font-size:0.85rem] text-lunara-rose-strong [font-weight:500]">{order.id}</td>
                  <td className="[padding:14px_16px] [font-size:0.85rem] text-lunara-ink">{order.customer}</td>
                  <td className="[padding:14px_16px] [font-size:0.82rem] text-lunara-body">{order.item}</td>
                  <td className="[padding:14px_16px] [font-size:0.88rem] text-lunara-ink [font-weight:500]">{order.total}</td>
                  <td className="[padding:14px_16px]">
                    <span className={cn("px-3 py-1 rounded-full [font-size:0.72rem] [font-weight:500]", colorClass(statusColor[order.status].bg, "backgroundColor"), colorClass(statusColor[order.status].color, "color"))}>
                      {order.status}
                    </span>
                  </td>
                  <td className="[padding:14px_16px] [font-size:0.78rem] text-lunara-body">{order.time}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>;
}
