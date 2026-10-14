import { Hono } from 'hono';
import type { WorkerEnv } from '../env.ts';
import { productsQuerySchema, productSlugSchema, quoteSchema } from '../../shared/schemas.ts';
import { validate } from '../lib/validate.ts';
import { listCategories, listProducts, getProduct } from '../services/catalog.ts';
import { getDeliveryOptions } from '../services/delivery.ts';
import { priceCart } from '../services/pricing.ts';

export const publicRoutes = new Hono<WorkerEnv>();
publicRoutes.get('/categories', async c => c.json({ data: await listCategories(c.env.DB) }));
publicRoutes.get('/products', validate('query', productsQuerySchema), async c =>
  c.json({ data: { items: await listProducts(c.env.DB, c.req.valid('query')) } }));
publicRoutes.get('/products/:slug', validate('param', productSlugSchema), async c =>
  c.json({ data: await getProduct(c.env.DB, c.req.valid('param').slug) }));
publicRoutes.get('/delivery/options', async c => c.json({ data: await getDeliveryOptions(c.env.DB) }));
publicRoutes.post('/checkout/quote', validate('json', quoteSchema), async c => {
  const body = c.req.valid('json');
  return c.json({ data: await priceCart(c.env.DB, body.items, body.province_name, body.ward_name, body.delivery_method_code) });
});
