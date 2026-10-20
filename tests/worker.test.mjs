import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../worker/index.ts';
import { createTestDb } from './helpers/worker.mjs';

const post = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const quote = { items: [{ variant_id: 1, quantity: 1 }], province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', delivery_method_code: 'STANDARD' };

test('Hono GET routes compose DTOs, cache policy and security headers', async t => {
  const fixture = createTestDb(); t.after(() => fixture.close());
  const env = { DB: fixture.db };
  for (const path of ['/api/categories', '/api/products', '/api/products/by-variants?variant_ids=1,4', '/api/products/blush-peony-bouquet', '/api/delivery/options']) {
    fixture.resetQueryCount();
    const response = await app.request(path, {}, env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=30');
    assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(response.headers.get('X-Frame-Options'), 'SAMEORIGIN');
    assert.match(response.headers.get('X-Request-Id'), /^[\w-]+$/);
    assert.ok((await response.json()).data);
    if (path.startsWith('/api/products')) assert.equal(fixture.queryCount, path === '/api/products' ? 4 : 3);
  }
  const health = await app.request('/api/health', {}, {});
  assert.equal(health.status, 200); assert.equal((await health.json()).data.ok, true);
  assert.equal(health.headers.get('Cache-Control'), 'no-store');
});

test('hidden products disappear and inactive categories/variants stay hidden in Hono routes', async t => {
  const fixture = createTestDb(); t.after(() => fixture.close()); const env = { DB: fixture.db };
  fixture.exec("UPDATE products SET status='HIDDEN' WHERE slug='blush-peony-bouquet'");
  const products = (await (await app.request('/api/products', {}, env)).json()).data.items;
  assert.equal(products.length, 7); assert.ok(products.every(p => p.slug !== 'blush-peony-bouquet'));
  const response = await app.request('/api/products/blush-peony-bouquet', {}, env);
  assert.equal(response.status, 404); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await response.json()).error.code, 'NOT_FOUND');
  fixture.exec("UPDATE categories SET is_active=0 WHERE code='arrangements'; UPDATE product_variants SET is_active=0 WHERE sku='PRB-S'");
  const active = (await (await app.request('/api/products', {}, env)).json()).data.items;
  assert.ok(active.every(p => p.category_code !== 'arrangements'));
  assert.equal(active.find(p => p.slug === 'pastel-rose-bouquet').variants.length, 2);
});

test('quote ignores forged prices and returns issues at 200 without writing stock or orders', async t => {
  const fixture = createTestDb(); t.after(() => fixture.close()); const env = { DB: fixture.db };
  const before = fixture.sqlite.prepare('SELECT id, stock_quantity FROM product_variants ORDER BY id').all();
  const response = await app.request('/api/checkout/quote', post({ ...quote, items: [{ variant_id: 1, quantity: 2, price: 1 }], subtotal: 1, delivery_fee: 1, grand_total: 1 }), env);
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const data = (await response.json()).data;
  assert.equal(data.lines[0].unit_price, 450000); assert.equal(data.subtotal, 900000); assert.equal(data.delivery_fee, 0); assert.equal(data.grand_total, 900000);
  const unavailable = await app.request('/api/checkout/quote', post({ ...quote, items: [{ variant_id: 99999, quantity: 1 }] }), env);
  assert.equal(unavailable.status, 200);
  assert.deepEqual((await unavailable.json()).data.issues, [{ variant_id: 99999, code: 'VARIANT_UNAVAILABLE' }]);
  assert.deepEqual(fixture.sqlite.prepare('SELECT id, stock_quantity FROM product_variants ORDER BY id').all(), before);
  assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) AS n FROM orders').get().n, 0);
});

