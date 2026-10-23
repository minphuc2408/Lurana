import { adminProductsQuerySchema, adminZonesQuerySchema, type AdminProductCounts, type AdminZoneCounts } from '../../shared/admin-list-schemas.ts';
import { normalizeAddressSearch } from '../../shared/delivery-areas.ts';
import { parseSchema } from '../lib/validate.ts';
import { listAdminProducts } from './admin-catalog.ts';
const low = `p.status = 'ACTIVE' AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1 AND v.stock_quantity <= v.low_stock_threshold)`;
const hidden = "p.status != 'ACTIVE'";
export async function listAdminProductPage(db: D1Database, query: unknown) {
  const input = parseSchema(adminProductsQuerySchema, query);
  let ids: number[], counts: AdminProductCounts;
  if (input.q) {
    // Search metadata stays in Worker; hydrate DTOs/children for this page alone.
    const { results } = await db.prepare(`SELECT p.id, p.name_vi, p.name_en, p.slug, p.status, (${low}) AS low_stock,
      (SELECT GROUP_CONCAT(sku, char(31)) FROM product_variants WHERE product_id=p.id) AS skus FROM products p ORDER BY p.id`)
      .all<{ id: number; name_vi: string; name_en: string; slug: string; status: string; low_stock: number; skus: string | null }>();
    const search = normalizeAddressSearch(input.q);
    const matched = results.filter(row => [row.name_vi, row.name_en, row.slug, ...(row.skus?.split('\u001f') ?? [])].some(value => normalizeAddressSearch(value).includes(search)));
    counts = { all: matched.length, low: matched.filter(row => row.low_stock).length, hidden: matched.filter(row => row.status !== 'ACTIVE').length };
    ids = matched.filter(row => input.filter === 'all' || (input.filter === 'low' ? row.low_stock : row.status !== 'ACTIVE')).slice(input.offset, input.offset + input.limit).map(row => row.id);
  } else {
    const where = input.filter === 'low' ? ` WHERE ${low}` : input.filter === 'hidden' ? ` WHERE ${hidden}` : '';
    const [page, aggregate] = await db.batch([
      db.prepare(`SELECT p.id FROM products p${where} ORDER BY p.id LIMIT ? OFFSET ?`).bind(input.limit, input.offset),
      db.prepare(`SELECT COUNT(*) AS all_count, COALESCE(SUM(${low}),0) AS low_count, COALESCE(SUM(${hidden}),0) AS hidden_count FROM products p`),
    ]);
    ids = (page.results as unknown as { id: number }[]).map(row => row.id);
    const row = aggregate.results[0] as unknown as { all_count: number; low_count: number; hidden_count: number };
    counts = { all: Number(row.all_count), low: Number(row.low_count), hidden: Number(row.hidden_count) };
  }
  return { items: await listAdminProducts(db, ids), total: counts[input.filter], counts, limit: input.limit, offset: input.offset };
}
export async function listAdminZonePage(db: D1Database, query: unknown) {
  const input = parseSchema(adminZonesQuerySchema, query);
  let counts: AdminZoneCounts, ids: number[] | undefined;
  if (input.q) {
    const { results } = await db.prepare('SELECT id, province_name, ward_name, is_active FROM delivery_zones ORDER BY province_name, ward_name, id')
      .all<{ id: number; province_name: string; ward_name: string; is_active: number }>();
    const search = normalizeAddressSearch(input.q);
    const matched = results.filter(row => normalizeAddressSearch(`${row.province_name} ${row.ward_name}`).includes(search));
    const active = matched.filter(row => row.is_active === 1).length;
    counts = { all: matched.length, active, inactive: matched.length - active };
    ids = matched.filter(row => input.filter === 'all' || row.is_active === Number(input.filter === 'active')).slice(input.offset, input.offset + input.limit).map(row => row.id);
  } else {
    const aggregate = await db.prepare('SELECT COUNT(*) AS all_count, COALESCE(SUM(is_active),0) AS active_count FROM delivery_zones').first<{ all_count: number; active_count: number }>();
    const all = Number(aggregate?.all_count ?? 0), active = Number(aggregate?.active_count ?? 0);
    counts = { all, active, inactive: all - active };
  }
  const where = ids ? ` WHERE id IN (${ids.map(() => '?').join(',')})` : input.filter === 'all' ? '' : ' WHERE is_active = ?';
  const values = ids ?? (input.filter === 'all' ? [] : [Number(input.filter === 'active')]);
  const { results } = ids?.length === 0 ? { results: [] } : await db.prepare(`SELECT id, province_name, ward_name, fee, free_from_amount, eta_minutes, is_active FROM delivery_zones${where} ORDER BY province_name, ward_name, id LIMIT ? OFFSET ?`)
    .bind(...values, input.limit, ids ? 0 : input.offset).all<{ id: number; province_name: string; ward_name: string; fee: number; free_from_amount: number | null; eta_minutes: number | null; is_active: number }>();
  return { items: results.map(row => ({ ...row, is_active: row.is_active === 1 })), total: counts[input.filter], counts, limit: input.limit, offset: input.offset };
}
