import { demoStore, demoNotifications } from "./data/settings.data";
export function getSettingsDemoData() { return structuredClone({ store: demoStore, notifications: demoNotifications }); }
