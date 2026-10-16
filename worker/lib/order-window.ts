import { todayInVN } from './datetime.ts';

export function recentOrderDates(days: number, now = new Date()) {
  const to = todayInVN(now);
  return { from: new Date(Date.parse(`${to}T00:00:00Z`) - (days - 1) * 86400000).toISOString().slice(0, 10), to };
}

/** Raw ranges let SQLite use idx_orders_placed_at for both stored UTC formats. */
export function orderDateWindow(from: string, to: string) {
  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(Date.parse(`${to}T00:00:00+07:00`) + 86400000);
  const iso = [start.toISOString(), end.toISOString()];
  return {
    sql: `((placed_at >= ? AND placed_at < ? AND substr(placed_at, 11, 1) = 'T')
      OR (placed_at >= ? AND placed_at < ? AND substr(placed_at, 11, 1) = ' '))`,
    values: [...iso, ...iso.map(value => value.replace('T', ' ').replace('.000Z', ''))],
  };
}
