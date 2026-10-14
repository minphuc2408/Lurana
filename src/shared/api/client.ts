export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown;
  constructor(code: string, message: string, status = 0, details?: unknown) {
    super(message); this.name = 'ApiError'; this.code = code; this.status = status; this.details = details;
  }
}
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { cache: 'no-store', ...options, credentials: 'same-origin', headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers,
    } });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('NETWORK', 'API unavailable.');
  }
  let body;
  try { body = await response.json(); } catch { throw new ApiError('BAD_RESPONSE', 'Invalid API response.', response.status); }
  if (!response.ok) throw new ApiError(body?.error?.code || 'INTERNAL', body?.error?.message || 'API error.', response.status, body?.error?.details);
  if (!body || !Object.hasOwn(body, 'data')) throw new ApiError('BAD_RESPONSE', 'Invalid API response.', response.status);
  return body.data as T;
}
export function apiErrorKey(error: unknown): string {
  const code = error instanceof ApiError ? error.code : 'INTERNAL';
  const keys: Record<string, string> = { NETWORK: 'API network error', NO_DELIVERY_ZONE: 'API delivery unavailable', CART_LIMIT: 'API cart limit', VALIDATION_ERROR: 'API validation error', OUT_OF_STOCK: 'API out of stock', VARIANT_UNAVAILABLE: 'API variant unavailable' };
  return keys[code] || 'API request failed';
}
