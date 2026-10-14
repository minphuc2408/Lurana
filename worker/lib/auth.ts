import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import type { Bindings, WorkerEnv } from '../env.ts';
import { AppError } from './errors.ts';

export const ADMIN_COOKIE = 'lunara_admin';
export const SESSION_SECONDS = 12 * 60 * 60;

// A single high-entropy password; no password stretching or database auth writes.
function configured(env: Pick<Bindings, 'ADMIN_PASSWORD' | 'JWT_SECRET'>): boolean {
  return typeof env.ADMIN_PASSWORD === 'string' && env.ADMIN_PASSWORD.trim().length >= 24
    && typeof env.JWT_SECRET === 'string' && env.JWT_SECRET.trim().length >= 32
    && env.ADMIN_PASSWORD !== env.JWT_SECRET;
}

export async function checkPassword(password: string, expected: string): Promise<boolean> {
  if (!expected?.trim() || password.length > 1024) return false;
  const encoder = new TextEncoder();
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(actualHash, expectedHash);
}

export async function signSession(env: Pick<Bindings, 'ADMIN_PASSWORD' | 'JWT_SECRET'>): Promise<string> {
  if (!configured(env)) throw new AppError('UNAUTHORIZED', 401, 'Đăng nhập quản trị chưa được cấu hình.');
  const iat = Math.floor(Date.now() / 1000);
  return sign({ role: 'ADMIN', iat, exp: iat + SESSION_SECONDS }, env.JWT_SECRET!, 'HS256');
}

export async function authenticate(password: string, env: Pick<Bindings, 'ADMIN_PASSWORD' | 'JWT_SECRET'>): Promise<string> {
  if (!configured(env) || !await checkPassword(password, env.ADMIN_PASSWORD!)) {
    throw new AppError('INVALID_CREDENTIALS', 401, 'Mật khẩu không đúng hoặc đăng nhập chưa được cấu hình.');
  }
  return signSession(env);
}

export const requireAdmin: MiddlewareHandler<WorkerEnv> = async (c, next) => {
  if (c.req.path === '/api/admin/login' && c.req.method === 'POST') return next();
  const unauthorized = () => new AppError('UNAUTHORIZED', 401, 'Vui lòng đăng nhập quản trị.');
  const token = getCookie(c, ADMIN_COOKIE);
  if (!configured(c.env) || !token || token.length > 2048) throw unauthorized();
  try {
    const payload = await verify(token, c.env.JWT_SECRET!, 'HS256');
    const now = Math.floor(Date.now() / 1000);
    if (payload.role !== 'ADMIN' || !Number.isInteger(payload.iat) || !Number.isInteger(payload.exp)
      || payload.iat! > now || payload.exp! <= now || payload.exp! <= payload.iat!
      || payload.exp! - payload.iat! > SESSION_SECONDS) throw unauthorized();
  } catch {
    // Never log verifier errors: they can include bearer tokens.
    throw unauthorized();
  }
  await next();
};

export const requireSameOrigin: MiddlewareHandler<WorkerEnv> = async (c, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(c.req.method)) {
    // Compare the complete origin (scheme, host and port), including on login/logout.
    if (c.req.header('Origin') !== new URL(c.req.url).origin) {
      throw new AppError('FORBIDDEN', 403, 'Nguồn yêu cầu không hợp lệ.');
    }
    const mediaType = c.req.header('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
    if (mediaType !== 'application/json') {
      throw new AppError('VALIDATION_ERROR', 400, 'Yêu cầu cần Content-Type application/json.');
    }
  }
  await next();
};
