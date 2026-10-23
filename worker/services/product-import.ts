import type { ProductImportIssue, ProductImportResult } from '../../shared/product-import.ts';
import { AppError } from '../lib/errors.ts';
import { parseProductWorkbook, workbookError } from './product-workbook.ts';

function chunks<T>(values: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size));
}
export async function importProducts(db: D1Database, base64: string, validateOnly: boolean): Promise<ProductImportResult> {
  const products = await parseProductWorkbook(base64);
  const variants = products.flatMap(product => product.variants.map((variant, index) => ({ ...variant, slug: product.slug, row: product.rows[index] })));
  const categories = await db.prepare('SELECT id FROM categories WHERE is_active = 1').all<{ id: number }>();
  const categoryIds = new Set(categories.results.map(row => row.id));
  const issues: ProductImportIssue[] = [];
  for (const product of products) if (!categoryIds.has(product.category_id)) {
    issues.push({ row: product.rows[0], path: 'category_id', message: 'Danh mục không tồn tại hoặc đã tắt. Tải template mới để xem danh mục.' });
  }
  if (issues.length) workbookError('Danh mục không hợp lệ. Chưa có sản phẩm nào được nhập.', issues);
  const slugs = await db.prepare(`SELECT slug FROM products WHERE slug IN (${products.map(() => '?').join(',')})`)
    .bind(...products.map(product => product.slug)).all<{ slug: string }>();
  const existingSlugs = new Set(slugs.results.map(row => row.slug));
  for (const product of products) if (existingSlugs.has(product.slug)) {
    issues.push({ row: product.rows[0], path: 'slug', message: 'Slug đã tồn tại. File chỉ tạo sản phẩm mới.' });
  }
  for (const group of chunks(variants, 100)) {
    const existing = await db.prepare(`SELECT sku FROM product_variants WHERE sku IN (${group.map(() => '?').join(',')})`)
      .bind(...group.map(variant => variant.sku)).all<{ sku: string }>();
    const existingSkus = new Set(existing.results.map(row => row.sku));
    for (const variant of group) if (existingSkus.has(variant.sku)) {
      issues.push({ row: variant.row, path: 'sku', message: 'SKU đã tồn tại. File không cập nhật tồn kho cũ.' });
    }
  }
  if (issues.length) throw new AppError('CONFLICT', 409, 'Slug hoặc SKU đã tồn tại. Chưa có sản phẩm nào được nhập.', issues.slice(0, 100));
  const result: ProductImportResult = { validated: validateOnly, product_count: products.length, variant_count: variants.length,
    products: products.map(product => ({ slug: product.slug, name_vi: product.name_vi, name_en: product.name_en, variant_count: product.variants.length })) };
  if (validateOnly) return result;
  const now = new Date().toISOString();
  // At most 37 submitted statements (5 preflight + 7 products + 25 variants),
  // <=100 binds each. A single D1 batch rolls back every insert on conflict.
  const statements: D1PreparedStatement[] = [];
  for (const group of chunks(products, 8)) {
    statements.push(db.prepare(`INSERT INTO products (category_id, slug, name_vi, name_en, description_vi,
      description_en, badge_code, is_featured, status, created_at, updated_at, archived_at)
      VALUES ${group.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',')}`)
      .bind(...group.flatMap(product => [product.category_id, product.slug, product.name_vi, product.name_en,
        product.description_vi ?? null, product.description_en ?? null, product.badge_code ?? null,
        Number(product.is_featured), product.status, now, now, product.status === 'ARCHIVED' ? now : null])));
  }
  for (const group of chunks(variants, 10)) {
    statements.push(db.prepare(`INSERT INTO product_variants (product_id, sku, size_code, price, compare_at_price,
      stock_quantity, low_stock_threshold, is_active, updated_at)
      VALUES ${group.map(() => '((SELECT id FROM products WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?, ?)').join(',')}`)
      .bind(...group.flatMap(variant => [variant.slug, variant.sku, variant.size_code, variant.price, variant.compare_at_price ?? null,
        variant.stock_quantity, variant.low_stock_threshold, Number(variant.is_active), now])));
  }
  try { await db.batch(statements); }
  catch (error) {
    const message = error instanceof Error ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ''}` : '';
    if (/UNIQUE constraint failed/i.test(message)) throw new AppError('CONFLICT', 409, 'Slug hoặc SKU vừa được tạo. Tải lại kho và kiểm tra file trước khi nhập lại.');
    if (/FOREIGN KEY constraint failed/i.test(message)) workbookError('Danh mục đã thay đổi. Vui lòng tải template mới.');
    throw error;
  }
  return result;
}
