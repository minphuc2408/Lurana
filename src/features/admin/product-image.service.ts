import { ApiError } from '../../shared/api/client.ts';
import { MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_TYPES, type AdminImageUploadTicket } from '../../../shared/admin-upload-schemas.ts';

export function validateProductImage(file: { type: string; size: number }) {
  if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type) || !Number.isInteger(file.size)
    || file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new ApiError('INVALID_IMAGE', 'Choose JPEG, PNG or WebP up to 5 MB.');
  }
}

export function cloudinaryImageUrl(value: unknown, ticket: AdminImageUploadTicket): string {
  if (!value || typeof value !== 'object') throw new ApiError('BAD_RESPONSE', 'Invalid upload response.');
  const image = value as Record<string, unknown>;
  if (image.resource_type !== 'image' || image.public_id !== ticket.params.public_id
    || !['jpg', 'png', 'webp'].includes(String(image.format)) || typeof image.secure_url !== 'string') {
    throw new ApiError('BAD_RESPONSE', 'Invalid upload response.');
  }
  let url: URL;
  try { url = new URL(image.secure_url); } catch { throw new ApiError('BAD_RESPONSE', 'Invalid image URL.'); }
  const prefix = `/${ticket.cloud_name}/image/upload/`;
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.port || url.username || url.password
    || url.search || url.hash || !url.pathname.startsWith(prefix)
    || !url.pathname.endsWith(`/${ticket.params.public_id}.${image.format}`)) {
    throw new ApiError('BAD_RESPONSE', 'Unexpected image URL.');
  }
  return url.href;
}

export async function uploadProductImage(file: File, ticket: AdminImageUploadTicket, signal?: AbortSignal): Promise<string> {
  validateProductImage(file);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 90_000);
  try {
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', ticket.api_key);
    body.append('signature', ticket.signature);
    for (const [key, value] of Object.entries(ticket.params)) body.append(key, value);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${ticket.cloud_name}/image/upload`, {
      method: 'POST', body, signal: controller.signal, credentials: 'omit', redirect: 'error',
    });
    if (!response.ok) throw new ApiError('IMAGE_UPLOAD_FAILED', 'Image upload failed.');
    return cloudinaryImageUrl(await response.json(), ticket);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('IMAGE_UPLOAD_FAILED', 'Image upload could not be confirmed.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
