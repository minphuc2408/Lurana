import type { MiddlewareHandler } from 'hono';
import type { WorkerEnv } from '../env.ts';
import { AppError } from './errors.ts';

/** Cloudflare supplies this header; never use a client-supplied X-Forwarded-For. */
export const rateLimit: MiddlewareHandler<WorkerEnv> = async (c, next) => {
  const path = c.req.path.replace(/\/$/, '');
  const sensitive = c.req.method === 'POST' && ['/api/orders', '/api/admin/login'].includes(path);
  const publicRead = (c.req.method === 'POST' && ['/api/orders/lookup', '/api/checkout/quote'].includes(path))
    || (c.req.method === 'GET' && /^\/api\/(categories|products(?:\/[^/]+)?|delivery\/options)$/.test(path));
  if (!sensitive && !publicRead) return next();
  const limiter = sensitive ? c.env.RATE_LIMIT_SENSITIVE : c.env.RATE_LIMIT_PUBLIC;
  if (!limiter) {
    // Node unit tests and the isolated loopback smoke harness have no bindings.
    if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(c.req.url).hostname)) {
      throw new AppError('INTERNAL', 503, 'Dịch vụ bảo vệ chưa được cấu hình.');
    }
  } else {
    const { success } = await limiter.limit({ key: `${path}:${c.req.header('CF-Connecting-IP') || 'unknown'}` });
    if (!success) {
      c.header('Retry-After', '60');
      throw new AppError('RATE_LIMITED', 429, 'Quá nhiều yêu cầu. Vui lòng chờ một phút rồi thử lại.');
    }
  }
  await next();
};
