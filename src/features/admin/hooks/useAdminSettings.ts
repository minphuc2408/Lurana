import { useEffect, useRef, useState } from "react";
import { getSettingsDemoData } from "../admin-settings.service";
export function useAdminSettings() {
  const initial = getSettingsDemoData();
  const [store, setStore] = useState(initial.store);
  const [notifications, setNotifications] = useState(initial.notifications);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const handleSave = () => { clearTimeout(timer.current); setSaved(true); timer.current = setTimeout(() => setSaved(false), 2500); };
  return { store, setStore, notifications, setNotifications, saved, handleSave };
}
export type AdminSettingsModel = ReturnType<typeof useAdminSettings>;
