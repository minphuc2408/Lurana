import test from 'node:test';
import assert from 'node:assert/strict';
import { timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';
import { parseRemoteArgs, parseCredentials, assertSafePayload, runRemoteSmoke } from '../scripts/smoke-remote.mjs';

const origin = 'https://smoke.example.invalid';
const writeArgs = ['--base-url', origin, '--allow-remote-writes', '--confirm-origin', origin, '--variant-id', '1', '--exclusive-test-window'];
const demoPassword = 'smoke-remote-local-only-password-24-characters';
const demoSecret = 'smoke-remote-local-only-distinct-jwt-secret-32-characters';

test('deployment smoke is read-only by default and writes require origin, variant and exclusive-window opt-in', () => {
  assert.deepEqual(parseRemoteArgs(['--base-url', origin]), { origin, writes: false });
  assert.deepEqual(parseRemoteArgs(writeArgs), { origin, writes: true, variantId: 1 });
  for (const option of ['--allow-remote-writes', '--confirm-origin', '--variant-id', '--exclusive-test-window']) {
    const args = [...writeArgs];
    const index = args.indexOf(option);
    args.splice(index, option === '--confirm-origin' || option === '--variant-id' ? 2 : 1);
    assert.throws(() => parseRemoteArgs(args));
  }
  assert.throws(() => parseRemoteArgs([...writeArgs, '--base-url', origin]), /Duplicate/);
  assert.throws(() => parseRemoteArgs(writeArgs.map(value => value === '1' ? '9007199254740992' : value)), /positive/);
  assert.throws(() => parseRemoteArgs(writeArgs.map((value, index) => index === 4 ? 'https://other.example.invalid' : value)), /matching/);
});

test('deployment smoke rejects credentials and URL ambiguity before making requests', () => {
  for (const value of ['http://smoke.example.invalid', 'https://admin:secret@smoke.example.invalid', `${origin}/path`, `${origin}/?secret=x`, `${origin}/#x`,
    'https://localhost', 'https://localhost.', 'https://x.localhost', 'https://x.local', 'https://x.localdomain', 'https://intranet',
    'https://127.0.0.1', 'https://127.0.0.2', 'https://10.0.0.1', 'https://169.254.169.254', 'https://[::1]', 'https://[fe80::1]', `${origin}:444`, 'not-a-url']) {
    assert.throws(() => parseRemoteArgs(['--base-url', value]));
  }
  const secret = 'DO-NOT-ECHO-THIS-PASSWORD';
  assert.throws(() => parseRemoteArgs(['--base-url', origin, '--password', secret]), error => !error.message.includes(secret));
  assert.throws(() => parseRemoteArgs([]), /explicit/);
  assert.throws(() => parseCredentials(`{"admin_password":"${secret}","JWT_SECRET":"private"}`), /Unexpected/);
  assert.throws(() => parseCredentials(secret), error => !error.message.includes(secret));
  assert.deepEqual(parseCredentials(JSON.stringify({ admin_password: demoPassword, turnstile_tokens: ['private-token'] })), { password: demoPassword, tokens: ['private-token'] });
});

test('response privacy checks recursively reject credentials/JWT, and private public fields without echoing values', () => {
  const privateValue = 'NEVER-ECHO-THIS-CREDENTIAL';
  for (const value of [{ nested: { jwt_secret: privateValue } }, { value: `error contains ${privateValue}` }, { nested: ['eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4ifQ.signature'] }]) {
    assert.throws(() => assertSafePayload(value, [privateValue]), error => !error.message.includes(privateValue));
  }
  assert.throws(() => assertSafePayload({ nested: { stock_quantity: 2 } }, [], true), /private/);
  assert.doesNotThrow(() => assertSafePayload({ data: { stock_quantity: 2 } }));
});

async function isolated(action) {
  if (!crypto.subtle.timingSafeEqual) crypto.subtle.timingSafeEqual = (a, b) => timingSafeEqual(Buffer.from(a), Buffer.from(b));
  const { default: app } = await import('../worker/index.ts');
  const platform = await getPlatformProxy({ configPath: fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)),
    envFiles: [fileURLToPath(new URL('../.dev.vars.example', import.meta.url))], persist: false, remoteBindings: false });
  let server;
  try {
    const db = platform.env.DB;
    for (const file of ['../migrations/0001_mvp.sql', '../migrations/0002_category_images.sql', '../migrations/0003_hanoi_administrative_areas.sql', '../docs/sql/MVP_SEED_DEV.sql']) {
      await db.batch(splitSqlQuery(readFileSync(new URL(file, import.meta.url), 'utf8')).map(sql => db.prepare(sql)));
    }
    const calls = [];
    server = createServer(async (incoming, outgoing) => {
      try {
        const chunks = [];
        for await (const chunk of incoming) chunks.push(chunk);
        const body = Buffer.concat(chunks);
        // The runner's synthetic HTTPS origin is mapped only inside this local test bridge.
        // Preserve HTTPS cookie semantics while opting into loopback-only test bypass.
        const url = new URL(incoming.url, 'https://127.0.0.1');
        const headers = new Headers(incoming.headers);
        if (headers.get('Origin') === origin) headers.set('Origin', url.origin);
        const method = incoming.method || 'GET';
        calls.push({ route: url.pathname, method, body: body.length ? JSON.parse(body.toString()) : undefined });
        const response = url.pathname.startsWith('/api/')
          ? await app.fetch(new Request(url, { method, headers, ...(!['GET', 'HEAD'].includes(method) ? { body } : {}) }),
            { DB: db, ADMIN_PASSWORD: demoPassword, JWT_SECRET: demoSecret, TURNSTILE_ALLOW_LOCAL_BYPASS: 'true',
              RATE_LIMIT_SENSITIVE: { limit: async () => ({ success: true }) },
              RATE_LIMIT_PUBLIC: { limit: async () => ({ success: true }) } })
          : new Response('<html><div id="root"></div></html>', { headers: { 'content-type': 'text/html' } });
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      } catch {
        outgoing.writeHead(500, { 'content-type': 'application/json' });
        outgoing.end('{"error":{"code":"LOCAL_TEST_BRIDGE"}}');
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const localOrigin = `http://127.0.0.1:${server.address().port}`;
    const bridge = async (url, init) => {
      assert.equal(url.origin, origin, 'Test bridge only maps the explicit synthetic HTTPS origin.');
      return fetch(new URL(url.pathname + url.search, localOrigin), init);
    };
    const stock = async () => (await db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').bind(1).first()).stock_quantity;
    await action({ db, bridge, calls, stock });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await platform.dispose();
  }
}

test('remote mode runs its full API suite through loopback HTTP with isolated local D1; CLI HTTPS guard stays enabled', async t => {
  await isolated(async ({ db, bridge, calls, stock }) => {
    const before = await stock();
    const messages = [];
    const readOnly = await runRemoteSmoke(parseRemoteArgs(['--base-url', origin]), { fetchImpl: bridge, log: text => messages.push(text) });
    assert.equal(readOnly.writes, false);
    assert.equal(calls.every(call => call.method === 'GET'), true, 'Default mode must never login, create orders or edit inventory.');
    calls.length = 0;
    const result = await runRemoteSmoke(parseRemoteArgs(writeArgs), { fetchImpl: bridge, log: text => messages.push(text), credentials: { password: demoPassword, tokens: [] } });
    assert.equal(result.cleanupRequired, true);
    assert.equal(result.baseline, before);
    assert.equal(await stock(), before, 'Only selected test inventory must be restored.');
    const orders = (await db.prepare('SELECT customer_note, status_code, payment_status, stock_released FROM orders ORDER BY id').all()).results;
    assert.equal(orders.length, 3);
    assert.equal(orders.every(order => order.customer_note === `SMOKE ${result.runId}`), true);
    assert.deepEqual(orders.map(order => order.status_code), ['DELIVERED', 'CANCELLED', 'CANCELLED']);
    assert.equal(orders[0].payment_status, 'PAID');
    assert.equal(orders[1].stock_released, 1);
    assert.equal(orders[2].stock_released, 1);
    const mutations = calls.filter(call => !['GET', 'HEAD'].includes(call.method));
    assert.equal(mutations.every(call => ['/api/orders', '/api/orders/lookup', '/api/checkout/quote', '/api/admin/login', '/api/admin/logout', '/api/admin/variants/1'].includes(call.route)
      || /^\/api\/admin\/orders\/LNR-[\w-]+\/status$/.test(call.route)), true, 'No product, zone, SQL or unrelated variant write is allowed.');
    assert.equal(calls.filter(call => call.route === '/api/orders').length, 5, 'Three accepted orders, one replay and one rejected race request.');
    assert.equal(messages.join('\n').includes(demoPassword) || messages.join('\n').includes(demoSecret), false);
    assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results, []);
    await t.test('last-item race rejects non-stock failures instead of accepting any failed request', async () => {
      let orderRequests = 0;
      const brokenRace = async (url, init) => {
        if (url.pathname === '/api/orders' && ++orderRequests === 5) {
          return new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR' } }), { status: 400,
            headers: { 'content-type': 'application/json', 'x-request-id': 'synthetic', 'x-content-type-options': 'nosniff' } });
        }
        return bridge(url, init);
      };
      await assert.rejects(runRemoteSmoke(parseRemoteArgs(writeArgs), { fetchImpl: brokenRace, log: () => {}, credentials: { password: demoPassword, tokens: [] } }), /Deployment smoke failed/);
      assert.equal(await stock(), before);
    });
  });
});

