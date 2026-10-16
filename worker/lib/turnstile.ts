import { AppError } from './errors.ts';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const forbidden = () => new AppError('FORBIDDEN', 403, 'Xác minh bảo mật không hợp lệ. Vui lòng thử lại.');

export async function verifyTurnstile(
  secret: string | undefined,
  token: string | undefined,
  requestFetch: typeof fetch = fetch,
  idempotencyKey?: string,
  expected?: { action: string; hostname: string; allowLocalBypass?: boolean },
): Promise<void> {
  if (!secret?.trim()) {
    // Explicit server-only test opt-in AND loopback are required. Never bypass remote.
    if (expected?.allowLocalBypass === true
      && ['localhost', '127.0.0.1', '[::1]'].includes(expected.hostname)) return;
    throw new AppError('TURNSTILE_NOT_CONFIGURED', 503, 'Dịch vụ xác minh bảo mật chưa được cấu hình.');
  }
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
    if (expected && (!('action' in result) || result.action !== expected.action
      || !('hostname' in result) || result.hostname !== expected.hostname)) throw forbidden();
  } catch {
    // Provider errors fail closed; never expose tokens, secrets or remote payloads.
    throw forbidden();
  }
}
