import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import type { WorkerEnv } from '../env.ts';
import { ADMIN_COOKIE, SESSION_SECONDS, authenticate } from '../lib/auth.ts';
import { AppError } from '../lib/errors.ts';
import { validate } from '../lib/validate.ts';

export const adminAuthRoutes = new Hono<WorkerEnv>();
const loginSchema = z.object({ password: z.string({ error: 'Vui lòng nhập mật khẩu.' })
  .min(1, 'Vui lòng nhập mật khẩu.').max(1024, 'Mật khẩu không hợp lệ.') });
adminAuthRoutes.post('/login', bodyLimit({ maxSize: 4096, onError: () => {
  throw new AppError('VALIDATION_ERROR', 400, 'Nội dung đăng nhập quá lớn.');
} }), validate('json', loginSchema), async c => {
  const token = await authenticate(c.req.valid('json').password, c.env);
  setCookie(c, ADMIN_COOKIE, token, { httpOnly: true, sameSite: 'Strict', path: '/',
    maxAge: SESSION_SECONDS, secure: new URL(c.req.url).protocol === 'https:' });
  return c.json({ data: { ok: true } });
});
adminAuthRoutes.post('/logout', c => {
  setCookie(c, ADMIN_COOKIE, '', { httpOnly: true, sameSite: 'Strict', path: '/',
    maxAge: 0, secure: new URL(c.req.url).protocol === 'https:' });
  return c.json({ data: { ok: true } });
});
adminAuthRoutes.get('/me', c => c.json({ data: { role: 'ADMIN' } }));
