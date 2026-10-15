import type { Bindings } from '../env.ts';
import type { AdminImageUploadTicket } from '../../shared/admin-upload-schemas.ts';
import { AppError } from '../lib/errors.ts';

export async function createImageUploadTicket(env: Bindings): Promise<AdminImageUploadTicket> {
  const cloud_name = env.CLOUDINARY_CLOUD_NAME;
  const api_key = env.CLOUDINARY_API_KEY;
  const secret = env.CLOUDINARY_API_SECRET;
  const preset = env.CLOUDINARY_UPLOAD_PRESET;
  const scope = env.CLOUDINARY_SCOPE;
  if (!cloud_name || !/^[a-z0-9_-]+$/.test(cloud_name) || !api_key || !/^\d+$/.test(api_key)
    || !secret?.trim() || !preset || !/^[a-zA-Z0-9_-]+$/.test(preset)
    || !scope || !['local', 'staging', 'prod'].includes(scope)) {
    throw new AppError('CLOUDINARY_NOT_CONFIGURED', 503, 'Tải ảnh chưa được cấu hình.');
  }
  // All signed fields are server-owned. Never sign arbitrary caller parameters.
  const prefix = `lunara/${scope}/products` as AdminImageUploadTicket['params']['asset_folder'];
  const params: AdminImageUploadTicket['params'] = {
    timestamp: String(Math.floor(Date.now() / 1000)),
    public_id: `${prefix}/${crypto.randomUUID()}`,
    asset_folder: prefix,
    upload_preset: preset,
    overwrite: 'false',
    allowed_formats: 'jpg,png,webp',
  };
  const toSign = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('&');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(toSign + secret));
  const signature = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return { cloud_name, api_key, signature, params };
}
