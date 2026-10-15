export type UserRole = "user" | "admin";
export interface AuthUser { name: string; email: string; role: UserRole; }
export type LoginResult = { success: true; user: AuthUser } | { success: false; error: string };
export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
  login: (emailOrPassword: string, password?: string) => Promise<LoginResult>;
  logout: () => Promise<boolean>;
}
