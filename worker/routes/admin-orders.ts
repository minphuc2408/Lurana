import { Hono } from 'hono';
import type { WorkerEnv } from '../env.ts';
import { adminOrderNoteSchema, adminOrderParamSchema, adminOrderStatusSchema, adminOrdersQuerySchema } from '../../shared/admin-order-schemas.ts';
import { validate } from '../lib/validate.ts';
import { changeAdminOrderStatus, getAdminOrder, getAdminSummary, listAdminOrders, updateAdminOrderNote } from '../services/admin-orders.ts';

// The parent /api/admin router requires authentication and same-origin JSON writes.
export const adminOrderRoutes = new Hono<WorkerEnv>();
adminOrderRoutes.get('/summary', async c => c.json({ data: await getAdminSummary(c.env.DB) }));
adminOrderRoutes.get('/orders', validate('query', adminOrdersQuerySchema), async c =>
  c.json({ data: await listAdminOrders(c.env.DB, c.req.query()) }));
adminOrderRoutes.get('/orders/:orderNumber', validate('param', adminOrderParamSchema), async c =>
  c.json({ data: await getAdminOrder(c.env.DB, c.req.valid('param').orderNumber) }));
adminOrderRoutes.patch('/orders/:orderNumber/status', validate('param', adminOrderParamSchema), validate('json', adminOrderStatusSchema), async c =>
  c.json({ data: await changeAdminOrderStatus(c.env.DB, c.req.valid('param').orderNumber, c.req.valid('json')) }));
adminOrderRoutes.patch('/orders/:orderNumber/note', validate('param', adminOrderParamSchema), validate('json', adminOrderNoteSchema), async c =>
  c.json({ data: await updateAdminOrderNote(c.env.DB, c.req.valid('param').orderNumber, c.req.valid('json')) }));
