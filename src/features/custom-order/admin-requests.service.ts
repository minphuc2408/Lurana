import { requests, statusConfig } from "./data/admin-requests.data";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getAdminRequestsDemoData() {
  return structuredClone({ requests, statusConfig });
}
