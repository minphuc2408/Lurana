import { bgImage } from "./data/login.data";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getLoginDemoData() {
  return structuredClone({ bgImage });
}
