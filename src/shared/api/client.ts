export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown;
  constructor(code: string, message: string, status = 0, details?: unknown) {
    super(message); this.name = 'ApiError'; this.code = code; this.status = status; this.details = details;
  }
}
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20_000);
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { cache: 'no-store', ...options, signal: controller.signal, credentials: 'same-origin', headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers,
    } });
    let body;
    try { body = await response.json(); } catch { if (timedOut) throw new ApiError('TIMEOUT', 'API timed out.'); throw new ApiError('BAD_RESPONSE', 'Invalid API response.', response.status); }
    if (!response.ok) throw new ApiError(body?.error?.code || 'INTERNAL', body?.error?.message || 'API error.', response.status, body?.error?.details);
    if (!body || !Object.hasOwn(body, 'data')) throw new ApiError('BAD_RESPONSE', 'Invalid API response.', response.status);
    return body.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('TIMEOUT', 'API timed out.');
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('NETWORK', 'API unavailable.');
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
export function apiErrorKey(error: unknown): string {
  const code = error instanceof ApiError ? error.code : 'INTERNAL';
  const keys: Record<string, string> = { NETWORK: 'API network error', TIMEOUT: 'API timeout', BAD_RESPONSE: 'API bad response', NO_DELIVERY_ZONE: 'API delivery unavailable', CART_LIMIT: 'API cart limit', VALIDATION_ERROR: 'API validation error', OUT_OF_STOCK: 'API out of stock', VARIANT_UNAVAILABLE: 'API variant unavailable', INVALID_DELIVERY_SLOT: 'API delivery slot', UNAUTHORIZED: 'API unauthorized', INVALID_CREDENTIALS: 'API invalid credentials', FORBIDDEN: 'API forbidden', NOT_FOUND: 'API not found', CONFLICT: 'API conflict', INVALID_TRANSITION: 'API invalid transition' };
  return code === 'RATE_LIMITED' ? 'API rate limited' : keys[code] || 'API request failed';
}
