import { useLocale } from "@/shared/i18n";
import { Store, Mail, Phone } from "lucide-react";
import type { AdminSettingsModel } from "../hooks/useAdminSettings";
export function StoreSettings(model: AdminSettingsModel) {
  const { t } = useLocale("admin");
  const {
    store,
    setStore
  } = model;
  return <div className="bg-white [border:1px_solid_#F0DDD5] [border-radius:16px] [padding:24px] [margin-bottom:20px]">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-lunara-blush">
            <Store size={16} className="text-lunara-rose-strong" />
          </div>
          <div>
            <h2 className="font-display [font-size:1.1rem] text-lunara-ink [font-weight:600]">{t("Store Information")}</h2>
            <p className="[font-size:0.72rem] text-lunara-body">{t("Basic details about your shop")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"storesettings-1"}>{t("Store Name")}</label>
            <input value={store.name} onChange={e => setStore({
          ...store,
          name: e.target.value
        })} className="[border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [border-radius:12px] [padding:10px_14px] [width:100%]" id={"storesettings-1"} />
          </div>
          <div>
            <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"storesettings-2"}>{t("Currency")}</label>
            <select value={store.currency} onChange={e => setStore({
          ...store,
          currency: e.target.value
        })} className="[border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [border-radius:12px] [padding:10px_14px] [width:100%]" id={"storesettings-2"}>
              <option value="PHP">{t("PHP")}</option><option value="USD">{t("USD")}</option><option value="EUR">{t("EUR")}</option>
            </select>
          </div>
          <div>
            <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"storesettings-3"}><Mail size={10} className="[display:inline] [margin-right:4px]" />{t("Email")}</label>
            <input type="email" value={store.email} onChange={e => setStore({
          ...store,
          email: e.target.value
        })} className="[border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [border-radius:12px] [padding:10px_14px] [width:100%]" id={"storesettings-3"} />
          </div>
          <div>
            <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"storesettings-4"}><Phone size={10} className="[display:inline] [margin-right:4px]" />{t("Phone")}</label>
            <input value={store.phone} onChange={e => setStore({
          ...store,
          phone: e.target.value
        })} className="[border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [border-radius:12px] [padding:10px_14px] [width:100%]" id={"storesettings-4"} />
          </div>
          <div className="col-span-2">
            <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"storesettings-5"}>{t("Address")}</label>
            <input value={store.address} onChange={e => setStore({
          ...store,
          address: e.target.value
        })} className="[border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [border-radius:12px] [padding:10px_14px] [width:100%]" id={"storesettings-5"} />
          </div>
          <div>
            <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"storesettings-6"}>{t("Timezone")}</label>
            <select value={store.timezone} onChange={e => setStore({
          ...store,
          timezone: e.target.value
        })} className="[border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [border-radius:12px] [padding:10px_14px] [width:100%]" id={"storesettings-6"}>
              <option value="Asia/Manila">{t("Asia/Manila")}</option><option value="UTC">{t("UTC")}</option><option value="America/New_York">{t("America/New_York")}</option>
            </select>
          </div>
        </div>
      </div>;
}
