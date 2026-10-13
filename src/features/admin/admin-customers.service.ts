import { customers, avatarColors } from "./data/admin-customers.data";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getAdminCustomersDemoData() {
  return structuredClone({ customers, avatarColors });
}
