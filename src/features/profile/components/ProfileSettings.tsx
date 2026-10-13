import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Heart, Star, Settings, LogOut } from "lucide-react";
import type { ProfileModel } from "../hooks/useProfile";
export function ProfileSettings(model: ProfileModel) {
  const { t } = useLocale("profile");
  const {
    logout
  } = model;
  // Redirect to login if not authenticated
  return <div className="max-w-xl pb-16">
            <div className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
              {[{
        icon: <Settings size={18} />,
        label: "Account Settings",
        desc: "Update your account preferences"
      }, {
        icon: <Star size={18} />,
        label: "Notification Settings",
        desc: "Manage email and push notifications"
      }, {
        icon: <Heart size={18} />,
        label: "Privacy Settings",
        desc: "Control your data and visibility"
      }].map((item, i, arr) => <button key={item.label} className={cn("w-full flex items-center gap-4 p-5 text-left bg-transparent [border:none] [cursor:pointer]", i < arr.length - 1 ? "[border-bottom:1px_solid_#F0DDD5]" : "[border-bottom:none]")}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-lunara-blush">
                    <span className="text-lunara-rose-strong">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="[font-size:0.9rem] text-lunara-ink [font-weight:500]">{t(item.label)}</div>
                    <div className="[font-size:0.78rem] text-lunara-body">{t(item.desc)}</div>
                  </div>
                  <span className="text-lunara-body">›</span>
                </button>)}
              <button onClick={logout} className="w-full flex items-center gap-4 p-5 text-left bg-transparent [border:none] [cursor:pointer] [border-top:1px_solid_#F0DDD5]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFF0F0]">
                  <LogOut size={18} className="text-[#B42318]" />
                </div>
                <span className="[font-size:0.9rem] text-[#B42318]">{t("Sign Out")}</span>
              </button>
            </div>
          </div>;
}
