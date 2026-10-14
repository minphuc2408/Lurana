import {
  adminProductCreateSchema, adminProductPatchSchema, adminVariantPatchSchema, adminDeliveryZoneSchema,
  type AdminProductCreateInput, type AdminProductPatchInput, type AdminVariantPatchInput, type AdminDeliveryZoneInput,
} from '../../shared/admin-catalog-schemas.ts';
import { AppError } from '../lib/errors.ts';
import { parseSchema } from '../lib/validate.ts';
import type { ProductDTO, ProductImageDTO, ProductVariantDTO } from './catalog.ts';

interface AdminVariant extends Omit<ProductVariantDTO, 'in_stock' | 'low_stock' | 'max_quantity'> {
  product_id: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
}
interface VariantRow extends Omit<AdminVariant, 'is_active'> { is_active: number; }
interface AdminProduct extends Omit<ProductDTO, 'variants'> {
  category_id: number;
  status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
  archived_at: string | null;
  variants: AdminVariant[];
}
interface ProductRow extends Omit<AdminProduct, 'is_featured' | 'variants' | 'images'> { is_featured: number; }
interface ImageRow {
  product_id: number;
  image_url: string;
  alt_vi: string | null;
  alt_en: string | null;
  is_primary: number;
}
interface DeliveryZone {
  id: number;
  province_name: string;
  ward_name: string;
  fee: number;
  free_from_amount: number | null;
  eta_minutes: number | null;
  is_active: boolean;
}
interface ZoneRow extends Omit<DeliveryZone, 'is_active'> { is_active: number; }
const VARIANT_COLUMNS = 'id, product_id, sku, size_code, price, compare_at_price, stock_quantity, low_stock_threshold, is_active';
const ZONE_COLUMNS = 'id, province_name, ward_name, fee, free_from_amount, eta_minutes, is_active';
const variantDTO = (row: VariantRow): AdminVariant => ({ ...row, is_active: row.is_active === 1 });
const zoneDTO = (row: ZoneRow): DeliveryZone => ({ ...row, is_active: row.is_active === 1 });

