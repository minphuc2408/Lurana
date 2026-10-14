import { AppError } from './errors.ts';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const forbidden = () => new AppError('FORBIDDEN', 403, 'Xác minh bảo mật không hợp lệ. Vui lòng thử lại.');

export async function verifyTurnstile(
  secret: string | undefined,
  token: string | undefined,
  requestFetch: typeof fetch = fetch,
  idempotencyKey?: string,
): Promise<void> {
  if (!secret) return;
  if (!token?.trim() || token.length > 2048) throw forbidden();
  try {
    const response = await requestFetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    const result: unknown = await response.json();
    if (!response.ok || !result || typeof result !== 'object'
      || !('success' in result) || result.success !== true) throw forbidden();
  } catch {
    // Provider errors fail closed; never expose tokens, secrets or remote payloads.
    throw forbidden();
  }
}
