import { ACCOUNTS } from "./data/demo-accounts.ts";
import type { AuthUser, LoginResult } from "./auth.types.ts";
const sessionKey = "lunara_user";
export function authenticateDemo(email: string, password: string): LoginResult {
  const found = ACCOUNTS.find(account => account.email.toLowerCase() === email.toLowerCase() && account.password === password);
  if (!found) return { success: false, error: "Invalid email or password." };
  const { password: _password, ...user } = found;
  return { success: true, user };
}
export function readDemoSession(): AuthUser | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
    return value && typeof value.name === "string" && typeof value.email === "string" && (value.role === "user" || value.role === "admin")
      ? { name: value.name, email: value.email, role: value.role } : null;
  } catch { return null; }
}
export function saveDemoSession(user: AuthUser | null) {
  try { if (user) sessionStorage.setItem(sessionKey, JSON.stringify(user)); else sessionStorage.removeItem(sessionKey); } catch { /* In-memory demo remains usable if browser storage is disabled. */ }
}
export function passwordStrength(password: string) {
  if (!password) return 0;
  return Number(password.length >= 8) + Number(/[A-Z]/.test(password)) + Number(/[0-9]/.test(password)) + Number(/[^a-zA-Z0-9]/.test(password));
}
