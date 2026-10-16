import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';
import app from '../worker/index.ts';
import { createOrder, lookupOrder, transitionOrder } from '../worker/services/orders.ts';
import { todayInVN } from '../worker/lib/datetime.ts';
import { expirePendingOrders } from '../worker/services/pending-orders.ts';
import { changeAdminOrderStatus } from '../worker/services/admin-orders.ts';

function body(items = [{ variant_id: 1, quantity: 1 }]) {
  const date = new Date(Date.parse(`${todayInVN()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  return {
    items,
    sender: { name: 'Người đặt demo D1', phone: '0900000000', is_anonymous: true },
    recipient: { name: 'Người nhận demo D1', phone: '0911111111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: '12 Phố Hoa Demo' },
    delivery: { method_code: 'STANDARD', date, time_slot: '08:00-10:00' },
    card: { type: 'NONE' },
  };
}

// Counts each statement submitted to real workerd D1, including an aborted batch.
function countedDb(db, beforeBatch) {
  let count = 0;
  let batches = 0;
  const queries = [];
  const wrap = (raw, sql, values = []) => ({
    raw, sql, values,
    bind(...bound) { return wrap(raw.bind(...bound), sql, bound); },
    async all() { count++; queries.push({ sql, values }); return raw.all(); },
    async first(column) { count++; queries.push({ sql, values }); return raw.first(column); },
    async run() { count++; queries.push({ sql, values }); return raw.run(); },
  });
  return {
    get count() { return count; },
    get batches() { return batches; },
    queries,
    db: {
      prepare(sql) { return wrap(db.prepare(sql), sql); },
      async batch(statements) {
        count += statements.length;
        queries.push(...statements.map(({ sql, values }) => ({ sql, values })));
        batches++;
        await beforeBatch?.();
        return db.batch(statements.map(statement => statement.raw));
      },
    },
  };
}

// Both requests finish their pre-reads before the real transactional batches race.
function barrier(parties = 2) {
  let arrivals = 0;
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  return async () => {
    if (++arrivals === parties) release();
    await ready;
  };
}

async function stock(db, id = 1) {
  return (await db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').bind(id).first()).stock_quantity;
}

async function counts(db) {
  const [orders, items, history] = await db.batch([
    db.prepare('SELECT COUNT(*) AS n FROM orders'),
    db.prepare('SELECT COUNT(*) AS n FROM order_items'),
    db.prepare('SELECT COUNT(*) AS n FROM order_status_history'),
  ]);
  return [orders.results[0].n, items.results[0].n, history.results[0].n];
}

async function orderRow(db, number) {
  return db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(number).first();
}

async function history(db, number) {
  return (await db.prepare(`SELECT h.from_status, h.to_status, h.actor_label, h.note
    FROM order_status_history h JOIN orders o ON o.id = h.order_id
    WHERE o.order_number = ? ORDER BY h.id`).bind(number).all()).results;
}

test('Phase 3 orders run on isolated real workerd D1: rollback, concurrency, transitions and query budget', async t => {
  const platform = await getPlatformProxy({ configPath: fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)), persist: false, remoteBindings: false,
    envFiles: [fileURLToPath(new URL('../.dev.vars.example', import.meta.url))] });
  try {
    const db = platform.env.DB;
    for (const file of ['../migrations/0001_mvp.sql', '../docs/sql/MVP_SEED_DEV.sql']) {
      await db.batch(splitSqlQuery(readFileSync(new URL(file, import.meta.url), 'utf8')).map(sql => db.prepare(sql)));
    }
    const initialStock = (await db.prepare('SELECT id, stock_quantity FROM product_variants ORDER BY id').all()).results;
    async function reset() {
      await db.batch([
        db.prepare('DELETE FROM order_status_history'),
        db.prepare('DELETE FROM order_items'),
        db.prepare('DELETE FROM orders'),
        ...initialStock.map(row => db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').bind(row.stock_quantity, row.id)),
      ]);
    }

    await t.test('two last-unit HTTP requests yield one order and one rolled-back OUT_OF_STOCK', async () => {
      await reset();
      await db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').bind(1, 1).run();
      const ready = barrier();
      const counters = [countedDb(db, ready), countedDb(db, ready)];
      const responses = await Promise.all(counters.map(counter => app.request('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() }, body: JSON.stringify(body()),
      }, { DB: counter.db })));
      assert.deepEqual(responses.map(response => response.status).sort(), [201, 409]);
      const payloads = await Promise.all(responses.map(response => response.json()));
      const loser = payloads.find(payload => payload.error);
      assert.equal(loser.error.code, 'OUT_OF_STOCK');
      assert.deepEqual(loser.error.details, [{ variant_id: 1, requested: 1, available: 0 }]);
      assert.equal(await stock(db), 0);
      assert.deepEqual(await counts(db), [1, 1, 1]);
      assert.deepEqual(counters.map(counter => counter.count).sort((a, b) => a - b), [7, 8]);
      const totalSold = await db.prepare(`SELECT SUM(i.quantity) AS quantity FROM order_items i
        JOIN orders o ON o.id = i.order_id WHERE o.status_code != ? AND i.variant_id = ?`).bind('CANCELLED', 1).first();
      assert.equal(totalSold.quantity, 1);
      console.log('Phase 3 D1 LOCAL race: last stock=1; HTTP=[201,409/OUT_OF_STOCK]; final stock=0; orders/items/history=[1,1,1]; submitted=[7,8].');
    });

    await t.test('two same-key HTTP requests create once and replay the winner after UNIQUE rollback', async () => {
      await reset();
      const before = await stock(db);
      const key = randomUUID();
      const ready = barrier();
      const counters = [countedDb(db, ready), countedDb(db, ready)];
      const responses = await Promise.all(counters.map(counter => app.request('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(body()),
      }, { DB: counter.db })));
      assert.deepEqual(responses.map(response => response.status).sort(), [200, 201]);
      const payloads = await Promise.all(responses.map(response => response.json()));
      const replay = payloads.find(payload => payload.data.replayed);
      const first = payloads.find(payload => !payload.data.replayed);
      const { replayed, ...replaySummary } = replay.data;
      assert.equal(replayed, true);
      assert.deepEqual(replaySummary, first.data);
      assert.equal(await stock(db), before - 1);
      assert.deepEqual(await counts(db), [1, 1, 1]);
      assert.deepEqual(counters.map(counter => counter.count).sort((a, b) => a - b), [7, 8]);
      console.log('Phase 3 D1 LOCAL idempotency race: HTTP=[201,200 replayed]; exactly one decrement and one order; submitted=[7,8].');
    });

    await t.test('15-line normal creation and a forced late CHECK failure stay at 35/36 statements with full rollback', async () => {
      await reset();
      await db.prepare('UPDATE product_variants SET stock_quantity = ?').bind(100).run();
      const ids = (await db.prepare('SELECT id FROM product_variants ORDER BY id LIMIT 15').all()).results.map(row => row.id);
      const input = body(ids.map(variant_id => ({ variant_id, quantity: 1 })));
      const success = countedDb(db);
      const created = await createOrder(success.db, input, randomUUID());
      assert.equal(created.replayed, false);
      assert.equal(success.count, 35);
      assert.deepEqual(await counts(db), [1, 15, 1]);
      assert.equal(await stock(db, ids[0]), 99);
      await reset();
      await db.prepare('UPDATE product_variants SET stock_quantity = ?').bind(100).run();
      const lateId = ids.at(-1);
      const failure = countedDb(db, async () => {
        await db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').bind(0, lateId).run();
      });
      await assert.rejects(() => createOrder(failure.db, input, randomUUID()), error => {
        assert.equal(error.code, 'OUT_OF_STOCK');
        assert.equal(error.status, 409);
        assert.deepEqual(error.details, [{ variant_id: lateId, requested: 1, available: 0 }]);
        return true;
      });
      assert.equal(failure.count, 36);
      assert.deepEqual(await counts(db), [0, 0, 0]);
      for (const id of ids) assert.equal(await stock(db, id), id === lateId ? 0 : 100);
      console.log('Phase 3 D1 LOCAL statement budget: 15 lines success=35; last-stock CHECK failure=36; failed order/items/history=[0,0,0]; all earlier decrements rolled back; limit=40.');
    });

    await t.test('concurrent phone-cap creates serialize at three; same-key race still replays at the cap', async () => {
      for (const sameKey of [false, true]) {
        await reset();
        for (let i = 0; i < 2; i++) await createOrder(db, body(), randomUUID());
        const before = await stock(db);
        const ready = barrier();
        const counters = [countedDb(db, ready), countedDb(db, ready)];
        const key = randomUUID();
        const responses = await Promise.all(counters.map(counter => app.request('/api/orders', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': sameKey ? key : randomUUID() },
          body: JSON.stringify(body()),
        }, { DB: counter.db })));
        assert.deepEqual(responses.map(response => response.status).sort(), sameKey ? [200, 201] : [201, 429]);
        const payloads = await Promise.all(responses.map(response => response.json()));
        if (!sameKey) assert.equal(payloads.find(payload => payload.error).error.code, 'PENDING_ORDER_LIMIT');
        assert.deepEqual(await counts(db), [3, 3, 3]);
        assert.equal(await stock(db), before - 1);
        assert.ok(counters.every(counter => counter.count <= 40));
      }
    });

    await t.test('failed delivery requires a reason; default consumes stock, explicit restock releases exactly once under races', async () => {
      for (const restock of [undefined, false, true]) {
        await reset();
        const before = await stock(db);
        const number = (await createOrder(db, body(), randomUUID())).data.order_number;
        for (const status of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT']) await transitionOrder(db, number, status);
        for (const note of [undefined, '', '   ']) {
          await assert.rejects(changeAdminOrderStatus(db, number, { to_status: 'CANCELLED', note, restock }), error => error.code === 'VALIDATION_ERROR');
        }
        assert.equal((await orderRow(db, number)).status_code, 'IN_TRANSIT');
        const ready = barrier();
        const counters = [countedDb(db, ready), countedDb(db, ready)];
        const results = await Promise.allSettled(counters.map(counter => changeAdminOrderStatus(counter.db, number,
          { to_status: 'CANCELLED', note: 'Khách từ chối nhận SMOKE', restock })));
        assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
        assert.equal(results.find(result => result.status === 'rejected').reason.code, 'INVALID_TRANSITION');
        const row = await orderRow(db, number);
        assert.equal(row.status_code, 'CANCELLED'); assert.equal(row.payment_status, 'UNPAID');
        assert.equal(row.paid_at, null); assert.equal(row.delivered_at, null);
        assert.equal(row.stock_released, restock === true ? 1 : 0);
        assert.equal(await stock(db), before - (restock === true ? 0 : 1));
        assert.equal((await history(db, number)).filter(row => row.to_status === 'CANCELLED').length, 1);
        assert.equal((await history(db, number)).at(-1).note, 'Khách từ chối nhận SMOKE');
        await assert.rejects(changeAdminOrderStatus(db, number, { to_status: 'CANCELLED', note: 'SMOKE', restock: true }), error => error.code === 'INVALID_TRANSITION');
        assert.equal(await stock(db), before - (restock === true ? 0 : 1));
      }
    });

    await t.test('hourly scheduled expiry cancels all overdue PENDING orders in 3 statements; exact 24h and other states stay unchanged', async () => {
      await reset();
      await db.prepare('UPDATE product_variants SET stock_quantity = 100').run();
      const ids = (await db.prepare('SELECT id FROM product_variants ORDER BY id LIMIT 15').all()).results.map(row => row.id);
      const number = (await createOrder(db, body(ids.map(variant_id => ({ variant_id, quantity: 1 }))), randomUUID())).data.order_number;
      const second = (await createOrder(db, body([{ variant_id: 1, quantity: 2 }]), randomUUID())).data.order_number;
      const boundary = (await createOrder(db, body(), randomUUID())).data.order_number;
      const freshInput = body(); freshInput.sender.phone = '0900000001';
      const fresh = (await createOrder(db, freshInput, randomUUID())).data.order_number;
      const now = new Date('2026-10-15T12:00:00Z');
      const placed = (hours, sqlite = false) => new Date(now.getTime() - hours * 3600000).toISOString().replace(sqlite ? 'T' : '~', ' ');
      for (const [order, hours, sqlite] of [[number, 25, false], [second, 30, true], [boundary, 24, false], [fresh, 1, false]]) {
        await db.prepare('UPDATE orders SET placed_at = ? WHERE order_number = ?').bind(placed(hours, sqlite), order).run();
      }
      const skipped = [];
      for (const [index, status] of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].entries()) {
        const input = body(); input.sender.phone = `090000001${index}`;
        const order = (await createOrder(db, input, randomUUID())).data.order_number;
        for (const step of (status === 'CANCELLED' ? ['CANCELLED'] : ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'].slice(0, index + 1))) {
          await transitionOrder(db, order, step);
        }
        await db.prepare('UPDATE orders SET placed_at = ? WHERE order_number = ?').bind(placed(30), order).run();
        skipped.push(await orderRow(db, order));
      }
      const before = await stock(db);
      const counter = countedDb(db);
      await app.scheduled({ scheduledTime: now.getTime() }, { DB: counter.db, PENDING_ORDER_TTL_HOURS: '24' });
      assert.equal(counter.count, 3);
      for (const order of [number, second]) {
        const row = await orderRow(db, order);
        assert.equal(row.status_code, 'CANCELLED'); assert.equal(row.stock_released, 1);
        assert.equal(row.payment_status, 'UNPAID'); assert.equal(row.paid_at, null);
        assert.equal((await history(db, order)).at(-1).actor_label, 'SYSTEM');
        assert.equal((await history(db, order)).at(-1).note, 'Tự hủy: quá hạn xác nhận đơn.');
      }
      assert.equal((await orderRow(db, boundary)).status_code, 'PENDING');
      assert.equal((await orderRow(db, fresh)).status_code, 'PENDING');
      assert.equal(await stock(db), before + 3);
      for (const id of ids.slice(1)) assert.equal(await stock(db, id), 100);
      for (const row of skipped) assert.deepEqual(await orderRow(db, row.order_number), row);
      await expirePendingOrders({ DB: db, PENDING_ORDER_TTL_HOURS: '24' }, now);
      assert.equal(await stock(db), before + 3);
      await expirePendingOrders({ DB: db, PENDING_ORDER_TTL_HOURS: '24' }, new Date(now.getTime() + 3600000));
      assert.equal((await orderRow(db, boundary)).status_code, 'CANCELLED');
      assert.equal(await stock(db), before + 4);
    });

    await t.test('overlapping expiry batches restore shared inventory once; confirmation before batch is preserved', async () => {
      await reset();
      const first = (await createOrder(db, body(), randomUUID())).data.order_number;
      const second = (await createOrder(db, body(), randomUUID())).data.order_number;
      const old = new Date(Date.now() - 25 * 3600000).toISOString();
      await db.prepare('UPDATE orders SET placed_at = ?').bind(old).run();
      const before = await stock(db);
      const ready = barrier();
      const counters = [countedDb(db, ready), countedDb(db, ready)];
      await Promise.all(counters.map(counter => expirePendingOrders({ DB: counter.db, PENDING_ORDER_TTL_HOURS: '24' })));
      assert.equal(await stock(db), before + 2);
      for (const number of [first, second]) assert.equal((await history(db, number)).filter(row => row.to_status === 'CANCELLED').length, 1);
      assert.deepEqual(counters.map(counter => counter.count), [3, 3]);
      const third = (await createOrder(db, body(), randomUUID())).data.order_number;
      await db.prepare('UPDATE orders SET placed_at = ? WHERE order_number = ?').bind(old, third).run();
      const beforeConfirm = await stock(db);
      const raced = countedDb(db, () => transitionOrder(db, third, 'CONFIRMED'));
      await expirePendingOrders({ DB: raced.db, PENDING_ORDER_TTL_HOURS: '24' });
      assert.equal((await orderRow(db, third)).status_code, 'CONFIRMED');
      assert.equal(await stock(db), beforeConfirm);
      assert.equal((await history(db, third)).filter(row => row.actor_label === 'SYSTEM').length, 0);
    });

    await t.test('expiry stock/history/status roll back together on a failed batch; NULL variant snapshots are skipped', async () => {
      await reset();
      const number = (await createOrder(db, body([{ variant_id: 1, quantity: 2 }, { variant_id: 2, quantity: 1 }]), randomUUID())).data.order_number;
      await db.prepare('UPDATE orders SET placed_at = ?').bind(new Date(Date.now() - 25 * 3600000).toISOString()).run();
      const before = await stock(db);
      const initialHistory = await history(db, number);
      const broken = { prepare: sql => db.prepare(sql), batch: statements => db.batch([
        ...statements.slice(0, 2), db.prepare("INSERT INTO order_status_history (order_id, to_status, actor_label) VALUES (-1, 'CANCELLED', 'SYSTEM')"),
      ]) };
      await assert.rejects(expirePendingOrders({ DB: broken, PENDING_ORDER_TTL_HOURS: '24' }));
      assert.equal(await stock(db), before);
      assert.equal((await orderRow(db, number)).status_code, 'PENDING');
      assert.deepEqual(await history(db, number), initialHistory);
      // Match ON DELETE SET NULL without removing a catalog fixture needed by later tests.
      await db.prepare('UPDATE order_items SET variant_id = NULL WHERE variant_id = 2').run();
      await expirePendingOrders({ DB: db, PENDING_ORDER_TTL_HOURS: '24' });
      assert.equal((await orderRow(db, number)).status_code, 'CANCELLED');
      assert.equal(await stock(db), before + 2);
      assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results, []);
    });

    await t.test('allowed delivery transitions write one timeline entry each and mark COD PAID only at DELIVERED', async () => {
      await reset();
      const before = await stock(db);
      const created = await createOrder(db, body(), randomUUID());
      const number = created.data.order_number;
      await assert.rejects(() => transitionOrder(db, number, 'DELIVERED', 'ADMIN'), error => error.code === 'INVALID_TRANSITION');
      for (const status of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']) {
        const result = await transitionOrder(db, number, status, 'ADMIN', `Demo ${status}`);
        assert.equal(result.status_code, status);
        assert.equal(result.payment_status, status === 'DELIVERED' ? 'PAID' : 'UNPAID');
      }
      const current = await orderRow(db, number);
      assert.equal(current.stock_released, 0);
      assert.equal(current.status_code, 'DELIVERED');
      assert.equal(current.payment_status, 'PAID');
      assert.ok(current.paid_at);
      assert.ok(current.delivered_at);
      assert.equal(current.paid_at, current.delivered_at);
      assert.equal(await stock(db), before - 1);
      const entries = await history(db, number);
      assert.deepEqual(entries.map(row => row.to_status), ['PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']);
      assert.deepEqual(entries.map(row => row.from_status), [null, 'PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT']);
      assert.deepEqual(entries.map(row => row.actor_label), ['CUSTOMER', 'ADMIN', 'ADMIN', 'ADMIN', 'ADMIN']);
      await assert.rejects(() => transitionOrder(db, number, 'CANCELLED', 'ADMIN'), error => error.code === 'INVALID_TRANSITION');
      await assert.rejects(() => transitionOrder(db, number, 'DELIVERED', 'ADMIN'), error => error.code === 'INVALID_TRANSITION');
      const detail = await lookupOrder(db, { order_number: number, phone: '0911111111' });
      assert.match(detail.delivered_at, /T.*Z$/);
      assert.match(detail.paid_at, /T.*Z$/);
      assert.equal((await history(db, number)).length, 5);
      console.log('Phase 3 D1 LOCAL transition: PENDING -> CONFIRMED -> PREPARING -> IN_TRANSIT -> DELIVERED; history=5; payment=PAID; paid_at=delivered_at; terminal changes rejected.');
    });

    await t.test('cancellation from each allowed state restores quantities once and rejects repeated cancellation', async () => {
      for (const origin of ['PENDING', 'CONFIRMED', 'PREPARING']) {
        await reset();
        const before = await stock(db);
        const secondBefore = await stock(db, 2);
        const created = await createOrder(db, body([{ variant_id: 1, quantity: 2 }, { variant_id: 2, quantity: 1 }]), randomUUID());
        const number = created.data.order_number;
        if (origin !== 'PENDING') await transitionOrder(db, number, 'CONFIRMED', 'ADMIN');
        if (origin === 'PREPARING') await transitionOrder(db, number, 'PREPARING', 'ADMIN');
        const note = "Demo '); SELECT secret --";
        const counter = countedDb(db);
        const result = await transitionOrder(counter.db, number, 'CANCELLED', 'ADMIN', note);
        assert.equal(result.status_code, 'CANCELLED');
        assert.equal(await stock(db), before);
        assert.equal(await stock(db, 2), secondBefore);
        const current = await orderRow(db, number);
        assert.equal(current.stock_released, 1);
        assert.equal(current.payment_status, 'UNPAID');
        assert.equal(current.paid_at, null);
        assert.equal(current.delivered_at, null);
        const initialEntries = await history(db, number);
        assert.equal(initialEntries.filter(entry => entry.to_status === 'CANCELLED').length, 1);
        assert.equal(initialEntries.at(-1).note, note);
        assert.ok(counter.queries.every(query => !query.sql.includes(note)));
        assert.ok(counter.queries.some(query => query.values.includes(note)));
        await assert.rejects(() => transitionOrder(db, number, 'CANCELLED', 'ADMIN'), error => error.code === 'INVALID_TRANSITION' && error.status === 409);
        assert.equal(await stock(db), before);
        assert.equal(await stock(db, 2), secondBefore);
        assert.deepEqual(await history(db, number), initialEntries);
      }
      console.log('Phase 3 D1 LOCAL cancellation: PENDING/CONFIRMED/PREPARING -> CANCELLED restores both lines exactly once; second cancel=INVALID_TRANSITION; no extra history/stock.');
    });

    await t.test('simultaneous stale-state cancellations restore inventory once and create one cancellation history', async () => {
      await reset();
      const before = await stock(db);
      const created = await createOrder(db, body([{ variant_id: 1, quantity: 2 }]), randomUUID());
      const number = created.data.order_number;
      const ready = barrier();
      const counters = [countedDb(db, ready), countedDb(db, ready)];
      const results = await Promise.allSettled(counters.map(counter => transitionOrder(counter.db, number, 'CANCELLED', 'ADMIN')));
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      const rejected = results.find(result => result.status === 'rejected');
      assert.equal(rejected.reason.code, 'INVALID_TRANSITION');
      assert.equal(await stock(db), before);
      assert.equal((await orderRow(db, number)).stock_released, 1);
      assert.deepEqual((await history(db, number)).map(row => row.to_status), ['PENDING', 'CANCELLED']);
      assert.deepEqual(counters.map(counter => counter.count), [5, 5]);
      console.log('Phase 3 D1 LOCAL concurrent cancellation: both pre-read PENDING; one success/one INVALID_TRANSITION; stock restored once; history=[PENDING,CANCELLED].');
    });

    await t.test('a concurrent confirm/cancel winner controls stock; stale loser adds no history', async () => {
      await reset();
      const before = await stock(db);
      const created = await createOrder(db, body(), randomUUID());
      const number = created.data.order_number;
      const ready = barrier();
      const confirm = countedDb(db, ready);
      const cancel = countedDb(db, ready);
      const results = await Promise.allSettled([
        transitionOrder(confirm.db, number, 'CONFIRMED', 'ADMIN'),
        transitionOrder(cancel.db, number, 'CANCELLED', 'ADMIN'),
      ]);
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      assert.equal(results.find(result => result.status === 'rejected').reason.code, 'INVALID_TRANSITION');
      const current = await orderRow(db, number);
      assert.ok(['CONFIRMED', 'CANCELLED'].includes(current.status_code));
      assert.equal(await stock(db), current.status_code === 'CANCELLED' ? before : before - 1);
      assert.equal(current.stock_released, current.status_code === 'CANCELLED' ? 1 : 0);
      assert.deepEqual((await history(db, number)).map(row => row.to_status), ['PENDING', current.status_code]);
    });

    await t.test('hard-deleted variants preserve lookup snapshots and cancellation skips NULL variant IDs', async () => {
      await reset();
      const created = await createOrder(db, body(), randomUUID());
      const number = created.data.order_number;
      const before = await lookupOrder(db, { order_number: number, phone: '0900000000' });
      await db.prepare('DELETE FROM product_variants WHERE id = ?').bind(1).run();
      const after = await lookupOrder(db, { order_number: number, phone: '0911111111' });
      assert.deepEqual(after, before);
      const item = await db.prepare('SELECT variant_id FROM order_items WHERE order_id = ?').bind((await orderRow(db, number)).id).first();
      assert.equal(item.variant_id, null);
      const result = await transitionOrder(db, number, 'CANCELLED', 'ADMIN');
      assert.equal(result.status_code, 'CANCELLED');
      assert.equal((await orderRow(db, number)).stock_released, 1);
      assert.deepEqual((await history(db, number)).map(row => row.to_status), ['PENDING', 'CANCELLED']);
      assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results, []);
    });
    console.log('Phase 3 D1 LOCAL evidence: persist=false; remoteBindings=false; canonical schema unchanged; persisted seed untouched.');
  } finally {
    await platform.dispose();
  }
});
