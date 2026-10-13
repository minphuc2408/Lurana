import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Mail, Package, UserCheck, UserX, Star } from "lucide-react";
import type { AdminCustomersModel } from "../hooks/useAdminCustomers";
export function CustomersTable(model: AdminCustomersModel) {
  const { t } = useLocale("admin");
  const {
    filtered,
    totalOrders,
    customers,
    avatarColors
  } = model;
  return <div className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
        <div className="overflow-x-auto">
          <table className="[width:100%] [border-collapse:collapse]">
            <thead>
              <tr className="bg-lunara-surface">
                {["Customer", "Contact", "Orders", "Total Spent", "Last Order", "Joined", "Status", "Actions"].map(h => <th key={h} className="[text-align:left] [padding:12px_16px] [font-size:0.68rem] [letter-spacing:0.1em] [text-transform:uppercase] text-lunara-body [font-weight:500] [white-space:nowrap]">
                    {t(h)}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr>
                  <td colSpan={8} className="[padding:40px] [text-align:center] text-lunara-body [font-size:0.88rem]">
                    {t("No customers found")}</td>
                </tr> : filtered.map((customer, idx) => <tr key={customer.id} className="[border-top:1px_solid_#F0DDD5]">
                    {/* Customer */}
                    <td className="[padding:14px_16px]">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 [font-size:0.82rem] text-white [font-weight:700]", colorClass(avatarColors[idx % avatarColors.length], "backgroundColor"))}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="[font-size:0.88rem] text-lunara-ink [font-weight:500]">{customer.name}</span>
                            {customer.vip && <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#FDF8E8] text-[#806000] [font-size:0.6rem]">
                                <Star size={9} fill="#D4A020" /> {t("VIP")}</span>}
                          </div>
                          <div className="[font-size:0.72rem] text-lunara-body [margin-top:1px]">#{customer.id.toString().padStart(4, "0")}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="[padding:14px_16px]">
                      <div className="[font-size:0.8rem] text-lunara-body">{customer.email}</div>
                      <div className="[font-size:0.72rem] text-lunara-body [margin-top:2px]">{customer.phone}</div>
                    </td>

                    {/* Orders */}
                    <td className="[padding:14px_16px] [text-align:center]">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center mx-auto bg-lunara-blush text-lunara-rose-strong [font-size:0.85rem] [font-weight:600]">
                        {customer.orders}
                      </span>
                    </td>

                    {/* Spent */}
                    <td className="[padding:14px_16px]">
                      <span className="[font-size:0.88rem] text-lunara-ink [font-weight:600]">₱{customer.spent.toLocaleString()}</span>
                    </td>

                    {/* Last Order */}
                    <td className="[padding:14px_16px] [font-size:0.8rem] text-lunara-body [white-space:nowrap]">
                      {customer.lastOrder}
                    </td>

                    {/* Joined */}
                    <td className="[padding:14px_16px] [font-size:0.8rem] text-lunara-body">
                      {customer.joined}
                    </td>

                    {/* Status */}
                    <td className="[padding:14px_16px]">
                      <span className={cn("px-3 py-1 rounded-full [font-size:0.72rem] [font-weight:500]", customer.status === "Active" ? "bg-[#EDF7EF]" : "bg-[#F5F0F0]", customer.status === "Active" ? "text-[#426647]" : "text-lunara-body")}>
                        {t(customer.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="[padding:14px_16px]">
                      <div className="flex gap-1.5">
                        <button title={t("Send Email")} className="w-7 h-7 rounded-lg flex items-center justify-center bg-lunara-blush [border:none] [cursor:pointer] text-lunara-rose-strong" aria-label={t("Send Email")}>
                          <Mail size={12} />
                        </button>
                        <button title={t("View Orders")} className="w-7 h-7 rounded-lg flex items-center justify-center bg-lunara-blush [border:none] [cursor:pointer] text-lunara-rose-strong" aria-label={t("View Orders")}>
                          <Package size={12} />
                        </button>
                        <button title={customer.status === "Active" ? t("Deactivate") : t("Activate")} className={cn("w-7 h-7 rounded-lg flex items-center justify-center [border:none] [cursor:pointer]", customer.status === "Active" ? "bg-[#FFF0F0]" : "bg-[#EDF7EF]", customer.status === "Active" ? "text-[#B42318]" : "text-[#426647]")} aria-label={customer.status === "Active" ? t("Deactivate") : t("Activate")}>
                          {customer.status === "Active" ? <UserX size={12} /> : <UserCheck size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 [border-top:1px_solid_#F0DDD5]">
          <span className="[font-size:0.78rem] text-lunara-body">
            {t("Showing")}{" "}{filtered.length} {t("of")}{" "}{customers.length} {t("customers")}</span>
          <span className="[font-size:0.78rem] text-lunara-body">
            {t("Total orders:")}{" "}<strong className="text-lunara-ink">{totalOrders}</strong>
          </span>
        </div>
      </div>;
}
