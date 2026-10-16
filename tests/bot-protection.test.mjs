import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import app from '../worker/index.ts';
import { createOrder } from '../worker/services/orders.ts';
import { verifyTurnstile } from '../worker/lib/turnstile.ts';
import { expirePendingOrders } from '../worker/services/pending-orders.ts';
import { todayInVN } from '../worker/lib/datetime.ts';
import { createTestDb } from './helpers/worker.mjs';
import { adminEnv } from './helpers/admin.mjs';

function body() {
  const date = new Date(Date.parse(`${todayInVN()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  return { items: [{ variant_id: 1, quantity: 1 }],
    sender: { name: 'SMOKE sender', phone: '0900000000', is_anonymous: false },
    recipient: { name: 'SMOKE recipient', phone: '0911111111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: '12 Phố Hoa Demo' },
    delivery: { method_code: 'STANDARD', date, time_slot: '08:00-10:00' }, card: { type: 'NONE' } };
}
const post = (value, key = randomUUID()) => ({ method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'http://localhost', 'Idempotency-Key': key }, body: JSON.stringify(value) });

test('rate limits reject before validation, auth, Turnstile and D1; counters use CF IP and path', async () => {
  const calls = [];
  const limiter = { async limit(value) { calls.push(value); return { success: false }; } };
  const env = { ...adminEnv, RATE_LIMIT_SENSITIVE: limiter, RATE_LIMIT_PUBLIC: limiter };
  for (const route of ['/api/orders', '/api/orders/lookup', '/api/admin/login', '/api/checkout/quote']) {
    const init = post({});
    init.headers['CF-Connecting-IP'] = '192.0.2.1';
    init.headers['X-Forwarded-For'] = randomUUID();
    const response = await app.request(route, init, env);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('Retry-After'), '60');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal((await response.json()).error.code, 'RATE_LIMITED');
    assert.equal(calls.at(-1).key, `${route}:192.0.2.1`);
  }
  for (const route of ['/api/categories', '/api/products', '/api/products/demo', '/api/delivery/options']) {
    assert.equal((await app.request(route, {}, env)).status, 429);
  }
  assert.equal((await app.request('https://shop.example/api/orders', post(body()), {})).status, 503);
});

test('Turnstile enforces action and hostname, including missing claims and provider failure', async () => {
  const expected = { action: 'lookup', hostname: 'shop.example' };
  for (const claims of [{ success: true }, { success: true, action: 'checkout', hostname: expected.hostname },
    { success: true, action: expected.action, hostname: 'attacker.example' }, { success: false, ...expected }]) {
    await assert.rejects(verifyTurnstile('test-secret', 'test-token', async () => Response.json(claims), undefined, expected), error => error.code === 'FORBIDDEN');
  }
  await verifyTurnstile('test-secret', 'test-token', async () => Response.json({ success: true, ...expected }), undefined, expected);
});

test('all three routes require Turnstile with configured secret; fresh-token checkout retry keeps the saved order', async t => {
  const h = createTestDb(); t.after(() => h.close());
  const env = { ...adminEnv, DB: h.db, TURNSTILE_SECRET: 'test-secret' };
  const paths = [['/api/orders', body(), 'checkout'], ['/api/orders/lookup', { order_number: 'unknown', phone: '0900000000' }, 'lookup'],
    ['/api/admin/login', { password: adminEnv.ADMIN_PASSWORD }, 'admin_login']];
  for (const [path, value] of paths) {
    h.resetQueryCount();
    const response = await app.request(path, post(value), env);
    assert.equal(response.status, 403);
    assert.equal(h.queryCount, 0);
    assert.equal(response.headers.get('Set-Cookie'), null);
  }
  let action = 'checkout';
  const tokens = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    const input = JSON.parse(init.body); tokens.push(input.response);
    assert.equal(input.idempotency_key, undefined, 'fresh challenge is independent of the order UUID');
    return Response.json({ success: true, action, hostname: 'localhost' });
  });
  const key = randomUUID();
  const first = await app.request('/api/orders', post({ ...body(), turnstile_token: 'fresh-one' }, key), env);
  assert.equal(first.status, 201);
  const number = (await first.json()).data.order_number;
  const retry = await app.request('/api/orders', post({ ...body(), turnstile_token: 'fresh-two' }, key), env);
  assert.equal(retry.status, 200); assert.equal((await retry.json()).data.replayed, true);
  action = 'lookup';
  assert.equal((await app.request('/api/orders/lookup', post({ order_number: number, phone: '0900000000', turnstile_token: 'lookup-token' }), env)).status, 200);
  action = 'admin_login';
  const login = await app.request('/api/admin/login', post({ password: adminEnv.ADMIN_PASSWORD, turnstile_token: 'login-token' }), env);
  assert.equal(login.status, 200); assert.ok(login.headers.get('Set-Cookie'));
  assert.deepEqual(tokens, ['fresh-one', 'fresh-two', 'lookup-token', 'login-token']);
});

test('three PENDING per normalized sender phone; replay and confirmed orders do not consume additional capacity', async t => {
  const h = createTestDb(); t.after(() => h.close());
  const keys = [randomUUID(), randomUUID(), randomUUID()];
  const numbers = [];
  for (const [index, phone] of ['0900000000', '+84 900.000.000', '090 000 0000'].entries()) {
    const input = body(); input.sender.phone = phone;
    numbers.push((await createOrder(h.db, input, keys[index])).data.order_number);
  }
  const stock = h.sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE id = 1').get().stock_quantity;
  await assert.rejects(createOrder(h.db, body(), randomUUID()), error => error.code === 'PENDING_ORDER_LIMIT' && error.status === 429);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM orders').get().n, 3);
  assert.equal(h.sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE id = 1').get().stock_quantity, stock);
  assert.equal((await createOrder(h.db, body(), keys[0])).replayed, true);
  h.sqlite.prepare("UPDATE orders SET status_code = 'CONFIRMED' WHERE order_number = ?").run(numbers[0]);
  assert.equal((await createOrder(h.db, body(), randomUUID())).replayed, false);
});

test('pending expiry is disabled without an explicit TTL and rejects invalid configuration before querying', async () => {
  await expirePendingOrders({});
  for (const hours of ['0', '-1', '1.5', '169', 'invalid']) {
    await assert.rejects(expirePendingOrders({ PENDING_ORDER_TTL_HOURS: hours }), /configuration/);
  }
  assert.equal(typeof app.scheduled, 'function');
});


test('all protected routes fail closed before D1/auth/provider when secret is absent, including remote bypass attempts', async t => {
  const h = createTestDb(); t.after(() => h.close());
  let providerCalls = 0;
  t.mock.method(globalThis, 'fetch', async () => { providerCalls++; throw new Error('provider must not run'); });
  const paths = [['/api/orders', body()], ['/api/orders/lookup', { order_number: 'unknown', phone: '0900000000' }],
    ['/api/admin/login', { password: adminEnv.ADMIN_PASSWORD }]];
  const limiter = { limit: async () => ({ success: true }) };
  for (const origin of ['https://lunara.minphuc2408.workers.dev', 'https://lunara-staging.minphuc2408.workers.dev', 'https://localhost.attacker.test', 'http://localhost']) {
    for (const bypass of [undefined, 'false', 'TRUE', ...(origin === 'http://localhost' ? [] : ['true'])]) {
      for (const secret of [undefined, '', '  ']) {
        for (const [route, value] of paths) {
          h.resetQueryCount();
          const init = post({ ...value, allowLocalBypass: true, TURNSTILE_ALLOW_LOCAL_BYPASS: 'true' });
          init.headers.Origin = origin;
          init.headers['X-Forwarded-Host'] = 'localhost';
          const response = await app.request(origin + route, init, { ...adminEnv, DB: h.db,
            TURNSTILE_SECRET: secret, TURNSTILE_ALLOW_LOCAL_BYPASS: bypass,
            RATE_LIMIT_SENSITIVE: limiter, RATE_LIMIT_PUBLIC: limiter });
          assert.equal(response.status, 503, origin + route);
          assert.equal((await response.json()).error.code, 'TURNSTILE_NOT_CONFIGURED');
          assert.equal(response.headers.get('Cache-Control'), 'no-store');
          assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
          assert.equal(response.headers.get('Set-Cookie'), null);
          assert.equal(h.queryCount, 0);
        }
      }
    }
  }
  assert.equal(providerCalls, 0);
});

test('Worker API success and error responses carry security headers independently of static assets', async () => {
  for (const [route, status] of [['/api/health', 200], ['/api/unknown-header-test', 404], ['/api/admin/me', 401]]) {
    const response = await app.request('http://localhost' + route, {}, {});
    assert.equal(response.status, status);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.ok(['DENY', 'SAMEORIGIN'].includes(response.headers.get('X-Frame-Options')));
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.match(response.headers.get('Content-Type'), /^application\/json/);
    assert.ok(response.headers.get('X-Request-Id'));
  }
});