test('an ambiguous applied inventory write is never repeated or automatically overwritten and never leaks its error', async () => {
  await isolated(async ({ bridge, calls, stock }) => {
    const before = await stock();
    const messages = [];
    let deltas = 0;
    const failAfterCommit = async (url, init) => {
      const response = await bridge(url, init);
      if (url.pathname === '/api/admin/variants/1' && ++deltas === 2) throw new Error(`private response: ${demoPassword}`);
      return response;
    };
    await assert.rejects(runRemoteSmoke(parseRemoteArgs(writeArgs), { fetchImpl: failAfterCommit, log: text => messages.push(text), credentials: { password: demoPassword, tokens: [] } }), /Deployment smoke failed/);
    assert.equal(calls.filter(call => call.route === '/api/admin/variants/1').length, 2, 'Never retry a possibly-applied stock_delta.');
    assert.equal(await stock(), 1, 'An ambiguous successful adjustment must be left for explicit reconciliation.');
    assert.ok(before > 1);
    assert.match(messages.join('\n'), /ambiguous_write=true/);
    assert.equal(messages.join('\n').includes(demoPassword), false);
  });
});

test('a committed order with missing confirmation identity is ambiguous and cannot trigger stock compensation', async () => {
  await isolated(async ({ db, bridge, calls, stock }) => {
    const before = await stock();
    const messages = [];
    const malformedAfterCommit = async (url, init) => {
      const response = await bridge(url, init);
      if (url.pathname === '/api/orders' && response.status === 201) {
        return new Response('{"data":{}}', { status: 201, headers: response.headers });
      }
      return response;
    };
    await assert.rejects(runRemoteSmoke(parseRemoteArgs(writeArgs), { fetchImpl: malformedAfterCommit, log: text => messages.push(text), credentials: { password: demoPassword, tokens: [] } }), /Deployment smoke failed/);
    assert.equal(await stock(), before - 1, 'Never compensate stock while a committed order has not been safely identified/cancelled.');
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM orders').first()).count, 1);
    assert.equal(calls.some(call => call.route.includes('/variants/') || call.route.endsWith('/status')), false);
    assert.match(messages.join('\n'), /known_orders=0; ambiguous_write=true/);
  });
});

