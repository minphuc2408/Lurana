import { AppError } from '../lib/errors.ts';
export async function getAdminVariant(db: D1Database, id: number) {
  const row = await db.prepare('SELECT id, product_id, sku, size_code, price, compare_at_price, stock_quantity, low_stock_threshold, is_active FROM product_variants WHERE id=?')
    .bind(id).first<{ id: number; product_id: number; sku: string; size_code: 'S' | 'M' | 'L' | 'STANDARD' | 'DELUXE'; price: number; compare_at_price: number | null; stock_quantity: number; low_stock_threshold: number; is_active: number }>();
  if (!row) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy kích cỡ sản phẩm.');
  return { ...row, is_active: row.is_active === 1 };
}
export async function deleteAdminVariant(db: D1Database, id: number) {
  await getAdminVariant(db, id);
  const result = await db.prepare(`DELETE FROM product_variants WHERE id=?
    AND EXISTS (SELECT 1 FROM product_variants sibling WHERE sibling.product_id=product_variants.product_id AND sibling.id!=product_variants.id)
    AND NOT EXISTS (SELECT 1 FROM order_items i JOIN orders o ON o.id=i.order_id WHERE i.variant_id=product_variants.id AND o.status_code NOT IN ('DELIVERED','CANCELLED'))`).bind(id).run();
  if (result.meta.changes !== 1) throw new AppError('CONFLICT', 409, 'Không thể xóa kích cỡ cuối cùng hoặc SKU còn trong đơn đang xử lý. Có thể tắt trạng thái để ngừng bán.');
  return { id };
}
export async function deleteAdminZone(db: D1Database, id: number) {
  const result = await db.prepare('DELETE FROM delivery_zones WHERE id=?').bind(id).run();
  if (result.meta.changes !== 1) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy phí giao hàng.');
  return { id };
}
