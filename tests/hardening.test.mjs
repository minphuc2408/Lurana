import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { readLanguage } from '../src/shared/i18n/language.ts';
import { getSiteConfiguration, pageMetadata } from '../src/shared/config/seo.ts';
import { renderSeoHtml, seoPlugin } from '../scripts/seo.mjs';
import { adminProductPatchSchema } from '../shared/admin-catalog-schemas.ts';
import { adminOrdersQuerySchema } from '../shared/admin-order-schemas.ts';
import { handleError, safeErrorDiagnostic } from '../worker/lib/errors.ts';
import { todayInVN } from '../worker/lib/datetime.ts';
import { getAdminSummary, listAdminOrders } from '../worker/services/admin-orders.ts';
import { createOrder } from '../worker/services/orders.ts';
import { createTestDb } from './helpers/worker.mjs';

test('language respects an explicit choice, then browser preferences even when storage is blocked', () => {
  assert.equal(readLanguage(undefined, ['vi-VN', 'en-US']), 'vi');
  assert.equal(readLanguage({ getItem: () => 'en' }, ['vi-VN']), 'en');
  assert.equal(readLanguage({ getItem: () => 'vi' }, ['en-US']), 'vi');
  assert.equal(readLanguage({ getItem() { throw new Error('blocked'); } }, ['fr-FR', 'vi']), 'vi');
  assert.equal(readLanguage(undefined, ['fr-FR']), 'en');
  assert.equal(readLanguage(undefined, ['en-US', 'vi-VN']), 'en');
});

test('product images require approved HTTPS hosts without credentials or custom ports', () => {
  for (const url of ['https://res.cloudinary.com/demo/image/upload/image.jpg', 'https://images.unsplash.com/photo-test']) {
    assert.equal(adminProductPatchSchema.safeParse({ image: { url } }).success, true, url);
  }
  for (const url of ['http://res.cloudinary.com/demo/a.jpg', 'https://untrusted.test/a.jpg',
    'https://res.cloudinary.com.attacker.test/a.jpg', 'https://res.cloudinary.com@attacker.test/a.jpg',
    'https://user:secret@res.cloudinary.com/a.jpg', 'https://res.cloudinary.com:8443/a.jpg', 'data:image/png;base64,a']) {
    assert.equal(adminProductPatchSchema.safeParse({ image: { url } }).success, false, url);
  }
});

test('D1 diagnostics retain actionable codes and constraints without messages, binds or arbitrary names', async () => {
  const privateValue = 'PRIVATE_PHONE_ADDRESS_BIND_0900000000';
  const error = new Error(`D1_ERROR: query failed SQL SELECT '${privateValue}'`, {
    cause: new Error(`UNIQUE constraint failed: orders.order_number: SQLITE_CONSTRAINT ${privateValue}`),
  });
  const diagnostic = safeErrorDiagnostic(error);
  assert.deepEqual(diagnostic, { error_family: 'D1', diagnostic_code: 'SQLITE_CONSTRAINT', constraint: 'UNIQUE', constraint_target: 'orders.order_number' });
  assert.equal(JSON.stringify(diagnostic).includes(privateValue), false);
  assert.deepEqual(safeErrorDiagnostic(new Error(`D1_ERROR: ${privateValue}: SQLITE_FULL`)), { error_family: 'D1', diagnostic_code: 'SQLITE_FULL' });
  assert.deepEqual(safeErrorDiagnostic(new Error(privateValue)), {});
  error.name = privateValue;
  const app = new Hono(); app.onError(handleError);
  app.get('/', () => { throw error; });
  const logs = []; const previous = console.error;
  console.error = (...values) => logs.push(values);
  try {
    const response = await app.request('/');
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.error.code, 'INTERNAL');
    assert.equal(logs[0][1].error_name, 'Error');
    assert.equal(logs[0][1].diagnostic_code, 'SQLITE_CONSTRAINT');
    assert.equal(logs[0][1].request_id, body.error.details.request_id);
    assert.equal(JSON.stringify({ logs, body }).includes(privateValue), false);
  } finally { console.error = previous; }
});

test('low stock counts only variants the public catalog can sell, including zero stock', async t => {
  const { db, sqlite, close } = createTestDb(); t.after(close);
  sqlite.exec("UPDATE products SET status='HIDDEN'; UPDATE product_variants SET stock_quantity=0; UPDATE products SET status='ACTIVE' WHERE id=1");
  assert.equal((await getAdminSummary(db)).low_stock_count, 3);
  sqlite.exec('UPDATE product_variants SET is_active=0 WHERE id=1');
  assert.equal((await getAdminSummary(db)).low_stock_count, 2);
  sqlite.exec("UPDATE products SET status='ARCHIVED' WHERE id=1");
  assert.equal((await getAdminSummary(db)).low_stock_count, 0);
  sqlite.exec("UPDATE products SET status='ACTIVE' WHERE id=1; UPDATE categories SET is_active=0 WHERE id=(SELECT category_id FROM products WHERE id=1)");
  assert.equal((await getAdminSummary(db)).low_stock_count, 0);
});