function validation(message: string, path: string): AppError {
  return new AppError('VALIDATION_ERROR', 400, message, [{ path, message }]);
}
function mapWriteError(error: unknown): never {
  const message = error instanceof Error
    ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ''}` : '';
  if (/UNIQUE constraint failed/i.test(message)) throw new AppError('CONFLICT', 409, 'Thông tin đã tồn tại.');
  if (/FOREIGN KEY constraint failed/i.test(message)) throw validation('Danh mục không tồn tại.', 'category_id');
  if (/CHECK constraint failed.*stock_quantity/i.test(message)) throw validation('Tồn kho không thể âm.', 'stock_delta');
  if (/CHECK constraint failed/i.test(message)) throw validation('Giá trị cập nhật không hợp lệ.', '');
  throw error;
}

// Three bulk queries return every status and inactive variant; no per-product reads or IN bind limit.
export async function listAdminProducts(db: D1Database): Promise<AdminProduct[]> {
  const { results: products } = await db.prepare(`SELECT p.id, p.category_id, c.code AS category_code,
    p.slug, p.name_vi, p.name_en, p.description_vi, p.description_en, p.badge_code,
    p.is_featured, p.status, p.archived_at FROM products p JOIN categories c ON c.id = p.category_id
    ORDER BY p.id`).all<ProductRow>();
  const { results: variants } = await db.prepare(`SELECT ${VARIANT_COLUMNS} FROM product_variants
    ORDER BY product_id, CASE size_code WHEN 'S' THEN 0 WHEN 'M' THEN 1 WHEN 'L' THEN 2
      WHEN 'STANDARD' THEN 3 WHEN 'DELUXE' THEN 4 END, id`).all<VariantRow>();
  const { results: images } = await db.prepare(`SELECT product_id, image_url, alt_vi, alt_en, is_primary
    FROM product_images ORDER BY product_id, sort_order, id`).all<ImageRow>();
  const variantsByProduct = new Map<number, AdminVariant[]>();
  for (const row of variants) {
    const rows = variantsByProduct.get(row.product_id) ?? [];
    rows.push(variantDTO(row));
    variantsByProduct.set(row.product_id, rows);
  }
  const imagesByProduct = new Map<number, ProductImageDTO[]>();
  for (const row of images) {
    const rows = imagesByProduct.get(row.product_id) ?? [];
    rows.push({ url: row.image_url, alt_vi: row.alt_vi, alt_en: row.alt_en, is_primary: row.is_primary === 1 });
    imagesByProduct.set(row.product_id, rows);
  }
  return products.map(row => ({ ...row, is_featured: row.is_featured === 1,
    variants: variantsByProduct.get(row.id) ?? [], images: imagesByProduct.get(row.id) ?? [] }));
}

export async function createAdminProduct(db: D1Database, body: AdminProductCreateInput): Promise<{ id: number }> {
  const input = parseSchema(adminProductCreateSchema, body);
  const now = new Date().toISOString();
  const statements = [db.prepare(`INSERT INTO products (category_id, slug, name_vi, name_en,
    description_vi, description_en, badge_code, is_featured, status, created_at, updated_at, archived_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
    .bind(input.category_id, input.slug, input.name_vi, input.name_en, input.description_vi ?? null,
      input.description_en ?? null, input.badge_code ?? null, Number(input.is_featured), input.status, now, now,
      input.status === 'ARCHIVED' ? now : null)];
  for (const variant of input.variants) {
    statements.push(db.prepare(`INSERT INTO product_variants (product_id, sku, size_code, price,
      compare_at_price, stock_quantity, low_stock_threshold, is_active, updated_at)
      VALUES ((SELECT id FROM products WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(input.slug, variant.sku, variant.size_code, variant.price, variant.compare_at_price ?? null,
        variant.stock_quantity, variant.low_stock_threshold, Number(variant.is_active), now));
  }
  statements.push(db.prepare(`INSERT INTO product_images (product_id, image_url, alt_vi, alt_en, sort_order, is_primary)
    VALUES ((SELECT id FROM products WHERE slug = ?), ?, ?, ?, ?, ?)`)
    .bind(input.slug, input.image.url, input.image.alt_vi ?? null, input.image.alt_en ?? null, 0, 1));
  try {
    const results = await db.batch<{ id: number }>(statements);
    return { id: results[0].results[0].id };
  } catch (error) { mapWriteError(error); }
}

export async function patchAdminProduct(db: D1Database, id: number, body: AdminProductPatchInput): Promise<{ id: number }> {
  const input = parseSchema(adminProductPatchSchema, body);
  if (!await db.prepare('SELECT id FROM products WHERE id = ?').bind(id).first()) {
    throw new AppError('NOT_FOUND', 404, 'Không tìm thấy sản phẩm.');
  }
  const now = new Date().toISOString();
  const assignments = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];
  // Column names are this fixed allowlist, never values supplied by callers.
  for (const field of ['name_vi', 'name_en', 'description_vi', 'description_en', 'badge_code', 'is_featured', 'status'] as const) {
    if (input[field] === undefined) continue;
    assignments.push(`${field} = ?`);
    const value = input[field];
    values.push(typeof value === 'boolean' ? Number(value) : value);
  }
  if (input.status !== undefined) {
    assignments.push(input.status === 'ARCHIVED' ? 'archived_at = COALESCE(archived_at, ?)' : 'archived_at = ?');
    values.push(input.status === 'ARCHIVED' ? now : null);
  }
  const statements = [db.prepare(`UPDATE products SET ${assignments.join(', ')} WHERE id = ?`).bind(...values, id)];
  if (input.image) {
    const image = input.image;
    statements.push(db.prepare(`UPDATE product_images SET image_url = ?, alt_vi = ?, alt_en = ?,
      cloudinary_public_id = NULL, is_primary = ? WHERE id =
      (SELECT id FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order, id LIMIT 1)`)
      .bind(image.url, image.alt_vi ?? null, image.alt_en ?? null, 1, id));
    statements.push(db.prepare(`INSERT INTO product_images (product_id, image_url, alt_vi, alt_en, sort_order, is_primary)
      SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT id FROM product_images WHERE product_id = ?)`)
      .bind(id, image.url, image.alt_vi ?? null, image.alt_en ?? null, 0, 1, id));
  }
  try { await db.batch(statements); } catch (error) { mapWriteError(error); }
  return { id };
}

export async function patchAdminVariant(db: D1Database, id: number, body: AdminVariantPatchInput): Promise<AdminVariant> {
  const input = parseSchema(adminVariantPatchSchema, body);
  const current = await db.prepare(`SELECT ${VARIANT_COLUMNS} FROM product_variants WHERE id = ?`).bind(id).first<VariantRow>();
  if (!current) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy biến thể.');
  const price = input.price ?? current.price;
  const compare = input.compare_at_price === undefined ? current.compare_at_price : input.compare_at_price;
  if (compare != null && compare < price) {
    throw validation('Giá so sánh phải lớn hơn hoặc bằng giá bán.', 'compare_at_price');
  }
  const assignments = ['updated_at = ?'];
  const values: (string | number | null)[] = [new Date().toISOString()];
  for (const field of ['price', 'compare_at_price', 'low_stock_threshold', 'is_active'] as const) {
    if (input[field] === undefined) continue;
    assignments.push(`${field} = ?`);
    const value = input[field];
    values.push(typeof value === 'boolean' ? Number(value) : value);
  }
  if (input.stock_delta !== undefined) {
    assignments.push('stock_quantity = stock_quantity + ?');
    values.push(input.stock_delta);
  } else if (input.stock_quantity !== undefined) {
    assignments.push('stock_quantity = ?');
    values.push(input.stock_quantity);
  }
  const stockLimit = input.stock_delta === undefined ? '' : ' AND stock_quantity + ? <= ?';
  const stockLimitValues = input.stock_delta === undefined ? [] : [input.stock_delta, Number.MAX_SAFE_INTEGER];
  try {
    const { results } = await db.prepare(`UPDATE product_variants SET ${assignments.join(', ')}
      WHERE id = ?${stockLimit} RETURNING ${VARIANT_COLUMNS}`).bind(...values, id, ...stockLimitValues).all<VariantRow>();
    if (!results[0]) {
      if (input.stock_delta !== undefined) throw validation('Tồn kho vượt giới hạn cho phép.', 'stock_delta');
      throw new AppError('NOT_FOUND', 404, 'Không tìm thấy biến thể.');
    }
    return variantDTO(results[0]);
  } catch (error) { mapWriteError(error); }
}

export async function listAdminDeliveryZones(db: D1Database): Promise<DeliveryZone[]> {
  const { results } = await db.prepare(`SELECT ${ZONE_COLUMNS} FROM delivery_zones ORDER BY province_name, ward_name, id`).all<ZoneRow>();
  return results.map(zoneDTO);
}
export async function createAdminDeliveryZone(db: D1Database, body: AdminDeliveryZoneInput): Promise<DeliveryZone> {
  const input = parseSchema(adminDeliveryZoneSchema, body);
  const now = new Date().toISOString();
  try {
    const { results } = await db.prepare(`INSERT INTO delivery_zones
      (province_name, ward_name, fee, free_from_amount, eta_minutes, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING ${ZONE_COLUMNS}`)
      .bind(input.province_name, input.ward_name, input.fee, input.free_from_amount, input.eta_minutes, Number(input.is_active), now, now).all<ZoneRow>();
    return zoneDTO(results[0]);
  } catch (error) { mapWriteError(error); }
}
export async function putAdminDeliveryZone(db: D1Database, id: number, body: AdminDeliveryZoneInput): Promise<DeliveryZone> {
  const input = parseSchema(adminDeliveryZoneSchema, body);
  try {
    const { results } = await db.prepare(`UPDATE delivery_zones SET province_name = ?, ward_name = ?, fee = ?,
      free_from_amount = ?, eta_minutes = ?, is_active = ?, updated_at = ? WHERE id = ? RETURNING ${ZONE_COLUMNS}`)
      .bind(input.province_name, input.ward_name, input.fee, input.free_from_amount, input.eta_minutes,
        Number(input.is_active), new Date().toISOString(), id).all<ZoneRow>();
    if (!results[0]) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy khu vực giao hàng.');
    return zoneDTO(results[0]);
  } catch (error) { mapWriteError(error); }
}
