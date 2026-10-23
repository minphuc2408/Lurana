import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { productImportRequestSchema } from '../../shared/product-import.ts';
import { createProductWorkbook, encodeWorkbook } from '../services/product-workbook.ts';
import { importProducts } from '../services/product-import.ts';
import { AppError } from '../lib/errors.ts';
import type { WorkerEnv } from '../env.ts';
import { adminCatalogIdSchema, adminProductCreateSchema, adminProductPatchSchema,
  adminVariantPatchSchema, adminDeliveryZoneSchema } from '../../shared/admin-catalog-schemas.ts';
import { validate } from '../lib/validate.ts';
import { listAdministrativeAreas } from '../services/administrative-areas.ts';
import { listAdminProducts, createAdminProduct, patchAdminProduct, patchAdminVariant,
  listAdminDeliveryZones, createAdminDeliveryZone, putAdminDeliveryZone } from '../services/admin-catalog.ts';

export const adminCatalogRoutes = new Hono<WorkerEnv>();
adminCatalogRoutes.get('/products/import-template', async c => {
  const categories = await c.env.DB.prepare('SELECT id, code, name_vi, name_en FROM categories WHERE is_active = 1 ORDER BY sort_order, id')
    .all<{ id: number; code: string; name_vi: string; name_en: string }>();
  return c.json({ data: { file_name: 'lunarra-products-template.xlsx', content_base64: encodeWorkbook(await createProductWorkbook(categories.results)) } });
});
adminCatalogRoutes.post('/products/import', bodyLimit({ maxSize: 1_400_000, onError: () => {
  throw new AppError('VALIDATION_ERROR', 400, 'File Excel phải nhỏ hơn hoặc bằng 1 MB.', [{ path: 'file', message: 'File quá lớn.' }]);
} }), validate('json', productImportRequestSchema), async c => {
  const input = c.req.valid('json');
  return c.json({ data: await importProducts(c.env.DB, input.content_base64, input.validate_only) }, input.validate_only ? 200 : 201);
});
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
