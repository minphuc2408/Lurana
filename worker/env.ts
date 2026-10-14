export interface Bindings {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET?: string;
}
