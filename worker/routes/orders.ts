import { Hono } from 'hono';
import type { WorkerEnv } from '../env.ts';
import { orderSchema, lookupOrderSchema } from '../../shared/schemas.ts';
import { validate } from '../lib/validate.ts';
import { verifyTurnstile } from '../lib/turnstile.ts';
import { isUuid } from '../lib/ids.ts';
import { AppError } from '../lib/errors.ts';
import { createOrder, lookupOrder } from '../services/orders.ts';

export const orderRoutes = new Hono<WorkerEnv>();
orderRoutes.post('/', validate('json', orderSchema), async c => {
  const body = c.req.valid('json');
  const key = c.req.header('Idempotency-Key') ?? '';
  if (!isUuid(key)) throw new AppError('VALIDATION_ERROR', 400, 'Dữ liệu không hợp lệ.',
    [{ path: 'Idempotency-Key', message: 'Cần Idempotency-Key là UUID v4.' }]);
  await verifyTurnstile(c.env.TURNSTILE_SECRET, body.turnstile_token, fetch, undefined, { action: 'checkout', hostname: new URL(c.req.url).hostname });
  const result = await createOrder(c.env.DB, body, key);
  return c.json({ data: result.replayed ? { ...result.data, replayed: true } : result.data }, result.replayed ? 200 : 201);
});
orderRoutes.post('/lookup', validate('json', lookupOrderSchema), async c => {
  const body = c.req.valid('json');
  await verifyTurnstile(c.env.TURNSTILE_SECRET, body.turnstile_token, fetch, undefined, { action: 'lookup', hostname: new URL(c.req.url).hostname });
  return c.json({ data: await lookupOrder(c.env.DB, body) });
});
