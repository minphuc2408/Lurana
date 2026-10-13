import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { MessageSquare, Check, X, Eye, Clock } from "lucide-react";
import type { AdminRequestsModel } from "../hooks/useAdminRequests";
export function AdminRequestsView(model: AdminRequestsModel) {
  const { t } = useLocale("custom-order");
  const {
    reqs,
    expanded,
    setExpanded,
    updateStatus,
    statusConfig
  } = model;
  return <div className="p-6 font-body">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[{
        label: "Total Requests",
        value: reqs.length,
        color: "#C17B8A",
        bg: "#FDF0F3"
      }, {
        label: "Pending",
        value: reqs.filter(r => r.status === "Pending").length,
        color: "#D4A020",
        bg: "#FDF8E8"
      }, {
        label: "In Review",
        value: reqs.filter(r => r.status === "In Review").length,
        color: "#5B8DD9",
        bg: "#EDF3FC"
      }, {
        label: "Completed",
        value: reqs.filter(r => r.status === "Completed").length,
        color: "#7A9E7E",
        bg: "#EDF7EF"
      }].map(s => <div key={s.label} className="rounded-2xl p-5 bg-white [border:1px_solid_#F0DDD5]">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colorClass(s.bg, "backgroundColor"))}>
              <MessageSquare size={16} className={cn("", colorClass(s.color, "color"))} />
            </div>
            <div className="font-display [font-size:1.8rem] [font-weight:600] text-lunara-ink [line-height:1]">{s.value}</div>
            <div className="[font-size:0.78rem] text-lunara-body [margin-top:4px]">{t(s.label)}</div>
          </div>)}
      </div>

      {/* Requests List */}
      <div className="flex flex-col gap-3">
        {reqs.map(req => <div key={req.id} className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
            <button type="button" aria-expanded={expanded === req.id} className="flex w-full items-center justify-between p-5 cursor-pointer text-left" onClick={() => setExpanded(expanded === req.id ? null : req.id)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-lunara-blush">
                  <MessageSquare size={16} className="text-lunara-rose-strong" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display [font-size:1rem] text-lunara-ink [font-weight:500]">{req.customer}</span>
                    <span className="[font-size:0.72rem] text-lunara-rose-strong">{req.id}</span>
                  </div>
                  <div className="[font-size:0.78rem] text-lunara-body [margin-top:2px]">
                    {t(req.occasion)} · {req.budget} {t("budget ·")}{" "}{req.date}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("px-3 py-1 rounded-full [font-size:0.72rem] [font-weight:500]", colorClass(statusConfig[req.status].bg, "backgroundColor"), colorClass(statusConfig[req.status].color, "color"))}>
                  {t(req.status)}
                </span>
                <Eye size={15} className="text-lunara-body" />
              </div>
            </button>

            {expanded === req.id && <div className="[padding:0_20px_20px] [border-top:1px_solid_#F0DDD5]">
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="[font-size:0.72rem] text-lunara-body [text-transform:uppercase] [letter-spacing:0.1em] [margin-bottom:4px]">{t("Requested Flowers")}</p>
                    <p className="[font-size:0.88rem] text-lunara-ink">{req.flowers}</p>
                  </div>
                  <div>
                    <p className="[font-size:0.72rem] text-lunara-body [text-transform:uppercase] [letter-spacing:0.1em] [margin-bottom:4px]">{t("Special Notes")}</p>
                    <p className="[font-size:0.88rem] text-lunara-ink">{req.notes}</p>
                  </div>
                </div>
                {(req.status === "Pending" || req.status === "In Review" || req.status === "Approved") && <div className="flex gap-2 mt-4">
                    {req.status !== "Approved" && <button onClick={() => updateStatus(req.id, req.status === "Pending" ? "In Review" : "Approved")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#EDF7EF] text-[#426647] [border:none] [cursor:pointer] [font-size:0.82rem]">
                      <Check size={13} /> {req.status === "Pending" ? t("Start Review") : t("Approve")}
                    </button>}
                    {req.status !== "Approved" && <button onClick={() => updateStatus(req.id, "Declined")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF0F0] text-[#B42318] [border:none] [cursor:pointer] [font-size:0.82rem]">
                      <X size={13} /> {t("Decline")}</button>}
                    {req.status === "Approved" && <button onClick={() => updateStatus(req.id, "Completed")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-lunara-blush text-lunara-rose-strong [border:none] [cursor:pointer] [font-size:0.82rem]">
                        <Clock size={13} /> {t("Mark Completed")}</button>}
                  </div>}
              </div>}
          </div>)}
      </div>
    </div>;
}
