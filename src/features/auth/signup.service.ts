import { bgImage } from "./data/signup.data";

// Fresh demo snapshots; replace this boundary when an API is available.
export function getSignupDemoData() {
  return structuredClone({ bgImage });
}
