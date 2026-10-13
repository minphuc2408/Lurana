import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Eye, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminOrdersModel } from "../hooks/useAdminOrders";
export function AdminOrdersTable(model: AdminOrdersModel) {
  const { t } = useLocale("orders");
  const {
    page,
    setPage,
    totalPages,
    paginated,
    updateStatus,
    statusConfig
  } = model;
  return <div className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
        <div className="overflow-x-auto">
          <table className="[width:100%] [border-collapse:collapse]">
            <thead>
              <tr className="bg-lunara-surface">
                {["Order ID", "Customer", "Items", "Total", "Date", "Payment", "Status", "Actions"].map(h => <th key={h} className="[text-align:left] [padding:12px_16px] [font-size:0.68rem] [letter-spacing:0.1em] [text-transform:uppercase] text-lunara-body [font-weight:500] [white-space:nowrap]">
                    {t(h)}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? <tr>
                  <td colSpan={8} className="[padding:40px] [text-align:center] text-lunara-body [font-size:0.88rem]">
                    {t("No orders found")}</td>
                </tr> : paginated.map(order => <tr key={order.id} className="[border-top:1px_solid_#F0DDD5]">
                    <td className="[padding:14px_16px]">
                      <span className="[font-size:0.85rem] text-lunara-rose-strong [font-weight:600]">{order.id}</span>
                    </td>
                    <td className="[padding:14px_16px]">
                      <div>
                        <div className="[font-size:0.85rem] text-lunara-ink [font-weight:500]">{order.customer}</div>
                        <div className="[font-size:0.72rem] text-lunara-body [margin-top:1px]">{order.email}</div>
                      </div>
                    </td>
                    <td className="[padding:14px_16px] [font-size:0.82rem] text-lunara-body [max-width:180px]">
                      <span className="[overflow:hidden] [text-overflow:ellipsis] [white-space:nowrap] [display:block]">{order.items}</span>
                    </td>
                    <td className="[padding:14px_16px]">
                      <span className="[font-size:0.88rem] text-lunara-ink [font-weight:600]">₱{order.total.toLocaleString()}</span>
                    </td>
                    <td className="[padding:14px_16px] [font-size:0.8rem] text-lunara-body [white-space:nowrap]">{order.date}</td>
                    <td className="[padding:14px_16px]">
                      <span className="px-2.5 py-1 rounded-full bg-lunara-blush text-lunara-rose-strong [font-size:0.7rem]">
                        {t(order.payment)}
                      </span>
                    </td>
                    <td className="[padding:14px_16px]">
                      <span className={cn("px-3 py-1 rounded-full [font-size:0.72rem] [font-weight:500]", colorClass(statusConfig[order.status].bg, "backgroundColor"), colorClass(statusConfig[order.status].color, "color"))}>
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="[padding:14px_16px]">
                      <div className="flex gap-1.5">
                        {order.status === "Pending" && <button onClick={() => updateStatus(order.id, "Processing")} title={t("Approve")} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#EDF7EF] [border:none] [cursor:pointer] text-[#426647]" aria-label={t("Approve")}>
                            <Check size={12} />
                          </button>}
                        {(order.status === "Processing" || order.status === "Pending") && <button onClick={() => updateStatus(order.id, "Cancelled")} title={t("Cancel")} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#FFF0F0] [border:none] [cursor:pointer] text-[#B42318]" aria-label={t("Cancel")}>
                            <X size={12} />
                          </button>}
                        {order.status === "Processing" && <button onClick={() => updateStatus(order.id, "In Transit")} title={t("Mark as Shipped")} className="px-2.5 h-7 rounded-lg flex items-center justify-center bg-[#EDF3FC] [border:none] [cursor:pointer] text-[#3763A0] [font-size:0.65rem] [white-space:nowrap]" aria-label={t("Mark as Shipped")}>
                            {t("Ship")}</button>}
                        {order.status === "In Transit" && <button onClick={() => updateStatus(order.id, "Delivered")} title={t("Mark Delivered")} className="px-2.5 h-7 rounded-lg flex items-center justify-center bg-[#EDF7EF] [border:none] [cursor:pointer] text-[#426647] [font-size:0.65rem]" aria-label={t("Mark Delivered")}>
                            {t("Deliver")}</button>}
                        <button title={t("View")} className="w-7 h-7 rounded-lg flex items-center justify-center bg-lunara-blush [border:none] [cursor:pointer] text-lunara-rose-strong" aria-label={t("View")}>
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && <div className="flex items-center justify-between px-5 py-3 [border-top:1px_solid_#F0DDD5]">
            <span className="[font-size:0.78rem] text-lunara-body">
              {t("Page")}{" "}{page} {t("of")}{" "}{totalPages}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={cn("w-8 h-8 rounded-lg flex items-center justify-center [border:1px_solid_#F0DDD5] bg-white", page === 1 ? "[cursor:not-allowed]" : "[cursor:pointer]", page === 1 ? "text-lunara-body" : "text-lunara-body")}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={cn("w-8 h-8 rounded-lg flex items-center justify-center [border:1px_solid_#F0DDD5] bg-white", page === totalPages ? "[cursor:not-allowed]" : "[cursor:pointer]", page === totalPages ? "text-lunara-body" : "text-lunara-body")}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>}
      </div>;
}