test('deployment smoke follows only one same-origin canonical trailing-slash SPA redirect', async () => {
  await isolated(async ({ bridge }) => {
    const config = parseRemoteArgs(['--base-url', origin]);
    const destinations = [];
    const canonical = async (url, init) => {
      destinations.push(url.href);
      if (url.pathname === '/shop') return new Response(null, { status: 307, headers: { location: '/shop/' } });
      return bridge(url, init);
    };
    const result = await runRemoteSmoke(config, { fetchImpl: canonical, log: () => {} });
    assert.equal(result.passed, 3);
    assert.ok(destinations.includes(origin + '/shop/'));
    for (const location of ['https://other.example.invalid/shop/', 'http://smoke.example.invalid/shop/', '/api/admin/me', '/shop/?private=x', '/shop/#fragment', 'https://user:password@smoke.example.invalid/shop/']) {
      const followed = [];
      const unsafe = async (url, init) => {
        followed.push(url.href);
        return url.pathname === '/shop' ? new Response(null, { status: 307, headers: { location } }) : bridge(url, init);
      };
      await assert.rejects(runRemoteSmoke(config, { fetchImpl: unsafe, log: () => {} }), /Deployment smoke failed/);
      assert.equal(followed.some(href => href !== origin + '/shop' && ![origin+'/',origin+'/api/health'].includes(href)), false);
    }
    let redirects = 0;
    const looping = async (url, init) => {
      if (url.pathname.startsWith('/shop')) { redirects++; return new Response(null, { status: 307, headers: { location: '/shop/' } }); }
      return bridge(url, init);
    };
    await assert.rejects(runRemoteSmoke(config, { fetchImpl: looping, log: () => {} }), /Deployment smoke failed/);
    assert.equal(redirects, 2);
  });
});
