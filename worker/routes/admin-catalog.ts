import { Hono } from 'hono';
import type { WorkerEnv } from '../env.ts';
import { adminCatalogIdSchema, adminProductCreateSchema, adminProductPatchSchema,
  adminVariantPatchSchema, adminDeliveryZoneSchema } from '../../shared/admin-catalog-schemas.ts';
import { validate } from '../lib/validate.ts';
import { listAdministrativeAreas } from '../services/administrative-areas.ts';
import { listAdminProducts, createAdminProduct, patchAdminProduct, patchAdminVariant,
  listAdminDeliveryZones, createAdminDeliveryZone, putAdminDeliveryZone } from '../services/admin-catalog.ts';

export const adminCatalogRoutes = new Hono<WorkerEnv>();
adminCatalogRoutes.get('/products', async c => c.json({ data: { items: await listAdminProducts(c.env.DB) } }));
adminCatalogRoutes.post('/products', validate('json', adminProductCreateSchema), async c =>
  c.json({ data: await createAdminProduct(c.env.DB, c.req.valid('json')) }, 201));
adminCatalogRoutes.patch('/products/:id', validate('param', adminCatalogIdSchema), validate('json', adminProductPatchSchema), async c =>
  c.json({ data: await patchAdminProduct(c.env.DB, c.req.valid('param').id, c.req.valid('json')) }));
adminCatalogRoutes.patch('/variants/:id', validate('param', adminCatalogIdSchema), validate('json', adminVariantPatchSchema), async c =>
  c.json({ data: await patchAdminVariant(c.env.DB, c.req.valid('param').id, c.req.valid('json')) }));
adminCatalogRoutes.get('/delivery-zones', async c => c.json({ data: {
  items: await listAdminDeliveryZones(c.env.DB), provinces: await listAdministrativeAreas(c.env.DB),
} }));
adminCatalogRoutes.post('/delivery-zones', validate('json', adminDeliveryZoneSchema), async c =>
  c.json({ data: await createAdminDeliveryZone(c.env.DB, c.req.valid('json')) }, 201));
adminCatalogRoutes.put('/delivery-zones/:id', validate('param', adminCatalogIdSchema), validate('json', adminDeliveryZoneSchema), async c =>
  c.json({ data: await putAdminDeliveryZone(c.env.DB, c.req.valid('param').id, c.req.valid('json')) }));
