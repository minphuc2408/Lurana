export interface Bindings {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
  TURNSTILE_SECRET?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_UPLOAD_PRESET?: string;
  CLOUDINARY_SCOPE?: string;
}

export type WorkerEnv = { Bindings: Bindings; Variables: { request_id: string } };
