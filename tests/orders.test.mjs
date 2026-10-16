import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import app from '../worker/index.ts';
import { createOrder } from '../worker/services/orders.ts';
import { todayInVN } from '../worker/lib/datetime.ts';
import { createTestDb } from './helpers/worker.mjs';

function day(offset = 1) {
  return new Date(Date.parse(`${todayInVN()}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
}

function orderBody(overrides = {}) {
  return {
    items: [{ variant_id: 1, quantity: 1 }],
    sender: { name: ' Người đặt demo ', phone: '+84 900.000.000', email: 'demo@example.test', is_anonymous: false },
    recipient: { name: ' Người nhận demo ', phone: '091.111.1111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: ' 12 Phố Hoa Demo ' },
    delivery: { method_code: 'STANDARD', date: day(), time_slot: '08:00-10:00' },
    card: { type: 'NONE' },
    ...overrides,
  };
}

function fixture(t) {
  const h = createTestDb();
  t.after(() => h.close());
  return h;
}

const init = (body, key = randomUUID()) => ({
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(key === null ? {} : { 'Idempotency-Key': key }) }, body: JSON.stringify(body),
});

async function post(db, body = orderBody(), key = randomUUID()) {
  const response = await app.request('/api/orders', init(body, key), { DB: db, TURNSTILE_ALLOW_LOCAL_BYPASS: 'true' });
  return { response, body: await response.json() };
}

async function lookup(db, order_number, phone) {
  const response = await app.request('/api/orders/lookup', init({ order_number, phone }), { DB: db, TURNSTILE_ALLOW_LOCAL_BYPASS: 'true' });
  return { response, body: await response.json() };
}

function saved(h, number) {
  return { ...h.sqlite.prepare('SELECT * FROM orders WHERE order_number = ?').get(number) };
}

function stock(h, id = 1) {
  return h.sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(id).stock_quantity;
}

function orderCount(h) {
  return h.sqlite.prepare('SELECT COUNT(*) AS n FROM orders').get().n;
}

// Count every submitted batch statement even if an earlier statement aborts it.
// Failure hooks simulate rare D1 error branches without relaxing the query budget.
function countedDb(db, { failBatch, missReplayOnce = false } = {}) {
  let count = 0;
  let batches = 0;
  let missed = false;
  const executed = [];
  const wrap = (raw, sql, values = []) => ({
    raw, sql, values,
    bind(...bound) { return wrap(raw.bind(...bound), sql, bound); },
    async all() { count++; executed.push({ sql, values }); return raw.all(); },
    async first(column) {
      count++; executed.push({ sql, values });
      if (missReplayOnce && !missed && /FROM orders[\s\S]*idempotency_key\s*=\s*\?/i.test(sql)) {
        missed = true;
        return null;
      }
      return raw.first(column);
    },
    async run() { count++; executed.push({ sql, values }); return raw.run(); },
  });
  return {
    get count() { return count; },
    get batches() { return batches; },
    executed,
    db: {
      prepare(sql) { return wrap(db.prepare(sql), sql); },
      async batch(statements) {
        count += statements.length;
        executed.push(...statements.map(({ sql, values }) => ({ sql, values })));
        batches++;
        const failure = failBatch?.(batches);
        if (failure) throw failure;
        return db.batch(statements.map(statement => statement.raw));
      },
    },
  };
}

test('order creation persists server totals, merged snapshots, normalized phones and one initial history', async t => {
  const h = fixture(t);
  const before = stock(h);
  const body = orderBody({
    items: [{ variant_id: 1, quantity: 1, price: 1 }, { variant_id: 1, quantity: 1, unit_price: 1 }],
    subtotal: 1, discount_total: 899999, delivery_fee: 1, grand_total: 1, role: 'ADMIN',
    customer_note: 'Giữ nguyên chữ của khách 花',
  });
  const key = randomUUID();
  const { response, body: result } = await post(h.db, body, key);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assert.ok(response.headers.get('X-Request-Id'));
  const summary = result.data;
  assert.match(summary.order_number, /^LNR-\d{6}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  assert.equal(summary.status_code, 'PENDING');
  assert.equal(summary.payment_method, 'COD');
  assert.equal(summary.payment_status, 'UNPAID');
  assert.equal(summary.subtotal, 900000);
  assert.equal(summary.discount_total, 0);
  assert.equal(summary.delivery_fee, 0);
  assert.equal(summary.grand_total, 900000);
  assert.match(summary.placed_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
  assert.equal(stock(h), before - 2);
  const persisted = saved(h, summary.order_number);
  assert.equal(persisted.idempotency_key, key.toLowerCase());
  assert.equal(persisted.sender_name, 'Người đặt demo');
  assert.equal(persisted.sender_phone, '0900000000');
  assert.equal(persisted.recipient_phone, '0911111111');
  assert.equal(persisted.address_line, '12 Phố Hoa Demo');
  assert.equal(persisted.customer_note, body.customer_note);
  const items = h.sqlite.prepare('SELECT * FROM order_items WHERE order_id = ?').all(persisted.id);
  assert.equal(items.length, 1);
  assert.equal(items[0].variant_id, 1);
  assert.equal(items[0].unit_price, 450000);
  assert.equal(items[0].quantity, 2);
  assert.equal(items[0].line_total, 900000);
  assert.equal(items[0].sku_snapshot, 'BPB-S');
  const history = h.sqlite.prepare('SELECT * FROM order_status_history WHERE order_id = ?').all(persisted.id);
  assert.equal(history.length, 1);
  assert.equal(history[0].from_status, null);
  assert.equal(history[0].to_status, 'PENDING');
  assert.equal(history[0].actor_label, 'CUSTOMER');
});

test('idempotency replay canonicalizes UUID case and does not reprice, revalidate delivery or consume stock', async t => {
  const h = fixture(t);
  const key = randomUUID();
  const first = await post(h.db, orderBody(), key);
  assert.equal(first.response.status, 201);
  const after = stock(h);
  h.sqlite.prepare('UPDATE product_variants SET is_active = ?, stock_quantity = ? WHERE id = ?').run(0, 0, 1);
  h.resetQueryCount();
  const replay = await post(h.db, orderBody({ delivery: { method_code: 'STANDARD', date: day(-1), time_slot: '08:00-10:00' } }), key.toUpperCase());
  assert.equal(replay.response.status, 200);
  assert.equal(replay.body.data.replayed, true);
  const { replayed, ...replaySummary } = replay.body.data;
  assert.deepEqual(replaySummary, first.body.data);
  assert.equal(h.queryCount, 1);
  assert.equal(orderCount(h), 1);
  assert.equal(stock(h), 0);
  assert.ok(after > 0);
});

test('oversized merged quantities and unavailable variants never write orders or stock', async t => {
  const h = fixture(t);
  h.sqlite.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(1, 1);
  const insufficient = await post(h.db, orderBody({ items: [{ variant_id: 1, quantity: 1 }, { variant_id: 1, quantity: 1 }] }));
  assert.equal(insufficient.response.status, 409);
  assert.equal(insufficient.body.error.code, 'OUT_OF_STOCK');
  assert.deepEqual(insufficient.body.error.details, [{ variant_id: 1, requested: 2, available: 1 }]);
  assert.equal(stock(h), 1);
  for (const mutate of [
    () => h.sqlite.prepare('UPDATE product_variants SET is_active = ? WHERE id = ?').run(0, 1),
    () => { h.sqlite.prepare('UPDATE product_variants SET is_active = ? WHERE id = ?').run(1, 1); h.sqlite.prepare('UPDATE products SET status = ? WHERE id = ?').run('HIDDEN', 1); },
    () => { h.sqlite.prepare('UPDATE products SET status = ? WHERE id = ?').run('ACTIVE', 1); h.sqlite.prepare('UPDATE categories SET is_active = ? WHERE id = ?').run(0, 1); },
  ]) {
    mutate();
    const unavailable = await post(h.db);
    assert.equal(unavailable.response.status, 409);
    assert.equal(unavailable.body.error.code, 'VARIANT_UNAVAILABLE');
  }
  const missing = await post(h.db, orderBody({ items: [{ variant_id: 999999, quantity: 1 }] }));
  assert.equal(missing.response.status, 409);
  assert.equal(missing.body.error.code, 'VARIANT_UNAVAILABLE');
  assert.equal(orderCount(h), 0);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM order_items').get().n, 0);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM order_status_history').get().n, 0);
  assert.equal(stock(h), 1);
});

test('order delivery requires configured wards and retains free threshold; invalid delivery leaves no order', async t => {
  const h = fixture(t);
  const exact = await post(h.db);
  assert.equal(exact.response.status, 201);
  assert.equal(exact.body.data.delivery_fee, 20000);
  assert.equal(exact.body.data.grand_total, 470000);
  const body = orderBody();
  const fallback = await post(h.db, { ...body, recipient: { ...body.recipient, ward_name: 'Phường mới' } });
  assert.equal(fallback.response.status, 422);
  assert.equal(fallback.body.error.code, 'NO_DELIVERY_ZONE');
  h.sqlite.prepare('UPDATE delivery_zones SET free_from_amount = ? WHERE province_name = ? AND ward_name = ?').run(450000, body.recipient.province_name, body.recipient.ward_name);
  const free = await post(h.db);
  assert.equal(free.response.status, 201);
  assert.equal(free.body.data.delivery_fee, 0);
  const before = stock(h);
  const count = orderCount(h);
  for (const [invalid, code] of [
    [{ ...body, recipient: { ...body.recipient, province_name: 'Tỉnh chưa giao' } }, 'NO_DELIVERY_ZONE'],
    [{ ...body, delivery: { ...body.delivery, method_code: 'SAME_DAY', date: day() } }, 'INVALID_DELIVERY_SLOT'],
    [{ ...body, delivery: { ...body.delivery, date: day(-1) } }, 'INVALID_DELIVERY_SLOT'],
    [{ ...body, delivery: { ...body.delivery, date: day(31) } }, 'INVALID_DELIVERY_SLOT'],
    [{ ...body, delivery: { ...body.delivery, date: '2027-02-30' } }, 'INVALID_DELIVERY_SLOT'],
  ]) {
    const result = await post(h.db, invalid);
    assert.equal(result.response.status, 422);
    assert.equal(result.body.error.code, code);
  }
  assert.equal(stock(h), before);
  assert.equal(orderCount(h), count);
});

test('order route validates UUID v4, cart limits and contact/card fields before D1 writes', async t => {
  const h = fixture(t);
  const valid = orderBody();
  for (const key of [null, 'bad', '00000000-0000-1000-8000-000000000000', '00000000-0000-4000-0000-000000000000']) {
    h.resetQueryCount();
    const result = await post(h.db, valid, key);
    assert.equal(result.response.status, 400);
    assert.equal(result.body.error.code, 'VALIDATION_ERROR');
    assert.equal(h.queryCount, 0);
  }
  const invalids = [
    [{ ...valid, sender: { ...valid.sender, phone: '090' } }, 400, 'VALIDATION_ERROR'],
    [{ ...valid, recipient: { ...valid.recipient, address_line: 'x' } }, 400, 'VALIDATION_ERROR'],
    [{ ...valid, card: { type: 'GREETING_CARD', message: ' ' } }, 400, 'VALIDATION_ERROR'],
    [{ ...valid, card: { type: 'BANNER', message: 'x'.repeat(201) } }, 400, 'VALIDATION_ERROR'],
    [{ ...valid, customer_note: 'x'.repeat(501) }, 400, 'VALIDATION_ERROR'],
    [{ ...valid, items: [] }, 400, 'VALIDATION_ERROR'],
    [{ ...valid, items: [{ variant_id: 1, quantity: 0 }] }, 400, 'VALIDATION_ERROR'],
    [{ ...valid, items: [{ variant_id: 1, quantity: 21 }] }, 422, 'CART_LIMIT'],
    [{ ...valid, items: [{ variant_id: 1, quantity: 20 }, { variant_id: 1, quantity: 1 }] }, 422, 'CART_LIMIT'],
    [{ ...valid, items: Array.from({ length: 16 }, () => ({ variant_id: 1, quantity: 1 })) }, 422, 'CART_LIMIT'],
  ];
  for (const [body, status, code] of invalids) {
    const result = await post(h.db, body);
    assert.equal(result.response.status, status);
    assert.equal(result.body.error.code, code);
    assert.equal(result.response.headers.get('Cache-Control'), 'no-store');
  }
  const malformed = await app.request('/api/orders', { ...init(valid), body: '{bad' }, { DB: h.db });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, 'VALIDATION_ERROR');
  assert.equal(orderCount(h), 0);
});

test('lookup accepts either normalized phone and returns saved snapshots without internal order fields', async t => {
  const h = fixture(t);
  const created = await post(h.db, orderBody({ card: { type: 'GREETING_CARD', message: 'Mừng bạn 花' }, customer_note: 'Ghi chú demo' }));
  const number = created.body.data.order_number;
  h.sqlite.prepare('UPDATE orders SET admin_note = ? WHERE order_number = ?').run('Demo internal note', number);
  const before = await lookup(h.db, number, '+84 900 000 000');
  assert.equal(before.response.status, 200);
  assert.equal(before.response.headers.get('Cache-Control'), 'no-store');
  assert.equal(before.body.data.sender.phone, '0900000000');
  assert.equal(before.body.data.sender.is_anonymous, false);
  assert.equal(before.body.data.recipient.phone, '0911111111');
  assert.equal(before.body.data.card.message, 'Mừng bạn 花');
  assert.equal(before.body.data.customer_note, 'Ghi chú demo');
  assert.equal(before.body.data.items[0].unit_price, 450000);
  assert.equal(before.body.data.timeline.length, 1);
  assert.equal(before.body.data.timeline[0].from_status, null);
  assert.equal(before.body.data.timeline[0].to_status, 'PENDING');
  assert.match(before.body.data.timeline[0].occurred_at, /T.*Z$/);
  assert.equal(before.body.data.paid_at, null);
  assert.equal(before.body.data.delivered_at, null);
  for (const field of ['admin_note', 'stock_released', 'idempotency_key', 'id', 'user_id']) assert.equal(Object.hasOwn(before.body.data, field), false);
  h.sqlite.prepare('DELETE FROM products WHERE id = ?').run(1);
  h.resetQueryCount();
  const after = await lookup(h.db, number, '091.111.1111');
  assert.equal(after.response.status, 200);
  assert.deepEqual(after.body.data, before.body.data);
  assert.equal(h.queryCount, 3);
  const wrongPhone = await lookup(h.db, number, '0999999999');
  const wrongNumber = await lookup(h.db, 'LNR-000000-AAAAAA', '0900000000');
  assert.equal(wrongPhone.response.status, 404);
  assert.equal(wrongNumber.response.status, 404);
  assert.deepEqual(wrongPhone.body, wrongNumber.body);
  assert.equal(wrongPhone.body.error.code, 'NOT_FOUND');
});

test('customer text is bound as data in creation and lookup SQL', async t => {
  const h = fixture(t);
  const hostile = "Demo '); DROP TABLE orders; --";
  const body = orderBody();
  const created = await post(h.db, { ...body, sender: { ...body.sender, name: hostile }, recipient: { ...body.recipient, address_line: hostile }, card: { type: 'GREETING_CARD', message: hostile }, customer_note: hostile });
  assert.equal(created.response.status, 201);
  assert.ok(h.queries.every(query => !query.sql.includes(hostile)));
  assert.ok(h.queries.some(query => query.values.includes(hostile)));
  const detail = await lookup(h.db, created.body.data.order_number, '0900000000');
  assert.equal(detail.body.data.sender.name, hostile);
  assert.equal(detail.body.data.recipient.address_line, hostile);
  assert.equal(detail.body.data.card.message, hostile);
  assert.equal(detail.body.data.customer_note, hostile);
  assert.equal(orderCount(h), 1);
});

test('maximum 15-line creation submits 35 D1 statements and replay submits one', async t => {
  const h = fixture(t);
  h.sqlite.prepare('UPDATE product_variants SET stock_quantity = ?').run(100);
  const items = h.sqlite.prepare('SELECT id FROM product_variants ORDER BY id LIMIT 15').all().map(row => ({ variant_id: row.id, quantity: 1 }));
  const counter = countedDb(h.db);
  const key = randomUUID();
  const result = await post(counter.db, orderBody({ items }), key);
  assert.equal(result.response.status, 201);
  assert.equal(counter.count, 35);
  assert.equal(counter.batches, 1);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM order_items').get().n, 15);
  const replayCounter = countedDb(h.db);
  const replay = await post(replayCounter.db, orderBody({ items }), key);
  assert.equal(replay.response.status, 200);
  assert.equal(replay.body.data.replayed, true);
  assert.equal(replayCounter.count, 1);
  console.log(`Phase 3 D1 statement budget: 15 lines normal=${counter.count}, replay=${replayCounter.count}, limit=40.`);
});

test('order number collision retries small batches and stops safely before a 15-line retry exceeds 40', async t => {
  for (const [lines, failUntil, expectedBatches, expectedCode] of [[1, 1, 2, null], [1, 3, 3, 'CONFLICT'], [15, 1, 1, 'CONFLICT']]) {
    await t.test(`${lines} lines; ${failUntil} forced collision(s)`, async t => {
      const h = fixture(t);
      h.sqlite.prepare('UPDATE product_variants SET stock_quantity = ?').run(100);
      const before = stock(h);
      const items = h.sqlite.prepare('SELECT id FROM product_variants ORDER BY id LIMIT ?').all(lines).map(row => ({ variant_id: row.id, quantity: 1 }));
      const counter = countedDb(h.db, { failBatch: n => n <= failUntil ? new Error('D1_ERROR: UNIQUE constraint failed: orders.order_number: SQLITE_CONSTRAINT') : null });
      if (expectedCode) {
        await assert.rejects(() => createOrder(counter.db, orderBody({ items }), randomUUID()), error => error.code === expectedCode && error.status === 409);
        assert.equal(orderCount(h), 0);
        assert.equal(stock(h), before);
      } else {
        const result = await createOrder(counter.db, orderBody({ items }), randomUUID());
        assert.equal(result.replayed, false);
        assert.equal(orderCount(h), 1);
        assert.equal(stock(h), before - 1);
      }
      assert.equal(counter.batches, expectedBatches);
      assert.ok(counter.count <= 40, `${counter.count} D1 statements exceeds 40`);
      console.log(`Phase 3 D1 statement budget: collision lines=${lines} submitted=${counter.count} batches=${counter.batches}, limit=40.`);
    });
  }
});

test('idempotency unique-race recovery counts the failed batch and reads replay without another stock decrement', async t => {
  for (const lines of [1, 15]) {
    await t.test(`${lines} lines`, async t => {
      const h = fixture(t);
      h.sqlite.prepare('UPDATE product_variants SET stock_quantity = ?').run(100);
      const items = h.sqlite.prepare('SELECT id FROM product_variants ORDER BY id LIMIT ?').all(lines).map(row => ({ variant_id: row.id, quantity: 1 }));
      const key = randomUUID();
      const first = await createOrder(h.db, orderBody({ items }), key);
      const after = stock(h);
      const counter = countedDb(h.db, { missReplayOnce: true });
      const replay = await createOrder(counter.db, orderBody({ items }), key);
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.data, first.data);
      assert.equal(stock(h), after);
      assert.equal(orderCount(h), 1);
      assert.equal(counter.batches, 1);
      assert.ok(counter.count <= 40);
      assert.equal(counter.count, 2 * lines + 6);
      console.log(`Phase 3 D1 statement budget: idempotency race lines=${lines} submitted=${counter.count}, limit=40.`);
    });
  }
});

test('unexpected order D1 failures return only safe INTERNAL references', async t => {
  const h = fixture(t);
  t.mock.method(console, 'error', () => {});
  const counter = countedDb(h.db, { failBatch: () => new Error('D1_ERROR: SELECT secret; password_hash; internal stack') });
  const { response, body } = await post(counter.db);
  assert.equal(response.status, 500);
  assert.equal(body.error.code, 'INTERNAL');
  assert.deepEqual(Object.keys(body.error.details), ['request_id']);
  assert.equal(body.error.details.request_id, response.headers.get('X-Request-Id'));
  assert.doesNotMatch(JSON.stringify(body), /SELECT|password_hash|stack|D1_ERROR/);
  assert.equal(orderCount(h), 0);
  assert.equal(counter.batches, 1);
});
