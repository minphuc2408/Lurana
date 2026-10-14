import { timingSafeEqual } from 'node:crypto';

// Node lacks the Workers WebCrypto extension. Real workerd smoke uses the native API.
if (!crypto.subtle.timingSafeEqual) Object.defineProperty(crypto.subtle, 'timingSafeEqual', {
  configurable: true, value: (a, b) => timingSafeEqual(new Uint8Array(a), new Uint8Array(b)),
});
export const adminEnv = {
  ADMIN_PASSWORD: 'local-demo-admin-password-do-not-use-in-production',
  JWT_SECRET: 'local-demo-jwt-secret-at-least-32-characters',
};
export async function adminCookie(app, env, origin = 'http://localhost') {
  const response = await app.request(`${origin}/api/admin/login`, { method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminEnv.ADMIN_PASSWORD }) }, { ...adminEnv, ...env });
  if (response.status !== 200) throw new Error(`Demo admin login failed: ${response.status}`);
  return response.headers.get('Set-Cookie').split(';', 1)[0];
}
