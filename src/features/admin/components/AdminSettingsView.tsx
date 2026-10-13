import { AdminAccountSettings } from "./AdminAccountSettings";
import { NotificationSettings } from "./NotificationSettings";
import { StoreSettings } from "./StoreSettings";
import { Save } from "lucide-react";
import type { AdminSettingsModel } from "../hooks/useAdminSettings";
export function AdminSettingsView(model: AdminSettingsModel) {
  const {
    saved,
    handleSave
  } = model;
  return <div className="p-6 max-w-3xl font-body">
      {saved && <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 bg-[#EDF7EF] [border:1px_solid_#B8E0C0]">
          <Save size={15} className="text-[#426647]" />
          <span className="[font-size:0.85rem] text-[#5A8060]">Demo settings updated for this page session.</span>
        </div>}

      {/* Store Info */}
      <StoreSettings {...model} />

      {/* Notifications */}
      <NotificationSettings {...model} />

      {/* Security */}
      <AdminAccountSettings {...model} />

      {/* Save button */}
      <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-full bg-lunara-rose-strong text-white [border:none] [cursor:pointer] [font-size:0.85rem] [letter-spacing:0.05em]">
        <Save size={15} /> Save All Settings
      </button>
    </div>;
}
