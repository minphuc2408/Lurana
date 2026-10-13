import { Shield } from "lucide-react";
import type { AdminSettingsModel } from "../hooks/useAdminSettings";
export function AdminAccountSettings(model: AdminSettingsModel) {
  return <div className="bg-white [border:1px_solid_#F0DDD5] [border-radius:16px] [padding:24px] [margin-bottom:20px]">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EDF3FC]">
            <Shield size={16} className="text-[#3763A0]" />
          </div>
          <div>
            <h2 className="font-display [font-size:1.1rem] text-lunara-ink [font-weight:600]">Security</h2>
            <p className="[font-size:0.72rem] text-lunara-body">Admin account security settings</p>
          </div>
        </div>
        {[{
      label: "Current Password",
      placeholder: "••••••••"
    }, {
      label: "New Password",
      placeholder: "Minimum 8 characters"
    }, {
      label: "Confirm New Password",
      placeholder: "Repeat new password"
    }].map(f => <div key={f.label} className="mb-4">
            <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={`adminaccountsettings-1-${f.label}`}>{f.label}</label>
            <input type="password" placeholder={f.placeholder} className="[border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [border-radius:12px] [padding:10px_14px] [width:100%]" id={`adminaccountsettings-1-${f.label}`} />
          </div>)}
      </div>;
}
