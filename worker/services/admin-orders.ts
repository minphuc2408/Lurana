import { ORDER_STATUSES } from '../../shared/constants.ts';
import { adminOrderNoteSchema, adminOrderStatusSchema, adminOrdersQuerySchema } from '../../shared/admin-order-schemas.ts';
import { AppError } from '../lib/errors.ts';
import { todayInVN, toIso } from '../lib/datetime.ts';
import { parseSchema } from '../lib/validate.ts';
import { transitionOrder } from './orders.ts';

interface AdminOrderRow {
  id: number;
  order_number: string;
  status_code: string;
  payment_method: string;
  payment_status: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_date: string;
  delivery_time_slot: string;
  grand_total: number;
  placed_at: string;
}
interface AdminOrderDetailRow extends AdminOrderRow {
  sender_email: string | null;
  is_anonymous: number;
  province_name: string;
  ward_name: string;
  address_line: string;
  delivery_method_code: string;
  card_type: string;
  card_message: string | null;
  customer_note: string | null;
  admin_note: string | null;
  stock_released: number;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  paid_at: string | null;
  delivered_at: string | null;
}
interface AdminItemRow {
  sku_snapshot: string;
  name_vi_snapshot: string;
  name_en_snapshot: string;
  size_snapshot: string;
  image_url_snapshot: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}
interface AdminTimelineRow {
  from_status: string | null;
  to_status: string;
  actor_label: string;
  note: string | null;
  occurred_at: string;
}

const listColumns = `id, order_number, status_code, payment_method, payment_status,
  sender_name, sender_phone, recipient_name, recipient_phone,
  delivery_date, delivery_time_slot, grand_total, placed_at`;
const detailColumns = `${listColumns}, sender_email, is_anonymous, province_name, ward_name,
  address_line, delivery_method_code, card_type, card_message, customer_note, admin_note,
  stock_released, subtotal, discount_total, delivery_fee, paid_at, delivered_at`;

/** Three aggregate statements; VN midnight boundaries remain correct for both D1 timestamp formats. */
export async function getAdminSummary(db: D1Database, now = new Date()) {
  const start = new Date(`${todayInVN(now)}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 86400000);
  const [statusResult, todayResult, stockResult] = await db.batch<{ status_code: string; count: number }>([
    db.prepare('SELECT status_code, COUNT(*) AS count FROM orders GROUP BY status_code'),
    db.prepare('SELECT COUNT(*) AS count FROM orders WHERE datetime(placed_at) >= datetime(?) AND datetime(placed_at) < datetime(?)')
      .bind(start.toISOString(), end.toISOString()),
    db.prepare('SELECT COUNT(*) AS count FROM product_variants WHERE stock_quantity <= low_stock_threshold'),
  ]);
  const ordersByStatus: Record<string, number> = Object.fromEntries(ORDER_STATUSES.map(status => [status, 0]));
  for (const row of statusResult.results as unknown as { status_code: string; count: number }[]) {
    ordersByStatus[row.status_code] = row.count;
  }
  return { orders_by_status: ordersByStatus,
    today_orders: Number(todayResult.results[0]?.count ?? 0),
    low_stock_count: Number(stockResult.results[0]?.count ?? 0) };
}

export async function listAdminOrders(db: D1Database, query: unknown) {
  const input = parseSchema(adminOrdersQuerySchema, query);
  const filters: string[] = [];
  const values: (string | number)[] = [];
  if (input.status) { filters.push('status_code = ?'); values.push(input.status); }
  if (input.date) { filters.push('delivery_date = ?'); values.push(input.date); }
  if (input.q) {
    const pattern = `%${input.q.replace(/[\\%_]/g, '\\$&')}%`;
    filters.push(`(order_number LIKE ? ESCAPE '\\' OR sender_phone LIKE ? ESCAPE '\\'
      OR recipient_phone LIKE ? ESCAPE '\\' OR sender_name LIKE ? ESCAPE '\\' OR recipient_name LIKE ? ESCAPE '\\')`);
    values.push(pattern, pattern, pattern, pattern, pattern);
  }
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
  const [listResult, countResult] = await db.batch([
    db.prepare(`SELECT ${listColumns} FROM orders${where} ORDER BY placed_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...values, input.limit, input.offset),
    db.prepare(`SELECT COUNT(*) AS total FROM orders${where}`).bind(...values),
  ]);
  return { items: (listResult.results as unknown as AdminOrderRow[]).map(row => ({ ...row, placed_at: toIso(row.placed_at) })),
    total: Number((countResult.results as unknown as { total: number }[])[0]?.total ?? 0) };
}

