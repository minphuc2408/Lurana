import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';
import { ORDER_STATUSES } from '../shared/constants.ts';
import { adminOrderNoteSchema, adminOrderStatusSchema, adminOrdersQuerySchema } from '../shared/admin-order-schemas.ts';
import { todayInVN } from '../worker/lib/datetime.ts';
import { handleError } from '../worker/lib/errors.ts';
import { createOrder, lookupOrder } from '../worker/services/orders.ts';
import { changeAdminOrderStatus, getAdminOrder, getAdminSummary, listAdminOrders, updateAdminOrderNote } from '../worker/services/admin-orders.ts';
import { adminOrderRoutes } from '../worker/routes/admin-orders.ts';

test('admin order schemas bound pagination, calendar dates, statuses and notes', () => {
  assert.deepEqual(adminOrdersQuerySchema.parse({}), { limit: 20, offset: 0 });
  assert.deepEqual(adminOrdersQuerySchema.parse({ limit: '50', offset: '12', q: ' demo ' }), { limit: 50, offset: 12, q: 'demo' });
  for (const query of [{ limit: '51' }, { limit: '0' }, { offset: '-1' }, { offset: '' },
    { limit: '1.5' }, { offset: '9007199254740992' }, { date: '2026-02-30' }, { status: 'DELIVERY_FAILED' }, { q: 'q'.repeat(101) }]) {
    assert.equal(adminOrdersQuerySchema.safeParse(query).success, false, JSON.stringify(query));
  }
  assert.equal(adminOrdersQuerySchema.safeParse({ date: '2028-02-29' }).success, true);
  assert.equal(adminOrderStatusSchema.safeParse({ to_status: 'CONFIRMED', note: 'n'.repeat(501) }).success, false);
  assert.equal(adminOrderNoteSchema.safeParse({}).success, false);
  assert.equal(adminOrderNoteSchema.safeParse({ admin_note: 'n'.repeat(501) }).success, false);
  assert.deepEqual(adminOrderNoteSchema.parse({ admin_note: null, role: 'ROOT' }), { admin_note: null });
});

