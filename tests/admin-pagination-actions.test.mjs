import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDb } from './helpers/worker.mjs';
import { listAdminProductPage, listAdminZonePage } from '../worker/services/admin-catalog-pages.ts';
import { getAdminVariant, deleteAdminVariant, deleteAdminZone } from '../worker/services/admin-catalog-actions.ts';
import { createOrder } from '../worker/services/orders.ts';
import { todayInVN } from '../worker/lib/datetime.ts';
import app from '../worker/index.ts';
import { signSession } from '../worker/lib/auth.ts';
function fixture(t) { const value = createTestDb(); t.after(() => value.close()); return value; }
test('admin product HTTP pages hydrate only requested IDs, retain full counts and bound every child query', async t => {
  const { db, sqlite, queries } = fixture(t);
  for (let index = 0; index < 62; index++) {
    const result = sqlite.prepare("INSERT INTO products(category_id,slug,name_vi,name_en,status) VALUES(1,?,?,?,'HIDDEN')").run(`paged-${index}`, `Hoa phân trang ${index}`, `Paged ${index}`);
    sqlite.prepare("INSERT INTO product_variants(product_id,sku,size_code,price) VALUES(?,?,'S',1)").run(result.lastInsertRowid, `PAGED-${index}`);
  }
  queries.length = 0;
  const first = await listAdminProductPage(db, { limit: '5', offset: '0' });
  assert.equal(first.items.length, 5); assert.equal(first.total, 70); assert.equal(queries.length, 5);
  const next = await listAdminProductPage(db, { limit: '5', offset: '5' });
  assert.equal(next.items.length, 5); assert.ok(next.items.every(row => !first.items.some(previous => previous.id === row.id)));
  const hidden = await listAdminProductPage(db, { limit: '10', filter: 'hidden' });
  assert.equal(hidden.total, 62); assert.equal(hidden.counts.all, 70); assert.equal(hidden.items.length, 10);
  const searched = await listAdminProductPage(db, { q: 'hoa phan trang', offset: '60', limit: '5' });
  assert.equal(searched.total, 62); assert.equal(searched.items.length, 2);
  const sku = await listAdminProductPage(db, { q: 'PAGED-61' }); assert.equal(sku.items[0].slug, 'paged-61');
  const absent = await listAdminProductPage(db, { offset: '500' }); assert.equal(absent.items.length, 0); assert.equal(absent.total, 70);
  assert.ok(queries.every(query => query.values.length <= 100));
  for (const invalid of [{ limit: '0' }, { limit: '51' }, { offset: '-1' }, { offset: '10001' }, { filter: 'UNKNOWN' }]) await assert.rejects(() => listAdminProductPage(db, invalid), error => error.code === 'VALIDATION_ERROR');
});
test('admin zone pages keep metadata across active filters, literal accentless search and empty last page', async t => {
  const { db, sqlite } = fixture(t);
  const before = sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n;
  for (let i = 0; i < 26; i++) sqlite.prepare('INSERT INTO delivery_zones(province_name,ward_name,fee,is_active) VALUES(?,?,?,?)').run('Tỉnh thử nghiệm', `Phường số ${i}`, i, i % 2);
  const page = await listAdminZonePage(db, { limit: '10' }); assert.equal(page.items.length, 10); assert.equal(page.total, before + 26);
  const second = await listAdminZonePage(db, { limit: '10', offset: '10' }); assert.ok(second.items.every(row => !page.items.some(other => row.id === other.id)));
  const active = await listAdminZonePage(db, { filter: 'active', q: 'tinh thu nghiem', limit: '5' });
  assert.equal(active.total, 13); assert.equal(active.counts.all, 26); assert.equal(active.counts.inactive, 13);
  assert.ok(active.items.every(row => row.is_active));
  assert.equal((await listAdminZonePage(db, { q: '%_literal' })).total, 0);
  assert.equal((await listAdminZonePage(db, { offset: '9999' })).items.length, 0);
});
test('single variant reconciliation reads one row; deletes preserve one size under races and reject missing resources', async t => {
  const { db, sqlite, queries } = fixture(t);
  queries.length = 0; assert.equal((await getAdminVariant(db, 1)).stock_quantity, 20); assert.equal(queries.length, 1);
  const product = sqlite.prepare("INSERT INTO products(category_id,slug,name_vi,name_en) VALUES(1,'two-sizes','Hai cỡ','Two sizes')").run();
  const ids = ['S', 'M'].map(size => Number(sqlite.prepare('INSERT INTO product_variants(product_id,sku,size_code,price) VALUES(?,?,?,1)').run(product.lastInsertRowid, `TWO-${size}`, size).lastInsertRowid));
  const results = await Promise.allSettled(ids.map(id => deleteAdminVariant(db, id)));
  assert.equal(results.filter(row => row.status === 'fulfilled').length, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM product_variants WHERE product_id=?').get(product.lastInsertRowid).n, 1);
  await assert.rejects(() => deleteAdminVariant(db, 99999), error => error.code === 'NOT_FOUND');
  const zone = sqlite.prepare('SELECT id FROM delivery_zones ORDER BY id LIMIT 1').get();
  await deleteAdminZone(db, zone.id); await assert.rejects(() => deleteAdminZone(db, zone.id), error => error.code === 'NOT_FOUND');
});
test('SKU in an open order cannot be deleted; closed-order snapshots remain after deletion', async t => {
  const { db, sqlite } = fixture(t);
  const date = new Date(Date.parse(todayInVN() + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
  const order = await createOrder(db, { items: [{ variant_id: 1, quantity: 1 }], sender: { name: 'SMOKE sender', phone: '0900000000', is_anonymous: false }, recipient: { name: 'SMOKE recipient', phone: '0911111111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: '12 Phố Hoa Demo' }, delivery: { method_code: 'STANDARD', date, time_slot: '08:00-10:00' }, card: { type: 'NONE' } }, randomUUID());
  await assert.rejects(() => deleteAdminVariant(db, 1), error => error.code === 'CONFLICT');
  sqlite.prepare("UPDATE orders SET status_code='CANCELLED',stock_released=1 WHERE order_number=?").run(order.data.order_number);
  await deleteAdminVariant(db, 1);
  const item = sqlite.prepare('SELECT i.variant_id,i.sku_snapshot FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.order_number=?').get(order.data.order_number);
  assert.equal(item.variant_id, null); assert.equal(item.sku_snapshot, 'BPB-S');
});
test('pagination and DELETE endpoints retain admin cookie, same-origin JSON and numeric-ID boundaries', async t => {
  const { db } = fixture(t);
  const env = { DB: db, ADMIN_PASSWORD: 'synthetic-admin-table-password-at-least-24', JWT_SECRET: 'synthetic-admin-table-signing-secret-at-least-32' };
  const cookie = `lunara_admin=${await signSession(env)}`;
  for (const path of ['/products', '/delivery-zones']) {
    assert.equal((await app.request('https://example.test/api/admin' + path, {}, env)).status, 401);
    const response = await app.request('https://example.test/api/admin' + path + '?limit=1&offset=1', { headers: { cookie } }, env);
    assert.equal(response.status, 200); const body = (await response.json()).data; assert.equal(body.items.length, 1); assert.equal(body.limit, 1); assert.equal(body.offset, 1); assert.ok(body.counts);
  }
  const url = 'https://example.test/api/admin/variants/2';
  assert.equal((await app.request(url, { method: 'DELETE', headers: { cookie } }, env)).status, 403);
  assert.equal((await app.request(url, { method: 'DELETE', headers: { cookie, Origin: 'https://example.test' } }, env)).status, 400);
  assert.equal((await app.request(url, { method: 'DELETE', headers: { cookie, Origin: 'https://example.test', 'Content-Type': 'application/json' }, body: '{}' }, env)).status, 200);
});
