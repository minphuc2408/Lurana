import { orderSchema, lookupOrderSchema } from '../../shared/schemas.ts';
import { AppError } from '../lib/errors.ts';
import { parseSchema } from '../lib/validate.ts';
import { toIso, validateDeliverySlot } from '../lib/datetime.ts';
import { isUuid, newOrderNumber } from '../lib/ids.ts';
import { priceCart, type CartQuote } from './pricing.ts';

export interface OrderSummary {
  order_number: string;
  status_code: string;
  payment_method: 'COD';
  payment_status: 'UNPAID' | 'PAID';
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  grand_total: number;
  placed_at: string;
}

interface OrderRow extends OrderSummary {
  id: number;
  sender_name: string;
  sender_phone: string;
  sender_email: string | null;
  is_anonymous: number;
  recipient_name: string;
  recipient_phone: string;
  province_name: string;
  ward_name: string;
  address_line: string;
  delivery_method_code: string;
  delivery_date: string;
  delivery_time_slot: string;
  card_type: string;
  card_message: string | null;
  customer_note: string | null;
  stock_released: number;
  delivered_at: string | null;
  paid_at: string | null;
}

interface ItemRow {
  variant_id: number | null;
  sku_snapshot: string;
  name_vi_snapshot: string;
  name_en_snapshot: string;
  size_snapshot: string;
  image_url_snapshot: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface HistoryRow {
  from_status: string | null;
  to_status: string;
  note: string | null;
  occurred_at: string;
}

function summary(order: OrderSummary): OrderSummary {
  return {
    order_number: order.order_number, status_code: order.status_code,
    payment_method: order.payment_method, payment_status: order.payment_status,
    subtotal: order.subtotal, discount_total: order.discount_total,
    delivery_fee: order.delivery_fee, grand_total: order.grand_total,
    placed_at: toIso(order.placed_at),
  };
}

const summaryColumns = `order_number, status_code, payment_method, payment_status,
  subtotal, discount_total, delivery_fee, grand_total, placed_at`;
const orderColumns = `${summaryColumns}, id, sender_name, sender_phone, sender_email, is_anonymous,
  recipient_name, recipient_phone, province_name, ward_name, address_line,
  delivery_method_code, delivery_date, delivery_time_slot, card_type, card_message,
  customer_note, stock_released, delivered_at, paid_at`;
const itemColumns = `variant_id, sku_snapshot, name_vi_snapshot, name_en_snapshot,
  size_snapshot, image_url_snapshot, unit_price, quantity, line_total`;

async function replay(db: D1Database, key: string): Promise<OrderSummary | null> {
  const row = await db.prepare(`SELECT ${summaryColumns} FROM orders WHERE idempotency_key = ?`)
    .bind(key).first<OrderSummary>();
  return row ? summary(row) : null;
}

/** Counts every submitted statement, including failed batches, before permitting a retry. */
export async function createOrder(db: D1Database, body: unknown, idempotencyKey: string) {
  const input = parseSchema(orderSchema, body);
  if (!isUuid(idempotencyKey)) throw new AppError('VALIDATION_ERROR', 400, 'Dữ liệu không hợp lệ.',
    [{ path: 'Idempotency-Key', message: 'Cần Idempotency-Key là UUID v4.' }]);
  const key = idempotencyKey.toLowerCase();
  let usedStatements = 1;
  const existing = await replay(db, key);
  if (existing) return { data: existing, replayed: true };

  const quote = await priceCart(db, input.items, input.recipient.province_name,
    input.recipient.ward_name, input.delivery.method_code);
  usedStatements += 2;
  const unavailable = quote.issues.filter(issue => issue.code === 'VARIANT_UNAVAILABLE');
  if (unavailable.length) throw new AppError('VARIANT_UNAVAILABLE', 409, 'Sản phẩm không còn được bán.', unavailable);
  const insufficient = quote.issues.filter(issue => issue.code === 'OUT_OF_STOCK');
  if (insufficient.length) throw new AppError('OUT_OF_STOCK', 409, 'Sản phẩm không đủ tồn kho.',
    insufficient.map(issue => ({ variant_id: issue.variant_id,
      requested: quote.lines.find(line => line.variant_id === issue.variant_id)!.quantity,
      available: issue.available })));
  validateDeliverySlot(input.delivery.date, input.delivery.time_slot, input.delivery.method_code);

  const placedAt = new Date().toISOString();
  const batchSize = 2 * quote.lines.length + 2;
  for (let attempt = 0; attempt < 3; attempt++) {
    // Reserve one diagnostic read even if the attempted batch fails on its last statement.
    if (usedStatements + batchSize + 1 > 40) {
      throw new AppError('CONFLICT', 409, 'Chưa thể tạo mã đơn. Vui lòng thử lại.');
    }
    const orderNumber = newOrderNumber();
    const batch: D1PreparedStatement[] = [db.prepare(`
      INSERT INTO orders (order_number, idempotency_key, sender_name, sender_phone, sender_email,
        is_anonymous, recipient_name, recipient_phone, province_name, ward_name, address_line,
        delivery_method_code, delivery_date, delivery_time_slot, card_type, card_message,
        customer_note, subtotal, discount_total, delivery_fee, grand_total, placed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(orderNumber, key, input.sender.name, input.sender.phone, input.sender.email ?? null,
      Number(input.sender.is_anonymous), input.recipient.name, input.recipient.phone,
      input.recipient.province_name, input.recipient.ward_name, input.recipient.address_line,
      input.delivery.method_code, input.delivery.date, input.delivery.time_slot, input.card.type,
      input.card.type === 'NONE' ? null : input.card.message ?? null, input.customer_note ?? null,
      quote.subtotal, quote.discount_total, quote.delivery_fee, quote.grand_total, placedAt)];
    for (const line of quote.lines) batch.push(db.prepare(`
      INSERT INTO order_items (order_id, product_id, variant_id, sku_snapshot, name_vi_snapshot,
        name_en_snapshot, size_snapshot, image_url_snapshot, unit_price, quantity, line_total)
      VALUES ((SELECT id FROM orders WHERE order_number = ?),
        (SELECT product_id FROM product_variants WHERE id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(orderNumber, line.variant_id, line.variant_id, line.sku, line.name_vi, line.name_en,
      line.size_code, line.image_url, line.unit_price, line.quantity, line.line_total));
    for (const line of quote.lines) batch.push(db.prepare(`
      UPDATE product_variants SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(line.quantity, line.variant_id));
    batch.push(db.prepare(`
      INSERT INTO order_status_history (order_id, from_status, to_status, actor_label, note)
      VALUES ((SELECT id FROM orders WHERE order_number = ?), NULL, 'PENDING', 'CUSTOMER', ?)
    `).bind(orderNumber, 'Đặt hàng'));

    usedStatements += batch.length;
    try {
      await db.batch(batch);
    } catch (error) {
      // D1 wraps the SQLite message in Error.cause in some runtime versions.
      const message = databaseErrorMessage(error);
      if (message.includes('CHECK constraint failed') && message.includes('stock_quantity')) {
        return await stockFailure(db, quote);
      }
      if (message.includes('UNIQUE constraint failed: orders.idempotency_key')) {
        const winner = await replay(db, key);
        if (winner) return { data: winner, replayed: true };
        throw error;
      }
      if (message.includes('UNIQUE constraint failed: orders.order_number')) {
        if (attempt < 2) continue;
        throw new AppError('CONFLICT', 409, 'Chưa thể tạo mã đơn. Vui lòng thử lại.');
      }
      throw error;
    }
    return { data: summary({ order_number: orderNumber, status_code: 'PENDING', payment_method: 'COD',
      payment_status: 'UNPAID', subtotal: quote.subtotal, discount_total: quote.discount_total,
      delivery_fee: quote.delivery_fee, grand_total: quote.grand_total, placed_at: placedAt }), replayed: false };
  }
  throw new AppError('CONFLICT', 409, 'Chưa thể tạo mã đơn. Vui lòng thử lại.');
}

function databaseErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return '';
  return `${error.message} ${error.cause instanceof Error ? error.cause.message : ''}`;
}

async function stockFailure(db: D1Database, quote: CartQuote): Promise<never> {
  const ids = quote.lines.map(line => line.variant_id);
  const { results } = await db.prepare(`SELECT id, stock_quantity FROM product_variants
    WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids)
    .all<{ id: number; stock_quantity: number }>();
  const available = new Map(results.map(row => [row.id, row.stock_quantity]));
  const shortages = quote.lines.filter(line => line.quantity > (available.get(line.variant_id) ?? 0));
  // Even if a cancellation replenished stock before this read, never retry a failed purchase implicitly.
  throw new AppError('OUT_OF_STOCK', 409, 'Sản phẩm không đủ tồn kho.',
    (shortages.length ? shortages : quote.lines).map(line => ({ variant_id: line.variant_id,
      requested: line.quantity, available: available.get(line.variant_id) ?? 0 })));
}

export async function lookupOrder(db: D1Database, body: unknown) {
  const input = parseSchema(lookupOrderSchema, body);
  const order = await db.prepare(`SELECT ${orderColumns} FROM orders
    WHERE order_number = ? AND (sender_phone = ? OR recipient_phone = ?)`)
    .bind(input.order_number, input.phone, input.phone).first<OrderRow>();
  if (!order) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy đơn hàng.');
  const [{ results: items }, { results: history }] = await db.batch([
    db.prepare(`SELECT ${itemColumns} FROM order_items WHERE order_id = ? ORDER BY id`).bind(order.id),
    db.prepare(`SELECT from_status, to_status, note, occurred_at FROM order_status_history
      WHERE order_id = ? ORDER BY occurred_at, id`).bind(order.id),
  ]);
  return {
    ...summary(order),
    sender: { name: order.sender_name, phone: order.sender_phone, email: order.sender_email,
      is_anonymous: Boolean(order.is_anonymous) },
    recipient: { name: order.recipient_name, phone: order.recipient_phone, province_name: order.province_name,
      ward_name: order.ward_name, address_line: order.address_line },
    delivery: { method_code: order.delivery_method_code, date: order.delivery_date, time_slot: order.delivery_time_slot },
    card: { type: order.card_type, message: order.card_message }, customer_note: order.customer_note,
    items: (items as unknown as ItemRow[]).map(row => ({ sku: row.sku_snapshot, name_vi: row.name_vi_snapshot,
      name_en: row.name_en_snapshot, size: row.size_snapshot, image_url: row.image_url_snapshot,
      unit_price: row.unit_price, quantity: row.quantity, line_total: row.line_total })),
    timeline: (history as unknown as HistoryRow[]).map(row => ({ ...row, occurred_at: toIso(row.occurred_at) })),
    delivered_at: order.delivered_at ? toIso(order.delivered_at) : null,
    paid_at: order.paid_at ? toIso(order.paid_at) : null,
  };
}

const transitions: Record<string, readonly string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['IN_TRANSIT', 'CANCELLED'], IN_TRANSIT: ['DELIVERED'], DELIVERED: [], CANCELLED: [],
};

/** Internal service only. Phase 4 must authorize the actor before calling it. */
export async function transitionOrder(db: D1Database, orderNumber: string, newStatus: string,
  actorLabel: 'ADMIN' | 'CUSTOMER' | 'SYSTEM' = 'ADMIN', note?: string): Promise<OrderSummary> {
  const order = await db.prepare(`SELECT ${orderColumns} FROM orders WHERE order_number = ?`)
    .bind(orderNumber).first<OrderRow>();
  if (!order) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy đơn hàng.');
  const invalid = () => new AppError('INVALID_TRANSITION', 409, 'Không thể chuyển trạng thái đơn hàng.');
  if (!transitions[order.status_code]?.includes(newStatus)) throw invalid();
  const { results: items } = await db.prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ?')
    .bind(order.id).all<{ variant_id: number | null; quantity: number }>();
  const batch: D1PreparedStatement[] = [];
  if (newStatus === 'CANCELLED') {
    for (const item of items) {
      if (item.variant_id === null) continue;
      batch.push(db.prepare(`
        UPDATE product_variants SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
        WHERE id = ? AND EXISTS (SELECT 1 FROM orders
          WHERE order_number = ? AND status_code = ? AND stock_released = 0)
      `).bind(item.quantity, item.variant_id, orderNumber, order.status_code));
    }
  }
  const updateIndex = batch.length;
  // Only static, server-selected SQL fragments are composed here; all caller data is bound.
  const effect = newStatus === 'CANCELLED' ? ', stock_released = 1'
    : newStatus === 'DELIVERED' ? ", payment_status = 'PAID', paid_at = datetime('now'), delivered_at = datetime('now')" : '';
  const releaseGuard = newStatus === 'CANCELLED' ? ' AND stock_released = 0' : '';
  batch.push(db.prepare(`UPDATE orders SET status_code = ?, updated_at = datetime('now')${effect}
    WHERE order_number = ? AND status_code = ?${releaseGuard}`)
    .bind(newStatus, orderNumber, order.status_code));
  batch.push(db.prepare(`
    INSERT INTO order_status_history (order_id, from_status, to_status, actor_label, note)
    SELECT id, ?, ?, ?, ? FROM orders o WHERE o.order_number = ? AND o.status_code = ?
      AND NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id AND h.to_status = ?)
  `).bind(order.status_code, newStatus, actorLabel, note ?? null, orderNumber, newStatus, newStatus));
  const results = await db.batch(batch);
  if (results[updateIndex].meta.changes !== 1) throw invalid();
  return summary({ ...order, status_code: newStatus,
    payment_status: newStatus === 'DELIVERED' ? 'PAID' : order.payment_status });
}