test('admin date windows bound scans and permit explicit historical orders with both UTC formats', async t => {
  const harness = createTestDb(); t.after(harness.close);
  const { db, sqlite, queries } = harness;
  const date = new Date(Date.parse(`${todayInVN()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  const timestamps = ['2025-01-01T01:00:00.000Z', '2026-10-13T16:59:59.999Z', '2026-10-13 17:00:00',
    '2026-10-14T16:59:59.999Z', '2026-10-14 17:00:00', '2026-10-14T17:00:00.000Z'];
  for (const [index, timestamp] of timestamps.entries()) {
    const order = await createOrder(db, { items: [{ variant_id: 1, quantity: 1 }],
      sender: { name: 'Historical fixture', phone: `090000000${index}`, is_anonymous: false },
      recipient: { name: 'Synthetic recipient', phone: '0911111111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: 'Test address' },
      delivery: { method_code: 'STANDARD', date, time_slot: '08:00-10:00' }, card: { type: 'NONE' },
    }, randomUUID());
    sqlite.prepare('UPDATE orders SET placed_at=? WHERE order_number=?').run(timestamp, order.data.order_number);
  }
  queries.length = 0;
  const summary = await getAdminSummary(db, new Date('2026-10-14T06:00:00Z'));
  assert.equal(summary.today_orders, 2);
  assert.equal(summary.orders_by_status.PENDING, 3);
  for (const query of queries.slice(0, 2)) {
    const plan = sqlite.prepare(`EXPLAIN QUERY PLAN ${query.sql}`).all(...query.values).map(row => row.detail).join('\n');
    assert.match(plan, /SEARCH orders USING .*idx_orders_placed_at/);
    assert.doesNotMatch(plan, /SCAN orders/);
  }
  assert.equal((await listAdminOrders(db, {})).total, 5);
  assert.equal((await listAdminOrders(db, { placed_from: '2025-01-01', placed_to: '2025-01-01' })).total, 1);
  assert.equal((await listAdminOrders(db, { placed_from: '2026-10-14', placed_to: '2026-10-14' })).total, 2);
  for (const query of [{ placed_from: '2026-01-01' }, { placed_from: '2025-01-01', placed_to: '2026-01-02' },
    { placed_from: '2026-02-01', placed_to: '2026-01-01' }, { q: 'a' }, { offset: '10001' }]) {
    assert.equal(adminOrdersQuerySchema.safeParse(query).success, false);
  }
});

test('SEO provides crawlable public metadata and keeps private and staging pages out of search', () => {
  const production = getSiteConfiguration({ VITE_SITE_URL: 'https://shop.example.test' });
  assert.equal(pageMetadata('/shop', 'vi', production).robots, 'index, follow');
  assert.match(pageMetadata('/shop', 'vi', production).title, /Bộ sưu tập/);
  assert.match(pageMetadata('/shop', 'en', production).title, /Shop flowers/);
  for (const route of ['/cart', '/checkout', '/orders/track', '/admin/login', '/not-found']) {
    const meta = pageMetadata(route, 'vi', production);
    assert.equal(meta.robots, 'noindex, nofollow');
    assert.equal(meta.canonical, 'https://shop.example.test/');
  }
  const staging = getSiteConfiguration({ VITE_SITE_INDEXABLE: 'true' }, true);
  assert.equal(pageMetadata('/', 'vi', staging).robots, 'noindex, nofollow');
  assert.throws(() => getSiteConfiguration({ VITE_SITE_URL: 'https://user:secret@shop.example.test' }));
  const html = '<html lang="en"><!-- lunara:seo:start --><title>Old</title><!-- lunara:seo:end --></html>';
  const rendered = renderSeoHtml(html, '/shop', production);
  assert.match(rendered, /lang="vi"/); assert.match(rendered, /property="og:image"/);
  assert.match(rendered, /https:\/\/shop.example.test\/shop/); assert.doesNotMatch(rendered, /<title>Old/);
  for (const site of [production, staging]) {
    const files = [];
    seoPlugin(site).generateBundle.call({ emitFile: file => files.push(file) }, {}, { 'index.html': { type: 'asset', source: rendered } });
    const robots = files.find(file => file.fileName === 'robots.txt').source;
    const sitemap = files.find(file => file.fileName === 'sitemap.xml').source;
    if (site.indexable) { assert.match(robots, /Disallow: \/admin/); assert.match(sitemap, /<loc>https:\/\/shop.example.test\/shop<\/loc>/); }
    else { assert.equal(robots, 'User-agent: *\nDisallow: /\n'); assert.doesNotMatch(sitemap, /<loc>/); assert.ok(files.find(file => file.fileName === '_headers')); }
  }
});


test('product metadata uses its own canonical and DB copy while keeping missing products and staging noindex', () => {
 const site = getSiteConfiguration({ VITE_SITE_URL: 'https://shop.example.test' });
 const path = '/shop/blush-peony-bouquet';
 const product = { name: 'Blush Peony Bouquet', description: 'Description from catalog', image: 'https://res.cloudinary.com/demo/image/upload/flower.webp' };
 const metadata = pageMetadata(path, 'en', site, product);
 assert.equal(metadata.title, 'Blush Peony Bouquet | Lunarra');
 assert.equal(metadata.description, product.description); assert.equal(metadata.image, product.image);
 assert.equal(metadata.canonical, site.origin + path); assert.equal(metadata.robots, 'index, follow');
 assert.equal(pageMetadata(path, 'vi', site).robots, 'noindex, nofollow');
 assert.equal(pageMetadata(path, 'vi', { ...site, indexable: false }, product).robots, 'noindex, nofollow');
});
