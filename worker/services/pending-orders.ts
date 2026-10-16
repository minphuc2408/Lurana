import type { Bindings } from '../env.ts';

/** Three atomic statements, regardless of order/line count; safe under overlapping ticks. */
export async function expirePendingOrders(env: Bindings, now = new Date()): Promise<void> {
  if (!env.PENDING_ORDER_TTL_HOURS?.trim()) return;
  const hours = Number(env.PENDING_ORDER_TTL_HOURS);
  if (!Number.isInteger(hours) || hours < 1 || hours > 168) throw new Error('Invalid pending-order expiry configuration');
  const cutoff = new Date(now.getTime() - hours * 3600000).toISOString();
  const expired = `o.status_code = 'PENDING' AND o.stock_released = 0
    AND julianday(o.placed_at) < julianday(?)`;
  // D1 batches are transactions. No confirmation/cancellation can interleave these
  // statements; each filters the current PENDING rows, never a stale pre-read list.
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO order_status_history (order_id, from_status, to_status, actor_label, note)
      SELECT o.id, 'PENDING', 'CANCELLED', 'SYSTEM', ? FROM orders o WHERE ${expired}`)
      .bind('Tự hủy: quá hạn xác nhận đơn.', cutoff),
    env.DB.prepare(`WITH released AS (
      SELECT i.variant_id, SUM(i.quantity) AS quantity FROM order_items i
      JOIN orders o ON o.id = i.order_id
      WHERE ${expired} AND i.variant_id IS NOT NULL GROUP BY i.variant_id
    ) UPDATE product_variants SET stock_quantity = stock_quantity +
      (SELECT quantity FROM released WHERE variant_id = product_variants.id), updated_at = datetime('now')
      WHERE id IN (SELECT variant_id FROM released)`).bind(cutoff),
    env.DB.prepare(`UPDATE orders AS o SET status_code = 'CANCELLED', stock_released = 1,
      updated_at = datetime('now') WHERE ${expired}`).bind(cutoff),
  ]);
}
