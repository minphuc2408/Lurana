import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Bell } from "lucide-react";
import type { AdminSettingsModel } from "../hooks/useAdminSettings";
export function NotificationSettings(model: AdminSettingsModel) {
  const { t } = useLocale("admin");
  const {
    notifications,
    setNotifications
  } = model;
  return <div className="bg-white [border:1px_solid_#F0DDD5] [border-radius:16px] [padding:24px] [margin-bottom:20px]">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FDF8E8]">
            <Bell size={16} className="text-[#806000]" />
          </div>
          <div>
            <h2 className="font-display [font-size:1.1rem] text-lunara-ink [font-weight:600]">{t("Notification Settings")}</h2>
            <p className="[font-size:0.72rem] text-lunara-body">{t("Choose what alerts you receive")}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[{
        key: "newOrder",
        label: "New Order Received",
        desc: "Get notified when a customer places an order"
      }, {
        key: "lowStock",
        label: "Low Stock Alert",
        desc: "Alert when product stock falls below threshold"
      }, {
        key: "newRequest",
        label: "New Custom Request",
        desc: "Notification for incoming custom flower requests"
      }, {
        key: "emailDigest",
        label: "Daily Email Digest",
        desc: "Receive a summary of the day's activity"
      }].map(n => <div key={n.key} className="flex items-center justify-between py-3 [border-bottom:1px_solid_#F0DDD5]">
              <div>
                <div className="[font-size:0.88rem] text-lunara-ink [font-weight:500]">{t(n.label)}</div>
                <div className="[font-size:0.78rem] text-lunara-body [margin-top:2px]">{t(n.desc)}</div>
              </div>
              <button onClick={() => setNotifications({
          ...notifications,
          [n.key]: !notifications[n.key as keyof typeof notifications]
        })} className={cn("relative flex-shrink-0 [width:42px] [height:24px] [border-radius:999px] [border:none] [cursor:pointer] [transition:background-color_0.2s] [padding:0]", notifications[n.key as keyof typeof notifications] ? "bg-lunara-rose-strong" : "bg-[#E0D0D5]")} role="switch" aria-label={t(n.label)} aria-checked={notifications[n.key as keyof typeof notifications]}>
                <span className={cn("[position:absolute] [top:3px] [width:18px] [height:18px] [border-radius:50%] bg-white [transition:left_0.2s] [box-shadow:0_1px_3px_rgba(0,0,0,0.2)]", notifications[n.key as keyof typeof notifications] ? "[left:21px]" : "[left:3px]")} />
              </button>
            </div>)}
        </div>
      </div>;
}