test('Hono validation/404 errors share JSON envelope and never expose stack traces', async t => {
  const fixture = createTestDb(); t.after(() => fixture.close()); const env = { DB: fixture.db };
  const cases = [
    ['/api/checkout/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' }, 400, 'VALIDATION_ERROR'],
    ['/api/checkout/quote', post({ ...quote, items: [{ variant_id: 1, quantity: 0 }] }), 400, 'VALIDATION_ERROR'],
    ['/api/checkout/quote', post({ ...quote, items: [{ variant_id: 1, quantity: 21 }] }), 422, 'CART_LIMIT'],
    ['/api/checkout/quote', post({ ...quote, items: Array.from({ length: 16 }, (_, i) => ({ variant_id: i + 1, quantity: 1 })) }), 422, 'CART_LIMIT'],
    ['/api/checkout/quote', post({ ...quote, province_name: 'Unknown' }), 422, 'NO_DELIVERY_ZONE'],
    ['/api/checkout/quote', { method: 'POST', body: JSON.stringify(quote) }, 400, 'VALIDATION_ERROR'],
    ['/api/products?featured=no', {}, 400, 'VALIDATION_ERROR'],
    ['/api/products?category=a&category=b', {}, 400, 'VALIDATION_ERROR'],
    ['/api/products?page=0', {}, 400, 'VALIDATION_ERROR'],
    ['/api/products?price=unknown', {}, 400, 'VALIDATION_ERROR'],
    ['/api/products/by-variants?variant_ids=1,1', {}, 400, 'VALIDATION_ERROR'],
    ['/api/products/by-variants?variant_ids=1&variant_ids=2', {}, 400, 'VALIDATION_ERROR'],
    ['/api/unknown', {}, 404, 'NOT_FOUND'],
    ['/api/orders', post(quote), 400, 'VALIDATION_ERROR'],
    ['/api/admin/me', {}, 401, 'UNAUTHORIZED'],
  ];
  for (const [path, init, status, code] of cases) {
    const response = await app.request(path, init, env); assert.equal(response.status, status, path);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
    const text = await response.text(); const body = JSON.parse(text);
    assert.deepEqual(Object.keys(body), ['error']); assert.equal(body.error.code, code);
    assert.equal(typeof body.error.message, 'string'); assert.doesNotMatch(text, /stack|SELECT|Error:|password_hash/);
    if (code === 'VALIDATION_ERROR') assert.ok(body.error.details.every(issue => typeof issue.path === 'string' && typeof issue.message === 'string'));
  }
});

test('unexpected D1 failures log a reference server-side and expose only safe INTERNAL JSON', async t => {
  const logs = []; t.mock.method(console, 'error', (...args) => logs.push(args));
  const env = { DB: { prepare() { throw new Error('SQL SELECT password_hash FROM secret; internal-stack'); } } };
  const response = await app.request('/api/products', {}, env);
  assert.equal(response.status, 500); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const text = await response.text(); const body = JSON.parse(text);
  assert.equal(body.error.code, 'INTERNAL'); assert.equal(body.error.details.request_id, response.headers.get('X-Request-Id'));
  assert.deepEqual(Object.keys(body.error.details), ['request_id']); assert.doesNotMatch(text, /SELECT|password_hash|stack|Error:/);
  assert.equal(logs.length, 1); assert.equal(logs[0][1].request_id, body.error.details.request_id);
  assert.deepEqual(Object.keys(logs[0][1]).sort(), ['error_name', 'request_id']);
  assert.doesNotMatch(JSON.stringify(logs), /SELECT|password_hash|internal-stack/);
});

test('ignored POST payloads are drained before returning non-JSON validation errors', async t => {
  const fixture = createTestDb(); t.after(() => fixture.close()); const env = { DB: fixture.db };
  for (const path of ['/api/orders', '/api/checkout/quote']) {
    const request = new Request(`http://127.0.0.1${path}`, { method: 'POST', body: JSON.stringify(quote) });
    const response = await app.fetch(request, env);
    assert.equal(response.status, 400);
    assert.equal(request.bodyUsed, true);
    assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
  }
});