/** An authorized projection independent of public lookup; no secrets or idempotency keys are selected. */
export async function getAdminOrder(db: D1Database, orderNumber: string) {
  const order = await db.prepare(`SELECT ${detailColumns} FROM orders WHERE order_number = ?`)
    .bind(orderNumber).first<AdminOrderDetailRow>();
  if (!order) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy đơn hàng.');
  const [itemResult, historyResult] = await db.batch([
    db.prepare(`SELECT sku_snapshot, name_vi_snapshot, name_en_snapshot, size_snapshot,
      image_url_snapshot, unit_price, quantity, line_total FROM order_items WHERE order_id = ? ORDER BY id`).bind(order.id),
    db.prepare(`SELECT from_status, to_status, actor_label, note, occurred_at FROM order_status_history
      WHERE order_id = ? ORDER BY occurred_at, id`).bind(order.id),
  ]);
  return {
    order_number: order.order_number, status_code: order.status_code,
    payment_method: order.payment_method, payment_status: order.payment_status,
    subtotal: order.subtotal, discount_total: order.discount_total,
    delivery_fee: order.delivery_fee, grand_total: order.grand_total, placed_at: toIso(order.placed_at),
    sender: { name: order.sender_name, phone: order.sender_phone, email: order.sender_email,
      is_anonymous: Boolean(order.is_anonymous) },
    recipient: { name: order.recipient_name, phone: order.recipient_phone, province_name: order.province_name,
      ward_name: order.ward_name, address_line: order.address_line },
    delivery: { method_code: order.delivery_method_code, date: order.delivery_date, time_slot: order.delivery_time_slot },
    card: { type: order.card_type, message: order.card_message }, customer_note: order.customer_note,
    admin_note: order.admin_note, stock_released: Boolean(order.stock_released),
    items: (itemResult.results as unknown as AdminItemRow[]).map(row => ({ sku: row.sku_snapshot,
      name_vi: row.name_vi_snapshot, name_en: row.name_en_snapshot, size: row.size_snapshot,
      image_url: row.image_url_snapshot, unit_price: row.unit_price, quantity: row.quantity, line_total: row.line_total })),
    timeline: (historyResult.results as unknown as AdminTimelineRow[]).map(row => ({ ...row, occurred_at: toIso(row.occurred_at) })),
    delivered_at: order.delivered_at ? toIso(order.delivered_at) : null,
    paid_at: order.paid_at ? toIso(order.paid_at) : null,
  };
}

export async function changeAdminOrderStatus(db: D1Database, orderNumber: string, body: unknown) {
  const input = parseSchema(adminOrderStatusSchema, body);
  return transitionOrder(db, orderNumber, input.to_status, 'ADMIN', input.note);
}

export async function updateAdminOrderNote(db: D1Database, orderNumber: string, body: unknown) {
  const input = parseSchema(adminOrderNoteSchema, body);
  const result = await db.prepare(`UPDATE orders SET admin_note = ?, updated_at = datetime('now') WHERE order_number = ?`)
    .bind(input.admin_note, orderNumber).run();
  if (result.meta.changes !== 1) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy đơn hàng.');
  return { order_number: orderNumber, admin_note: input.admin_note };
}