function body(name = 'Demo admin') {
  const date = new Date(Date.parse(`${todayInVN()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  return {
    items: [{ variant_id: 1, quantity: 1 }],
    sender: { name, phone: '0900000000', is_anonymous: false },
    recipient: { name: 'Người nhận demo admin', phone: '0911111111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: '12 Phố Hoa Demo' },
    delivery: { method_code: 'STANDARD', date, time_slot: '08:00-10:00' },
    card: { type: 'NONE' },
  };
}

function observedDb(db) {
  const queries = [];
  const wrap = (raw, sql, values = []) => ({
    raw, sql, values,
    bind(...bound) { return wrap(raw.bind(...bound), sql, bound); },
    async first(column) { queries.push({ sql, values }); return raw.first(column); },
    async all() { queries.push({ sql, values }); return raw.all(); },
    async run() { queries.push({ sql, values }); return raw.run(); },
  });
  return { queries, db: {
    prepare(sql) { return wrap(db.prepare(sql), sql); },
    async batch(statements) {
      queries.push(...statements.map(({ sql, values }) => ({ sql, values })));
      return db.batch(statements.map(statement => statement.raw));
    },
  } };
}

test('admin order APIs use isolated real D1: summary, bound filters, private detail, status and note', async t => {
  const platform = await getPlatformProxy({ configPath: fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)),
    envFiles: [fileURLToPath(new URL('../.dev.vars.example', import.meta.url))], persist: false, remoteBindings: false });
  try {
    const db = platform.env.DB;
    for (const file of ['../migrations/0001_mvp.sql', '../migrations/0002_category_images.sql', '../migrations/0003_hanoi_administrative_areas.sql', '../docs/sql/MVP_SEED_DEV.sql']) {
      await db.batch(splitSqlQuery(readFileSync(new URL(file, import.meta.url), 'utf8')).map(sql => db.prepare(sql)));
    }
    const orders = [];
    for (const [index, name] of ['Literal %_\\ demo', 'Normal demo', 'Other demo', 'Fourth demo'].entries()) {
      const input = body(name);
      input.sender.phone = `090000000${index}`;
      orders.push((await createOrder(db, input, randomUUID())).data.order_number);
    }

    await t.test('summary uses at most three aggregates and exact VN calendar boundaries', async () => {
      const timestamps = ['2026-10-13T16:59:59.999Z', '2026-10-13 17:00:00', '2026-10-14T16:59:59.999Z', '2026-10-14T17:00:00.000Z'];
      await db.batch(orders.map((number, index) => db.prepare('UPDATE orders SET placed_at = ? WHERE order_number = ?').bind(timestamps[index], number)));
      const counted = observedDb(db);
      const summary = await getAdminSummary(counted.db, new Date('2026-10-14T00:30:00Z'));
      assert.equal(counted.queries.length, 3);
      assert.equal(summary.today_orders, 2);
      assert.equal(summary.period_days, 30);
      assert.deepEqual(summary.orders_by_status, Object.fromEntries(ORDER_STATUSES.map(status => [status, status === 'PENDING' ? 3 : 0])));
      const lowStock = await db.prepare("SELECT COUNT(*) AS count FROM product_variants v JOIN products p ON p.id=v.product_id JOIN categories c ON c.id=p.category_id WHERE v.stock_quantity <= v.low_stock_threshold AND v.is_active=1 AND p.status='ACTIVE' AND c.is_active=1").first();
      assert.equal(summary.low_stock_count, lowStock.count);
      assert.deepEqual(counted.queries[1].values, ['2026-10-13T17:00:00.000Z', '2026-10-14T17:00:00.000Z', '2026-10-13 17:00:00', '2026-10-14 17:00:00']);
    });

    await t.test('list escapes wildcard and backslash literals, binds every input and retains filtered total', async () => {
      const counted = observedDb(db);
      const result = await listAdminOrders(counted.db, { q: '%_\\', status: 'PENDING', date: body().delivery.date, limit: '1', offset: '0' });
      assert.equal(result.total, 1);
      assert.equal(result.items[0].order_number, orders[0]);
      assert.equal(counted.queries.length, 2);
      for (const query of counted.queries) {
        assert.equal(query.sql.includes(body().delivery.date), false);
        assert.equal(query.values.filter(value => value === '%\\%\\_\\\\%').length, 5);
      }
      const page = await listAdminOrders(db, { limit: '2', offset: '1' });
      assert.equal(page.items.length, 2);
      assert.equal(page.total, 4);
      assert.equal((await listAdminOrders(db, { q: "' OR 1=1 --" })).total, 0);
      const phone = await listAdminOrders(db, { q: '0911111111' });
      assert.equal(phone.total, 4);
      assert.equal(Object.hasOwn(phone.items[0], 'idempotency_key'), false);
    });

    await t.test('internal note is bound, clearable and excluded from public lookup', async () => {
      const note = "Liên hệ chủ shop %_\\ ' OR 1=1 --";
      const counted = observedDb(db);
      assert.deepEqual(await updateAdminOrderNote(counted.db, orders[0], { admin_note: note }), { order_number: orders[0], admin_note: note });
      assert.equal(counted.queries[0].sql.includes(note), false);
      assert.deepEqual(counted.queries[0].values, [note, orders[0]]);
      const detail = await getAdminOrder(db, orders[0]);
      assert.equal(detail.admin_note, note);
      assert.equal(detail.stock_released, false);
      assert.equal(detail.items.length, 1);
      assert.equal(detail.timeline[0].actor_label, 'CUSTOMER');
      assert.equal(detail.timeline[0].occurred_at.endsWith('Z'), true);
      assert.equal(Object.hasOwn(detail, 'idempotency_key'), false);
      const publicDetail = await lookupOrder(db, { order_number: orders[0], phone: '0900000000' });
      assert.equal(Object.hasOwn(publicDetail, 'admin_note'), false);
      assert.equal(Object.hasOwn(publicDetail, 'stock_released'), false);
      await updateAdminOrderNote(db, orders[0], { admin_note: null });
      assert.equal((await getAdminOrder(db, orders[0])).admin_note, null);
      await assert.rejects(updateAdminOrderNote(db, 'missing', { admin_note: null }), error => error.code === 'NOT_FOUND');
      await assert.rejects(getAdminOrder(db, 'missing'), error => error.code === 'NOT_FOUND');
    });

    await t.test('status adapter delegates to Phase 3 transitions with ADMIN timeline and payment timestamps', async () => {
      await assert.rejects(changeAdminOrderStatus(db, orders[1], { to_status: 'DELIVERED' }), error => error.code === 'INVALID_TRANSITION');
      for (const status of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']) {
        await changeAdminOrderStatus(db, orders[1], { to_status: status, note: `Admin demo ${status}` });
      }
      const delivered = await getAdminOrder(db, orders[1]);
      assert.equal(delivered.payment_status, 'PAID');
      assert.equal(delivered.delivered_at.endsWith('Z'), true);
      assert.equal(delivered.paid_at.endsWith('Z'), true);
      assert.equal(delivered.timeline.length, 5);
      assert.deepEqual(delivered.timeline.slice(1).map(row => row.actor_label), ['ADMIN', 'ADMIN', 'ADMIN', 'ADMIN']);
      const stockBefore = (await db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').bind(1).first()).stock_quantity;
      await changeAdminOrderStatus(db, orders[2], { to_status: 'CANCELLED' });
      await assert.rejects(changeAdminOrderStatus(db, orders[2], { to_status: 'CANCELLED' }), error => error.code === 'INVALID_TRANSITION');
      const stockAfter = (await db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').bind(1).first()).stock_quantity;
      assert.equal(stockAfter, stockBefore + 1);
      assert.equal((await getAdminOrder(db, orders[2])).stock_released, true);
    });

    await t.test('route DTOs reject pagination errors and map invalid transition to HTTP 409', async () => {
      const routes = new Hono();
      routes.onError(handleError);
      routes.route('/api/admin', adminOrderRoutes);
      const request = (path, init) => routes.request(`http://127.0.0.1/api/admin${path}`, init, { DB: db });
      const invalidPage = await request('/orders?limit=51');
      assert.equal(invalidPage.status, 400);
      assert.equal((await invalidPage.json()).error.code, 'VALIDATION_ERROR');
      const invalid = await request(`/orders/${orders[3]}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_status: 'DELIVERED' }) });
      assert.equal(invalid.status, 409);
      assert.equal((await invalid.json()).error.code, 'INVALID_TRANSITION');
      const note = await request(`/orders/${orders[3]}/note`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_note: 'Note qua route demo' }) });
      assert.equal(note.status, 200);
      const detail = await request(`/orders/${orders[3]}`);
      assert.equal((await detail.json()).data.admin_note, 'Note qua route demo');
      assert.equal((await request('/summary')).status, 200);
    });
  } finally {
    await platform.dispose();
  }
});
