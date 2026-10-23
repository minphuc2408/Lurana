import { ORDER_STATUSES } from '../shared/constants.ts';
import assert from 'node:assert/strict';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';

// Explicit deployment mode never falls through to the local D1 harness below.
if (process.argv.slice(2).some(argument => argument.startsWith('--'))) {
  const { runRemoteCli } = await import('./smoke-remote.mjs');
  await runRemoteCli(process.argv.slice(2));
  process.exit(process.exitCode || 0);
}

const baseUrl = new URL(process.argv[2] || 'http://127.0.0.1:5173');
if (baseUrl.hostname !== '127.0.0.1' || !['http:', 'https:'].includes(baseUrl.protocol)) {
  throw new Error('Smoke checks require a local server on 127.0.0.1.');
}

const request = (route, options = {}) => fetch(new URL(route, baseUrl), {
  ...options, redirect: options.redirect ?? 'error', signal: AbortSignal.timeout(10_000),
});
const navigationHeaders = { accept: 'text/html', 'sec-fetch-mode': 'navigate' };
const forbiddenKeys = new Set(['stock_quantity', 'archived_at', 'cloudinary_public_id']);
const confidentialKeys = new Set(['password', 'password_hash', 'admin_password', 'jwt_secret', 'secret', 'jwt', 'token', 'cookie', 'stack', 'stack_trace', 'sql']);
let passed = 0;
let failed = 0;
let products;
let categories;
let deliveryOptions;

function safeApiData(value) {
  if (typeof value === 'string') {
    assert.doesNotMatch(value, /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/, 'Response body leaked a JWT');
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!confidentialKeys.has(key.toLowerCase()), `API response leaked ${key}`);
    safeApiData(child);
  }
}

function safePublicData(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbiddenKeys.has(key), `Public response leaked ${key}`);
    safePublicData(child);
  }
}

async function json(route, status = 200, init = {}) {
  const response = await request(route, init);
  assert.equal(response.status, status, `${init.method || 'GET'} ${route}`);
  assert.match(response.headers.get('content-type'), /^application\/json;\s*charset=utf-8$/i);
  assert.ok(response.headers.get('x-request-id'), 'API response must have a request ID');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const payload = await response.json();
  safeApiData(payload);
  safePublicData(payload);
  return { response, payload };
}

function catalogCache(response) {
  assert.equal(response.headers.get('cache-control'), 'public, max-age=30');
}

async function error(route, status, code, init) {
  const { response, payload } = await json(route, status, init);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(payload), ['error']);
  assert.equal(payload.error.code, code);
  assert.equal(typeof payload.error.message, 'string');
  assert.ok(payload.error.message.length > 0);
  assert.doesNotMatch(payload.error.message, /(?:SELECT|INSERT|UPDATE|DELETE)\s|(?:TypeError|SyntaxError|Error):|\n\s*at\s/i);
  if (code === 'VALIDATION_ERROR') {
    assert.ok(Array.isArray(payload.error.details) && payload.error.details.length > 0);
    for (const issue of payload.error.details) {
      assert.ok(Object.hasOwn(issue, 'path'));
      assert.equal(typeof issue.message, 'string');
    }
  }
  return payload.error;
}

async function check(name, action) {
  try {
    await action();
    passed++;
    console.log(`PASS ${name}`);
  } catch (cause) {
    failed++;
    console.error(`FAIL ${name}: ${cause.message}`);
  }
}

function peony(size = 'S') {
  assert.ok(products, 'Catalog check must succeed first');
  const product = products.find(item => item.slug === 'blush-peony-bouquet');
  assert.ok(product, 'Seed peony product is missing');
  const variant = product.variants.find(item => item.size_code === size);
  assert.ok(variant, `Seed peony ${size} is missing`);
  return { product, variant };
}

function quoteBody(overrides = {}) {
  return {
    items: [{ variant_id: peony().variant.id, quantity: 1 }],
    province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm',
    delivery_method_code: 'STANDARD', ...overrides,
  };
}

const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
async function quote(body) {
  const { response, payload } = await json('/api/checkout/quote', 200, post(body));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(payload), ['data']);
  assert.equal(payload.data.discount_total, 0);
  assert.equal(payload.data.grand_total, payload.data.subtotal + payload.data.delivery_fee);
  assert.ok(Array.isArray(payload.data.lines));
  assert.ok(Array.isArray(payload.data.issues));
  for (const line of payload.data.lines) {
    assert.equal(line.line_total, line.unit_price * line.quantity);
    assert.equal(typeof line.name_vi, 'string');
    assert.equal(typeof line.name_en, 'string');
    assert.ok(line.image_url === null || typeof line.image_url === 'string');
  }
  assert.equal(payload.data.subtotal, payload.data.lines.reduce((sum, line) => sum + line.line_total, 0));
  return payload.data;
}

console.log(`D1 LOCAL ONLY read-only catalog smoke at ${baseUrl.origin}; order writes use a separate persist:false D1.`);

await check('health + security headers', async () => {
  for (const headers of [{}, navigationHeaders]) {
    const { payload } = await json('/api/health', 200, { headers });
    assert.equal(payload.data.ok, true);
    assert.equal(typeof payload.data.time, 'string');
    assert.ok(Number.isFinite(Date.parse(payload.data.time)));
  }
});

await check('API JSON 404 with normal/navigation headers', async () => {
  for (const headers of [{}, navigationHeaders]) {
    const failure = await error('/api/khong-co', 404, 'NOT_FOUND', { headers });
    assert.equal(failure.message, 'Không tìm thấy API.');
  }
});

await check('home + SPA /shop return HTML', async () => {
  for (const route of ['/', '/shop']) {
    let response = await request(route, { headers: navigationHeaders, redirect: 'manual' });
    // Static Shop metadata may canonicalize /shop to /shop/; never follow another origin.
    if (route === '/shop' && [301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      assert.ok(location, 'Shop redirect must include Location');
      assert.equal(new URL(location, baseUrl).href, new URL('/shop/', baseUrl).href);
      await response.body?.cancel();
      response = await request('/shop/', { headers: navigationHeaders });
    }
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /id="root"/);
  }
});

await check('categories: four seeded active categories', async () => {
  const { response, payload } = await json('/api/categories');
  catalogCache(response);
  assert.deepEqual(Object.keys(payload), ['data']);
  categories = payload.data;
  assert.deepEqual(categories.map(category => category.code), ['bouquets', 'arrangements', 'dried-flowers', 'gift-sets']);
  for (const category of categories) {
    assert.deepEqual(Object.keys(category).sort(), ['code', 'id', 'image_url', 'name_en', 'name_vi', 'slug']);
    assert.ok(Number.isInteger(category.id));
    assert.ok(category.name_vi && category.name_en);
  }
});

await check('products: eight products, S/M/L variants, primary image, safe DTO', async () => {
  const { response, payload } = await json('/api/products');
  catalogCache(response);
  assert.deepEqual(Object.keys(payload), ['data']);
  products = payload.data.items;
  assert.equal(products.length, 8);
  for (const product of products) {
    assert.ok(Number.isInteger(product.id));
    assert.ok(product.slug && product.name_vi && product.name_en && product.category_code);
    assert.equal(typeof product.is_featured, 'boolean');
    assert.deepEqual(product.variants.map(variant => variant.size_code).sort(), ['L', 'M', 'S']);
    assert.equal(product.images.length, 1);
    assert.equal(product.images.filter(image => image.is_primary).length, 1);
    assert.equal(typeof product.images[0].is_primary, 'boolean');
    assert.ok(product.images[0].url);
    for (const variant of product.variants) {
      assert.ok(Number.isInteger(variant.price) && variant.price >= 0);
      assert.ok(Number.isInteger(variant.max_quantity) && variant.max_quantity >= 0 && variant.max_quantity <= 20);
      assert.equal(typeof variant.in_stock, 'boolean');
      assert.equal(typeof variant.low_stock, 'boolean');
      assert.equal(variant.in_stock, variant.max_quantity > 0);
    }
  }
  assert.equal(peony().variant.price, 450000);
});

await check('product detail matches catalog; unknown slug is JSON 404', async () => {
  const product = peony().product;
  const { response, payload } = await json(`/api/products/${encodeURIComponent(product.slug)}`);
  catalogCache(response);
  assert.deepEqual(payload.data, product);
  await error('/api/products/no-such-demo-product', 404, 'NOT_FOUND');
});

await check('category/featured filters match catalog', async () => {
  assert.ok(categories && products, 'Catalog checks must succeed first');
  const code = categories[0].code;
  for (const [route, expected] of [
    [`/api/products?category=${encodeURIComponent(code)}`, products.filter(product => product.category_code === code)],
    ['/api/products?featured=1', products.filter(product => product.is_featured)],
    [`/api/products?category=${encodeURIComponent(code)}&featured=1`, products.filter(product => product.category_code === code && product.is_featured)],
    ['/api/products?category=no-such-category', []],
  ]) {
    const { response, payload } = await json(route);
    catalogCache(response);
    assert.deepEqual(payload.data.items, expected);
  }
});

await check('delivery options: DB provinces/wards/fees + configured limits', async () => {
  const { payload } = await json('/api/delivery/options');
  const options = payload.data;
  deliveryOptions = options;
  const provinces = [...options.provinces].sort((a, b) => a.province_name.localeCompare(b.province_name));
  assert.deepEqual(provinces, [
    { province_name: 'Thành phố Hà Nội', default_fee: null, free_from_amount: null, wards: [{ ward_name: 'Hoàn Kiếm', fee: 20000 }] },
  ]);
  assert.deepEqual(options.methods, [{ code: 'STANDARD', surcharge: 0 }, { code: 'EXPRESS', surcharge: 30000 }, { code: 'SAME_DAY', surcharge: 50000 }]);
  assert.ok(Array.isArray(options.time_slots) && options.time_slots.length > 0);
  for (const slot of options.time_slots) assert.match(slot, /^\d{2}:\d{2}-\d{2}:\d{2}$/);
  assert.deepEqual(options.limits, { max_cart_lines: 15, max_quantity_per_line: 20, max_advance_days: 30 });
});

await check('quote ignores forged client price/totals; ward fee uses DB', async () => {
  const data = await quote(quoteBody({
    items: [{ variant_id: peony().variant.id, quantity: 1, price: 1, unit_price: 1, line_total: 1 }],
    price: 1, subtotal: 1, delivery_fee: 1, grand_total: 1, role: 'ADMIN',
  }));
  assert.equal(data.lines.length, 1);
  assert.equal(data.lines[0].variant_id, peony().variant.id);
  assert.equal(data.lines[0].unit_price, 450000);
  assert.equal(data.lines[0].line_total, 450000);
  assert.equal(data.subtotal, 450000);
  assert.equal(data.delivery_fee, 20000);
  assert.equal(data.grand_total, 470000);
  assert.deepEqual(data.issues, []);
});

await check('quote unconfigured ward and unknown province are both 422', async () => {
  await error('/api/checkout/quote', 422, 'NO_DELIVERY_ZONE', post(quoteBody({ ward_name: 'Cửa Nam' })));
  await error('/api/checkout/quote', 422, 'NO_DELIVERY_ZONE', post(quoteBody({ province_name: 'Tỉnh mẫu không giao' })));
});

await check('quote free-delivery threshold preserves EXPRESS/SAME_DAY surcharge', async () => {
  for (const [delivery_method_code, surcharge] of [['STANDARD', 0], ['EXPRESS', 30000], ['SAME_DAY', 50000]]) {
    const data = await quote(quoteBody({ items: [{ variant_id: peony().variant.id, quantity: 2 }], delivery_method_code }));
    assert.equal(data.subtotal, 900000);
    assert.equal(data.delivery_fee, surcharge);
  }
});

await check('quote merges duplicate variants; merged quantity above 20 is CART_LIMIT', async () => {
  const variant_id = peony().variant.id;
  const data = await quote(quoteBody({ items: [{ variant_id, quantity: 1 }, { variant_id, quantity: 2 }] }));
  assert.equal(data.lines.length, 1);
  assert.equal(data.lines[0].quantity, 3);
  assert.equal(data.subtotal, 1350000);
  await error('/api/checkout/quote', 422, 'CART_LIMIT', post(quoteBody({ items: [{ variant_id, quantity: 10 }, { variant_id, quantity: 11 }] })));
});

await check('quote returns 200 issues for unknown variant and insufficient stock', async () => {
  const variant_id = 99999999;
  const unknown = await quote(quoteBody({ items: [{ variant_id, quantity: 1 }] }));
  assert.deepEqual(unknown.issues, [{ variant_id, code: 'VARIANT_UNAVAILABLE' }]);
  assert.deepEqual(unknown.lines, []);
  const large = peony('L').variant;
  const shortage = await quote(quoteBody({ items: [{ variant_id: large.id, quantity: 11 }] }));
  assert.deepEqual(shortage.issues, [{ variant_id: large.id, code: 'OUT_OF_STOCK', available: 10 }]);
});

await check('cart limits: 16 lines / quantity 0 / quantity 21', async () => {
  const variant_id = peony().variant.id;
  await error('/api/checkout/quote', 422, 'CART_LIMIT', post(quoteBody({ items: Array.from({ length: 16 }, () => ({ variant_id, quantity: 1 })) })));
  await error('/api/checkout/quote', 400, 'VALIDATION_ERROR', post(quoteBody({ items: [{ variant_id, quantity: 0 }] })));
  await error('/api/checkout/quote', 422, 'CART_LIMIT', post(quoteBody({ items: [{ variant_id, quantity: 21 }] })));
});

await check('malformed JSON / empty cart / invalid method are safe validation errors', async () => {
  await error('/api/checkout/quote', 400, 'VALIDATION_ERROR', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
  await error('/api/checkout/quote', 400, 'VALIDATION_ERROR', post(quoteBody({ items: [] })));
  await error('/api/checkout/quote', 400, 'VALIDATION_ERROR', post(quoteBody({ delivery_method_code: 'NOT_A_METHOD' })));
});

await check('orders reject missing key; admin without cookie returns 401 and no-store', async () => {
  await error('/api/orders', 400, 'VALIDATION_ERROR', post({}));
  await error('/api/admin/products', 401, 'UNAUTHORIZED');
});

console.log(`Catalog smoke: ${passed}/${passed + failed} PASS, ${failed} FAIL at ${baseUrl.origin}.`);

// Keep destructive acceptance checks away from the Vite/dev database. A loopback
// HTTP bridge exercises concurrent requests against the current Worker source and
// a real workerd D1 binding with all persistence and remote bindings disabled.
async function orderSmoke() {
  // Node's WebCrypto lacks workerd's native timingSafeEqual extension. Only this
  // local HTTP bridge uses the Node implementation; Worker code remains native.
  if (!crypto.subtle.timingSafeEqual) {
    crypto.subtle.timingSafeEqual = (left, right) => timingSafeEqual(Buffer.from(left), Buffer.from(right));
  }
  const [{ default: app }, { transitionOrder }, { todayInVN }] = await Promise.all([
    import('../worker/index.ts'), import('../worker/services/orders.ts'), import('../worker/lib/datetime.ts'),
  ]);
  const platform = await getPlatformProxy({
    configPath: fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)),
    persist: false, remoteBindings: false, envFiles: ['.dev.vars.example'],
  });
  let server;
  try {
    const db = platform.env.DB;
    for (const file of ['../migrations/0001_mvp.sql', '../migrations/0002_category_images.sql', '../migrations/0003_hanoi_administrative_areas.sql', '../docs/sql/MVP_SEED_DEV.sql']) {
      const sql = readFileSync(new URL(file, import.meta.url), 'utf8');
      await db.batch(splitSqlQuery(sql).map(statement => db.prepare(statement)));
    }
    const all = async (sql, values = []) => (await db.prepare(sql).bind(...values).all()).results;
    const first = (sql, values = []) => db.prepare(sql).bind(...values).first();
    const execute = (sql, values = []) => db.prepare(sql).bind(...values).run();
    const variants = await all('SELECT id, sku, price, stock_quantity FROM product_variants ORDER BY id');
    assert.equal(variants.length, 24);
    const peonyVariant = variants.find(variant => variant.sku === 'BPB-S');
    const scarceVariant = variants.at(-1);
    await execute('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [1, scarceVariant.id]);
    const initialStock = new Map((await all('SELECT id, stock_quantity FROM product_variants ORDER BY id'))
      .map(variant => [variant.id, variant.stock_quantity]));
    const stock = async id => (await first('SELECT stock_quantity FROM product_variants WHERE id = ?', [id])).stock_quantity;
    const orderCount = async () => (await first('SELECT COUNT(*) AS total FROM orders')).total;
    const requestCounts = [];
    // Synthetic credentials belong only to this persist:false test environment.
    // Never read .dev.vars or use production secrets for destructive acceptance.
    const demoPassword = 'isolated-smoke-admin-password-24-characters';
    const demoJwtSecret = 'isolated-smoke-jwt-secret-32-characters-distinct';
    const authEnv = { ADMIN_PASSWORD: demoPassword, JWT_SECRET: demoJwtSecret, TURNSTILE_ALLOW_LOCAL_BYPASS: 'true' };

    server = createServer(async (incoming, outgoing) => {
      let queries = 0;
      const rawStatements = new WeakMap();
      const counted = statement => {
        const wrapper = {
          bind(...values) { return counted(statement.bind(...values)); },
          async all() { queries++; return statement.all(); },
          async first(column) { queries++; return statement.first(column); },
          async run() { queries++; return statement.run(); },
        };
        rawStatements.set(wrapper, statement);
        return wrapper;
      };
      const requestDb = {
        prepare(sql) { return counted(db.prepare(sql)); },
        async batch(statements) {
          // Conservatively charge every submitted statement, even when the batch
          // fails early. Retried batches therefore cannot hide query-budget use.
          queries += statements.length;
          return db.batch(statements.map(statement => rawStatements.get(statement)));
        },
      };
      try {
        const chunks = [];
        for await (const chunk of incoming) chunks.push(chunk);
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) {
          if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        }
        const body = Buffer.concat(chunks);
        const url = `http://127.0.0.1:${server.address().port}${incoming.url}`;
        const method = incoming.method || 'GET';
        const response = await app.fetch(new Request(url, {
          method, headers, ...(!['GET', 'HEAD'].includes(method) ? { body } : {}),
        }), { DB: requestDb, ...authEnv });
        requestCounts.push({ route: incoming.url, method, status: response.status, queries });
        outgoing.writeHead(response.status, {
          ...Object.fromEntries(response.headers), 'x-smoke-d1-statements': String(queries),
        });
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      } catch (cause) {
        console.error(`Isolated smoke HTTP bridge failed: ${cause.message}`);
        outgoing.writeHead(500, { 'content-type': 'application/json' });
        outgoing.end(JSON.stringify({ error: { code: 'SMOKE_BRIDGE_FAILURE', message: 'Local smoke bridge failed.' } }));
      }
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const isolatedUrl = new URL(`http://127.0.0.1:${server.address().port}`);
    assert.equal(isolatedUrl.hostname, '127.0.0.1');
    console.log(`Phase 3/4 isolated HTTP smoke at ${isolatedUrl.origin}; real D1, persist=false, remoteBindings=false; synthetic auth only.`);
    const tomorrow = new Date(`${todayInVN()}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowDate = tomorrow.toISOString().slice(0, 10);
    const yesterday = new Date(`${todayInVN()}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    let senderSequence = 0;
    const body = (overrides = {}) => ({
      items: [{ variant_id: peonyVariant.id, quantity: 1 }],
      sender: { name: 'Smoke sender', phone: `0900000${String(senderSequence++).padStart(3, '0')}`, email: 'smoke@example.test', is_anonymous: false },
      recipient: { name: 'Smoke recipient', phone: '0911111111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: 'Demo smoke address' },
      delivery: { method_code: 'STANDARD', date: tomorrowDate, time_slot: '08:00-10:00' },
      card: { type: 'GREETING_CARD', message: 'Synthetic local smoke data' },
      customer_note: 'SMOKE local isolated test only', ...overrides,
    });
    const orderPost = (input, key = randomUUID()) => ({
      ...post(input), headers: { 'content-type': 'application/json', ...(key === null ? {} : { 'Idempotency-Key': key }) },
    });
    const localJson = async (route, init, expectedStatus) => {
      const response = await fetch(new URL(route, isolatedUrl), {
        ...init, redirect: 'error', signal: AbortSignal.timeout(10_000),
      });
      const payload = await response.json();
      assert.match(response.headers.get('content-type'), /^application\/json;\s*charset=utf-8$/i);
      const publicCatalog = !init?.method && /^(?:\/api\/(?:products|delivery\/options|categories))(?:[/?]|$)/.test(route);
      assert.equal(response.headers.get('cache-control'), publicCatalog && response.status === 200 ? 'public, max-age=30' : 'no-store');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.ok(response.headers.get('x-request-id'));
      safeApiData(payload);
      if (!route.startsWith('/api/admin/')) safePublicData(payload);
      const serialized = JSON.stringify(payload);
      assert.equal(serialized.includes(demoPassword) || serialized.includes(demoJwtSecret), false, 'Response body leaked synthetic credentials');
      if (expectedStatus !== undefined) assert.equal(response.status, expectedStatus, `${route}: ${JSON.stringify(payload)}`);
      const queryCount = Number(response.headers.get('x-smoke-d1-statements'));
      if (route === '/api/orders') assert.ok(queryCount <= 40, `POST /api/orders submitted ${queryCount} D1 statements`);
      return { response, payload, queryCount };
    };
    const create = async (input = body(), key = randomUUID(), expectedStatus = 201) => {
      const result = await localJson('/api/orders', orderPost(input, key), expectedStatus);
      assert.deepEqual(Object.keys(result.payload), ['data']);
      const summary = result.payload.data;
      assert.equal(summary.discount_total, 0);
      assert.equal(summary.grand_total, summary.subtotal + summary.delivery_fee);
      assert.equal(summary.payment_method, 'COD');
      assert.equal(summary.payment_status, 'UNPAID');
      assert.equal(summary.status_code, 'PENDING');
      assert.match(summary.order_number, /^LNR-\d{6}-[A-HJ-KM-NP-Z2-9]{6}$/);
      assert.ok(Number.isFinite(Date.parse(summary.placed_at)));
      assert.match(summary.placed_at, /Z$/);
      return result;
    };
    const localError = async (route, init, status, code) => {
      const result = await localJson(route, init, status);
      assert.deepEqual(Object.keys(result.payload), ['error']);
      assert.equal(result.payload.error.code, code);
      assert.equal(typeof result.payload.error.message, 'string');
      assert.doesNotMatch(result.payload.error.message, /(?:SELECT|INSERT|UPDATE|DELETE)\s|(?:TypeError|SyntaxError|Error):|\n\s*at\s/i);
      return result.payload.error;
    };
    const lookup = async (order_number, phone) => (await localJson('/api/orders/lookup', post({ order_number, phone }), 200)).payload.data;
    const beforePassed = passed;
    const beforeFailed = failed;
    let firstOrder;
    const firstKey = randomUUID();

    await check('Phase 3 01/10 valid COD order: DB totals, stock deducted, snapshots/history persisted', async () => {
      const before = await stock(peonyVariant.id);
      firstOrder = (await create(body(), firstKey)).payload.data;
      assert.equal(firstOrder.subtotal, peonyVariant.price);
      assert.equal(firstOrder.delivery_fee, 20000);
      assert.equal(firstOrder.grand_total, 470000);
      assert.equal(await stock(peonyVariant.id), before - 1);
      const persisted = await first('SELECT id, grand_total FROM orders WHERE order_number = ?', [firstOrder.order_number]);
      assert.equal(persisted.grand_total, firstOrder.grand_total);
      const items = await all('SELECT variant_id, unit_price, quantity, line_total FROM order_items WHERE order_id = ?', [persisted.id]);
      assert.deepEqual(items, [{ variant_id: peonyVariant.id, unit_price: peonyVariant.price, quantity: 1, line_total: peonyVariant.price }]);
      const history = await all('SELECT from_status, to_status, actor_label FROM order_status_history WHERE order_id = ?', [persisted.id]);
      assert.deepEqual(history, [{ from_status: null, to_status: 'PENDING', actor_label: 'CUSTOMER' }]);
    });

    await check('Phase 3 02/10 same idempotency key replays once without order/stock writes', async () => {
      assert.ok(firstOrder);
      const beforeOrders = await orderCount();
      const beforeStock = await stock(peonyVariant.id);
      const replay = await create(body(), firstKey, 200);
      assert.equal(replay.payload.data.replayed, true);
      const { replayed, ...summary } = replay.payload.data;
      assert.deepEqual(summary, firstOrder);
      assert.equal(replay.queryCount, 1);
      assert.equal(await orderCount(), beforeOrders);
      assert.equal(await stock(peonyVariant.id), beforeStock);
    });

    await check('Phase 3 03/10 parallel HTTP last-item purchase: exactly 201 + 409; no hanging order', async () => {
      const beforeOrders = await orderCount();
      assert.equal(await stock(scarceVariant.id), 1);
      const input = body({ items: [{ variant_id: scarceVariant.id, quantity: 1 }] });
      const attempts = await Promise.all([
        localJson('/api/orders', orderPost(input)), localJson('/api/orders', orderPost(input)),
      ]);
      assert.deepEqual(attempts.map(attempt => attempt.response.status).sort(), [201, 409]);
      const loser = attempts.find(attempt => attempt.response.status === 409);
      assert.equal(loser.payload.error.code, 'OUT_OF_STOCK');
      assert.deepEqual(loser.payload.error.details, [{ variant_id: scarceVariant.id, requested: 1, available: 0 }]);
      assert.equal(await stock(scarceVariant.id), 0);
      assert.equal(await orderCount(), beforeOrders + 1);
      const rows = await all(`SELECT oi.quantity, o.order_number FROM order_items oi
        JOIN orders o ON o.id = oi.order_id WHERE oi.variant_id = ?`, [scarceVariant.id]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].quantity, 1);
      assert.equal(rows[0].order_number, attempts.find(attempt => attempt.response.status === 201).payload.data.order_number);
      console.log(`D1 Phase 3 concurrency: HTTP statuses=201,409; last_stock=0; new_orders=1; loser_statements=${loser.queryCount}.`);
    });

    await check('Phase 3 04/10 forged client prices/totals/fees are ignored', async () => {
      const forged = (await create(body({
        items: [{ variant_id: peonyVariant.id, quantity: 1, price: 1, unit_price: 1, line_total: 1 }],
        price: 1, subtotal: 1, discount_total: 1, delivery_fee: 1, grand_total: 1, role: 'ADMIN',
      }))).payload.data;
      assert.equal(forged.subtotal, peonyVariant.price);
      assert.equal(forged.delivery_fee, 20000);
      assert.equal(forged.grand_total, 470000);
      const detail = await lookup(forged.order_number, '0911111111');
      assert.equal(detail.items[0].unit_price, peonyVariant.price);
      assert.equal(detail.items[0].line_total, peonyVariant.price);
    });

    await check('Phase 3 05/10 overstock rejection includes merged requested/available; DB unchanged', async () => {
      const variant = variants.find(item => item.sku === 'BPB-L');
      const beforeStock = await stock(variant.id);
      const beforeOrders = await orderCount();
      const requested = beforeStock + 1;
      const failure = await localError('/api/orders', orderPost(body({
        items: [{ variant_id: variant.id, quantity: 5 }, { variant_id: variant.id, quantity: requested - 5 }],
      })), 409, 'OUT_OF_STOCK');
      assert.deepEqual(failure.details, [{ variant_id: variant.id, requested, available: beforeStock }]);
      assert.equal(await stock(variant.id), beforeStock);
      assert.equal(await orderCount(), beforeOrders);
    });

    await check('Phase 3 06/10 unconfigured areas reject; configured ward fee/free threshold use DB', async () => {
      const beforeOrders = await orderCount();
      const beforeStock = await stock(peonyVariant.id);
      await localError('/api/orders', orderPost(body({
        recipient: { ...body().recipient, province_name: 'Tỉnh mẫu chưa giao' },
      })), 422, 'NO_DELIVERY_ZONE');
      assert.equal(await orderCount(), beforeOrders);
      assert.equal(await stock(peonyVariant.id), beforeStock);
      const ward = (await create()).payload.data;
      assert.equal(ward.delivery_fee, 20000);
      const wardFree = (await create(body({ items: [{ variant_id: peonyVariant.id, quantity: 2 }] }))).payload.data;
      assert.equal(wardFree.subtotal, 900000);
      assert.equal(wardFree.delivery_fee, 0);
      const countBeforeUnsupported = await orderCount();
      const stockBeforeUnsupported = await stock(peonyVariant.id);
      await localError('/api/orders', orderPost(body({
        items: [{ variant_id: peonyVariant.id, quantity: 3 }],
        recipient: { ...body().recipient, ward_name: 'Cửa Nam' },
      })), 422, 'NO_DELIVERY_ZONE');
      assert.equal(await orderCount(), countBeforeUnsupported);
      assert.equal(await stock(peonyVariant.id), stockBeforeUnsupported);
    });

    await check('Phase 3 07/10 SAME_DAY tomorrow and past delivery date reject without writes', async () => {
      const beforeOrders = await orderCount();
      const beforeStock = await stock(peonyVariant.id);
      for (const delivery of [
        { method_code: 'SAME_DAY', date: tomorrowDate, time_slot: '18:00-20:00' },
        { method_code: 'STANDARD', date: yesterday.toISOString().slice(0, 10), time_slot: '08:00-10:00' },
      ]) {
        await localError('/api/orders', orderPost(body({ delivery })), 422, 'INVALID_DELIVERY_SLOT');
      }
      assert.equal(await orderCount(), beforeOrders);
      assert.equal(await stock(peonyVariant.id), beforeStock);
    });

    await check('Phase 3 08/10 lookup accepts sender/recipient normalized phones; wrong code/phone share 404', async () => {
      assert.ok(firstOrder);
      await execute('UPDATE orders SET admin_note = ? WHERE order_number = ?', ['Internal synthetic note', firstOrder.order_number]);
      const sender = await lookup(firstOrder.order_number, '+84 900.000.000');
      const recipient = await lookup(firstOrder.order_number, '+84 911.111.111');
      assert.deepEqual(sender, recipient);
      assert.equal(sender.order_number, firstOrder.order_number);
      assert.equal(sender.sender.phone, '0900000000');
      assert.equal(sender.recipient.phone, '0911111111');
      assert.equal(sender.items.length, 1);
      assert.equal(sender.timeline.length, 1);
      assert.equal(sender.timeline[0].to_status, 'PENDING');
      assert.equal(Object.hasOwn(sender, 'admin_note'), false);
      assert.equal(Object.hasOwn(sender, 'stock_released'), false);
      const wrongPhone = await localError('/api/orders/lookup', post({ order_number: firstOrder.order_number, phone: '0999999999' }), 404, 'NOT_FOUND');
      const wrongCode = await localError('/api/orders/lookup', post({ order_number: 'LNR-261014-ABC234', phone: '0900000000' }), 404, 'NOT_FOUND');
      assert.deepEqual(wrongPhone, wrongCode);
    });

    await check('Phase 3 09/10 missing/malformed/non-v4 idempotency keys return 400 without writes', async () => {
      const beforeOrders = await orderCount();
      const beforeStock = await stock(peonyVariant.id);
      for (const key of [null, 'not-a-uuid', '00000000-0000-1000-8000-000000000000']) {
        await localError('/api/orders', orderPost(body(), key), 400, 'VALIDATION_ERROR');
      }
      assert.equal(await orderCount(), beforeOrders);
      assert.equal(await stock(peonyVariant.id), beforeStock);
    });

    await check('Phase 3 10/10 transition history + DELIVERED/PAID; cancellation releases stock once', async () => {
      assert.ok(firstOrder);
      for (const to of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']) {
        const result = await transitionOrder(db, firstOrder.order_number, to, 'ADMIN', 'Local smoke transition');
        assert.equal(result.status_code, to);
      }
      const delivered = await lookup(firstOrder.order_number, '0900000000');
      assert.equal(delivered.status_code, 'DELIVERED');
      assert.equal(delivered.payment_status, 'PAID');
      assert.match(delivered.paid_at, /Z$/);
      assert.match(delivered.delivered_at, /Z$/);
      assert.deepEqual(delivered.timeline.map(event => event.to_status), ['PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']);
      assert.deepEqual(delivered.timeline.map(event => event.from_status), [null, 'PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT']);
      const cancellable = (await create(body({ items: [{ variant_id: peonyVariant.id, quantity: 2 }] }))).payload.data;
      const beforeCancel = await stock(peonyVariant.id);
      const cancelled = await transitionOrder(db, cancellable.order_number, 'CANCELLED', 'ADMIN', 'Local smoke cancellation');
      assert.equal(cancelled.status_code, 'CANCELLED');
      assert.equal(await stock(peonyVariant.id), beforeCancel + 2);
      assert.equal((await first('SELECT stock_released FROM orders WHERE order_number = ?', [cancellable.order_number])).stock_released, 1);
      await assert.rejects(() => transitionOrder(db, cancellable.order_number, 'CANCELLED', 'ADMIN'), cause => cause.code === 'INVALID_TRANSITION');
      assert.equal(await stock(peonyVariant.id), beforeCancel + 2);
      const detail = await lookup(cancellable.order_number, '0911111111');
      assert.deepEqual(detail.timeline.map(event => event.to_status), ['PENDING', 'CANCELLED']);
      console.log('D1 Phase 3 transitions: history=PENDING,CONFIRMED,PREPARING,IN_TRANSIT,DELIVERED; payment=PAID; cancellation=+2 once; repeat=INVALID_TRANSITION/+0.');
    });
    console.log(`Phase 3 mandatory smoke: ${passed - beforePassed}/10 PASS, ${failed - beforeFailed} FAIL.`);

    await check('Phase 3 acceptance: 15-line query budget and full stock/order reconciliation', async () => {
      const fifteen = variants.slice(0, 15).map(variant => ({ variant_id: variant.id, quantity: 1 }));
      const result = await create(body({ items: fifteen }));
      assert.ok(result.queryCount <= 40);
      const lines = await lookup(result.payload.data.order_number, '0911111111');
      assert.equal(lines.items.length, 15);
      const current = await all('SELECT id, stock_quantity FROM product_variants ORDER BY id');
      const sold = await all(`SELECT oi.variant_id, SUM(oi.quantity) AS quantity
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.status_code != ? GROUP BY oi.variant_id`, ['CANCELLED']);
      const soldByVariant = new Map(sold.map(line => [line.variant_id, line.quantity]));
      for (const variant of current) {
        assert.equal(initialStock.get(variant.id) - variant.stock_quantity, soldByVariant.get(variant.id) || 0,
          `Stock/order mismatch for variant ${variant.id}`);
      }
      assert.deepEqual(await all('PRAGMA foreign_key_check'), []);
      assert.equal((await first(`SELECT COUNT(*) AS total FROM orders o
        WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id)
          OR NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id)`)).total, 0);
      const created = requestCounts.filter(attempt => attempt.route === '/api/orders');
      assert.ok(created.every(attempt => attempt.queries <= 40));
      console.log(`D1 Phase 3 query budget: cart_lines=15; submitted_statements=${result.queryCount}; limit=40; maximum_all_order_requests=${Math.max(...created.map(attempt => attempt.queries))}.`);
      console.log(`D1 Phase 3 reconciliation: variants=${current.length}; every stock reduction=uncancelled order_items quantity; dangling_orders=0; foreign_key_check=[]; orders=${await orderCount()}.`);
    });

    const adminBeforePassed = passed;
    const adminBeforeFailed = failed;
    let adminCookie;
    const adminInit = (method = 'GET', input, cookie = adminCookie) => ({
      method, headers: {
        ...(cookie ? { cookie } : {}),
        ...(['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
          ? { origin: isolatedUrl.origin, 'content-type': 'application/json' } : {}),
      }, ...(input !== undefined ? { body: JSON.stringify(input) } : {}),
    });
    const admin = (route, method = 'GET', input, status = 200) => localJson(`/api/admin${route}`, adminInit(method, input), status);
    const adminDetail = async number => (await admin(`/orders/${number}`)).payload.data;
    const statusPatch = (number, to_status, note = 'Isolated admin smoke transition') =>
      adminInit('PATCH', { to_status, note });
    const signedTestCookie = claims => {
      const unsigned = [
        Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
        Buffer.from(JSON.stringify(claims)).toString('base64url'),
      ].join('.');
      return `lunara_admin=${unsigned}.${createHmac('sha256', demoJwtSecret).update(unsigned).digest('base64url')}`;
    };

    await check('Phase 4 01/12 wrong/right login, fail-closed secrets, strict HTTP/HTTPS cookies', async () => {
      await localError('/api/admin/login', adminInit('POST', { password: 'wrong-synthetic-password' }, null), 401, 'INVALID_CREDENTIALS');
      for (const credentials of [
        {}, { ADMIN_PASSWORD: demoPassword }, { JWT_SECRET: demoJwtSecret },
        { ADMIN_PASSWORD: '', JWT_SECRET: demoJwtSecret },
        { ADMIN_PASSWORD: demoPassword, JWT_SECRET: '' },
        { ADMIN_PASSWORD: 'short', JWT_SECRET: demoJwtSecret },
        { ADMIN_PASSWORD: demoPassword, JWT_SECRET: 'short' },
        { ADMIN_PASSWORD: demoPassword, JWT_SECRET: demoPassword },
      ]) {
        const response = await app.fetch(new Request(new URL('/api/admin/login', isolatedUrl), {
          ...adminInit('POST', { password: demoPassword }, null),
        }), { DB: db, ...credentials, TURNSTILE_ALLOW_LOCAL_BYPASS: 'true' });
        assert.equal(response.status, 401, 'Missing/empty secrets must reject login');
        assert.equal(response.headers.has('set-cookie'), false);
        safeApiData(await response.json());
      }
      const login = await localJson('/api/admin/login', adminInit('POST', { password: demoPassword }, null), 200);
      assert.deepEqual(login.payload, { data: { ok: true } });
      assert.equal(login.queryCount, 0);
      const setCookie = login.response.headers.get('set-cookie');
      assert.match(setCookie, /^lunara_admin=/);
      assert.match(setCookie, /; HttpOnly(?:;|$)/i);
      assert.match(setCookie, /; SameSite=Strict(?:;|$)/i);
      assert.match(setCookie, /; Path=\/(?:;|$)/i);
      assert.match(setCookie, /; Max-Age=43200(?:;|$)/i);
      assert.doesNotMatch(setCookie, /; Secure(?:;|$)/i);
      adminCookie = setCookie.split(';', 1)[0];
      assert.deepEqual((await admin('/me')).payload, { data: { role: 'ADMIN' } });
      const httpsOrigin = 'https://127.0.0.1';
      const secureResponse = await app.fetch(new Request(`${httpsOrigin}/api/admin/login`, {
        method: 'POST', headers: { origin: httpsOrigin, 'content-type': 'application/json' },
        body: JSON.stringify({ password: demoPassword }),
      }), { DB: db, ...authEnv });
      assert.equal(secureResponse.status, 200);
      assert.match(secureResponse.headers.get('set-cookie'), /; Secure(?:;|$)/i);
      safeApiData(await secureResponse.json());
      console.log('D1 Phase 4 auth: wrong=INVALID_CREDENTIALS; missing/empty secrets=401; cookie=HttpOnly/SameSite=Strict/Path=/; HTTP=no Secure; HTTPS=Secure; login_queries=0.');
    });

    await check('Phase 4 02/12 every admin route without cookie returns 401 before validation', async () => {
      assert.ok(firstOrder);
      for (const [method, route] of [
        ['POST', '/logout'], ['GET', '/me'], ['GET', '/summary'], ['GET', '/orders'],
        ['GET', `/orders/${firstOrder.order_number}`], ['PATCH', `/orders/${firstOrder.order_number}/status`],
        ['PATCH', `/orders/${firstOrder.order_number}/note`], ['GET', '/products'], ['POST', '/products'],
        ['PATCH', '/products/1'], ['PATCH', `/variants/${peonyVariant.id}`],
        ['GET', '/delivery-zones'], ['POST', '/delivery-zones'], ['PUT', '/delivery-zones/1'],
        ['GET', '/unknown'], ['DELETE', '/unknown'],
      ]) {
        await localError(`/api/admin${route}`, adminInit(method, method === 'GET' ? undefined : {}, null), 401, 'UNAUTHORIZED');
      }
    });

    await check('Phase 4 03/12 expired/tampered/wrong-role JWT rejected', async () => {
      assert.ok(adminCookie);
      const now = Math.floor(Date.now() / 1000);
      const [header, payload] = adminCookie.slice('lunara_admin='.length).split('.');
      for (const cookie of [
        signedTestCookie({ role: 'ADMIN', iat: now - 60, exp: now - 1 }),
        `lunara_admin=${header}.${payload}.${Buffer.alloc(32).toString('base64url')}`,
        signedTestCookie({ role: 'CUSTOMER', iat: now, exp: now + 60 }),
        'lunara_admin=not.a.valid-session',
      ]) {
        await localError('/api/admin/me', adminInit('GET', undefined, cookie), 401, 'UNAUTHORIZED');
      }
    });

    await check('Phase 4 04/12 admin writes require exact Origin and JSON Content-Type', async () => {
      assert.ok(adminCookie);
      for (const route of ['/api/admin/login', `/api/admin/variants/${peonyVariant.id}`]) {
        const method = route.endsWith('/login') ? 'POST' : 'PATCH';
        const input = method === 'POST' ? { password: demoPassword } : { stock_delta: 1 };
        const initial = adminInit(method, input);
        for (const origin of [undefined, 'https://attacker.example.test', 'null', `${isolatedUrl.origin}/path`, isolatedUrl.origin.replace('http:', 'https:')]) {
          const headers = { ...initial.headers };
          if (origin === undefined) delete headers.origin;
          else headers.origin = origin;
          await localError(route, { ...initial, headers }, 403, 'FORBIDDEN');
        }
        for (const contentType of [undefined, 'text/plain', 'application/jsonp']) {
          const headers = { ...initial.headers };
          if (contentType === undefined) delete headers['content-type'];
          else headers['content-type'] = contentType;
          await localError(route, { ...initial, headers }, 400, 'VALIDATION_ERROR');
        }
      }
    });

    await check('Phase 4 05/12 summary <=3 queries, filtered/paged orders and privileged detail', async () => {
      // A UTC timestamp on yesterday's calendar date can already be today in VN.
      // This boundary distinguishes the required VN day from naive UTC grouping.
      const vietnamDayStart = new Date(`${todayInVN()}T00:00:00+07:00`).getTime();
      await execute('UPDATE orders SET placed_at = ? WHERE order_number = ?', [
        new Date(vietnamDayStart + 30 * 60_000).toISOString(), firstOrder.order_number,
      ]);
      const summary = await admin('/summary');
      assert.ok(summary.queryCount <= 3, `Summary used ${summary.queryCount} statements`);
      const expectedStatus = Object.fromEntries((await all('SELECT status_code, COUNT(*) AS total FROM orders GROUP BY status_code'))
        .map(row => [row.status_code, row.total]));
      for (const [status, count] of Object.entries(summary.payload.data.orders_by_status)) {
        assert.equal(count, expectedStatus[status] || 0);
      }
      for (const [status, count] of Object.entries(expectedStatus)) assert.equal(summary.payload.data.orders_by_status[status], count);
      assert.equal(summary.payload.data.today_orders, (await first("SELECT COUNT(*) AS total FROM orders WHERE substr(datetime(placed_at, '+7 hours'), 1, 10) = ?", [todayInVN()])).total);
      assert.equal(summary.payload.data.low_stock_count, (await first('SELECT COUNT(*) AS total FROM product_variants v JOIN products p ON p.id=v.product_id JOIN categories c ON c.id=p.category_id WHERE v.stock_quantity <= v.low_stock_threshold AND v.is_active=1 AND p.status="ACTIVE" AND c.is_active=1')).total);
      const listed = (await admin('/orders?status=PENDING&date=' + tomorrowDate + '&limit=2&offset=0')).payload.data;
      const pending = (await first('SELECT COUNT(*) AS total FROM orders WHERE status_code = ? AND delivery_date = ?', ['PENDING', tomorrowDate])).total;
      assert.equal(listed.total, pending);
      assert.equal(listed.items.length, Math.min(2, pending));
      assert.ok(listed.items.every(order => order.status_code === 'PENDING'));
      const secondPage = (await admin('/orders?status=PENDING&date=' + tomorrowDate + '&limit=2&offset=2')).payload.data;
      assert.equal(secondPage.total, pending);
      assert.equal(secondPage.items.some(row => listed.items.some(other => other.order_number === row.order_number)), false);
      const detail = await adminDetail(firstOrder.order_number);
      assert.equal(detail.admin_note, 'Internal synthetic note');
      assert.ok(Object.hasOwn(detail, 'stock_released'));
      assert.equal(detail.items.length, 1);
      assert.equal(detail.timeline.length, 5);
      assert.equal(Object.hasOwn(await lookup(firstOrder.order_number, '0900000000'), 'admin_note'), false);
      for (const query of ['limit=51', 'offset=-1', 'status=UNKNOWN', 'date=2026-02-30']) {
        await localError(`/api/admin/orders?${query}`, adminInit(), 400, 'VALIDATION_ERROR');
      }
      console.log(`D1 Phase 4 summary: submitted_statements=${summary.queryCount}; limit=3; orders_total=${await orderCount()}.`);
    });

    await check('Phase 4 06/12 status API rejects invalid transitions, DELIVERED sets PAID/timestamps/history', async () => {
      const number = (await create()).payload.data.order_number;
      await localError(`/api/admin/orders/${number}/status`, statusPatch(number, 'DELIVERED'), 409, 'INVALID_TRANSITION');
      assert.equal((await adminDetail(number)).status_code, 'PENDING');
      for (const to of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']) {
        await localJson(`/api/admin/orders/${number}/status`, statusPatch(number, to), 200);
        assert.equal((await adminDetail(number)).status_code, to);
      }
      const delivered = await adminDetail(number);
      assert.equal(delivered.payment_status, 'PAID');
      assert.match(delivered.paid_at, /Z$/);
      assert.match(delivered.delivered_at, /Z$/);
      assert.deepEqual(delivered.timeline.map(event => event.to_status), ['PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']);
      await localError(`/api/admin/orders/${number}/status`, statusPatch(number, 'CANCELLED'), 409, 'INVALID_TRANSITION');
      const actors = await all(`SELECT h.actor_id, h.actor_label FROM order_status_history h
        JOIN orders o ON o.id = h.order_id WHERE o.order_number = ? AND h.from_status IS NOT NULL`, [number]);
      assert.ok(actors.length === 4 && actors.every(row => row.actor_id === null && row.actor_label === 'ADMIN'));
      console.log('D1 Phase 4 transitions: invalid PENDING→DELIVERED=409; PENDING,CONFIRMED,PREPARING,IN_TRANSIT,DELIVERED; payment=PAID; paid_at/delivered_at=UTC; actor=ADMIN/NULL.');
    });

    await check('Phase 4 07/12 cancellation API returns stock once for repeat and concurrent requests', async () => {
      const number = (await create(body({ items: [{ variant_id: peonyVariant.id, quantity: 2 }] }))).payload.data.order_number;
      const beforeCancel = await stock(peonyVariant.id);
      await localJson(`/api/admin/orders/${number}/status`, statusPatch(number, 'CANCELLED'), 200);
      assert.equal(await stock(peonyVariant.id), beforeCancel + 2);
      await localError(`/api/admin/orders/${number}/status`, statusPatch(number, 'CANCELLED'), 409, 'INVALID_TRANSITION');
      assert.equal(await stock(peonyVariant.id), beforeCancel + 2);
      assert.equal(Number((await adminDetail(number)).stock_released), 1);
      const racingNumber = (await create(body({ items: [{ variant_id: peonyVariant.id, quantity: 2 }] }))).payload.data.order_number;
      const beforeRace = await stock(peonyVariant.id);
      const attempts = await Promise.all([
        localJson(`/api/admin/orders/${racingNumber}/status`, statusPatch(racingNumber, 'CANCELLED')),
        localJson(`/api/admin/orders/${racingNumber}/status`, statusPatch(racingNumber, 'CANCELLED')),
      ]);
      assert.deepEqual(attempts.map(result => result.response.status).sort(), [200, 409]);
      assert.equal(attempts.find(result => result.response.status === 409).payload.error.code, 'INVALID_TRANSITION');
      assert.equal(await stock(peonyVariant.id), beforeRace + 2);
      const detail = await adminDetail(racingNumber);
      assert.deepEqual(detail.timeline.map(event => event.to_status), ['PENDING', 'CANCELLED']);
      assert.equal(Number(detail.stock_released), 1);
      for (const from of ['CONFIRMED', 'PREPARING']) {
        const pending = (await create()).payload.data.order_number;
        await localJson(`/api/admin/orders/${pending}/status`, statusPatch(pending, 'CONFIRMED'), 200);
        if (from === 'PREPARING') await localJson(`/api/admin/orders/${pending}/status`, statusPatch(pending, 'PREPARING'), 200);
        const beforeAllowedCancel = await stock(peonyVariant.id);
        await localJson(`/api/admin/orders/${pending}/status`, statusPatch(pending, 'CANCELLED'), 200);
        assert.equal(await stock(peonyVariant.id), beforeAllowedCancel + 1);
      }
      console.log('D1 Phase 4 cancellation: sequential=200,409/+2 once; parallel=200,409/+2 once; stock_released=1; cancellation_history_rows=1.');
    });

    await check('Phase 4 08/12 admin note stays private; q escapes percent/underscore/backslash', async () => {
      await admin(`/orders/${firstOrder.order_number}/note`, 'PATCH', { admin_note: 'Isolated private admin note' });
      assert.equal((await adminDetail(firstOrder.order_number)).admin_note, 'Isolated private admin note');
      const publicDetail = await lookup(firstOrder.order_number, '0900000000');
      assert.equal(JSON.stringify(publicDetail).includes('Isolated private admin note'), false);
      const literalName = 'Synthetic %_\\ literal search';
      const searchable = (await create(body({ sender: { ...body().sender, name: literalName } }))).payload.data;
      const literal = (await admin('/orders?q=' + encodeURIComponent('%_\\'))).payload.data;
      assert.equal(literal.total, 1);
      assert.deepEqual(literal.items.map(row => row.order_number), [searchable.order_number]);
      assert.equal(Object.values(literal.counts_by_status).reduce((sum, count) => sum + count, 0), literal.total);
      const phone = (await admin('/orders?q=0900000000&limit=50')).payload.data;
      assert.ok(phone.total > 0);
      const empty = (await admin('/orders?q=' + encodeURIComponent("' OR 1=1 --"))).payload.data;
      assert.deepEqual(empty, { items: [], total: 0, counts_by_status: Object.fromEntries(ORDER_STATUSES.map(status => [status, 0])) });
      await admin(`/orders/${firstOrder.order_number}/note`, 'PATCH', { admin_note: null });
      assert.equal((await adminDetail(firstOrder.order_number)).admin_note, null);
    });

    await check('Phase 4 09/12 atomic stock_delta survives concurrent new order; negative/compare-price checks', async () => {
      const id = peonyVariant.id;
      const before = await stock(id);
      await admin(`/variants/${id}`, 'PATCH', { stock_delta: 5 });
      assert.equal(await stock(id), before + 5);
      await admin(`/variants/${id}`, 'PATCH', { stock_delta: -2, stock_quantity: 999999 });
      assert.equal(await stock(id), before + 3, 'stock_delta must take priority over absolute stock_quantity');
      await localError(`/api/admin/variants/${id}`, adminInit('PATCH', { stock_delta: -(before + 4) }), 400, 'VALIDATION_ERROR');
      assert.equal(await stock(id), before + 3);
      const raceBefore = await stock(id);
      await Promise.all([admin(`/variants/${id}`, 'PATCH', { stock_delta: 4 }), create()]);
      assert.equal(await stock(id), raceBefore + 3, 'Concurrent order deduction must survive delta adjustment');
      const variant = await first('SELECT price, compare_at_price FROM product_variants WHERE id = ?', [id]);
      await localError(`/api/admin/variants/${id}`, adminInit('PATCH', { compare_at_price: variant.price - 1 }), 400, 'VALIDATION_ERROR');
      assert.deepEqual(await first('SELECT price, compare_at_price FROM product_variants WHERE id = ?', [id]), variant);
      await admin(`/variants/${id}`, 'PATCH', { stock_quantity: await stock(id) });
      console.log('D1 Phase 4 stock: delta +5/-2 exact; delta beats absolute; below-zero=400/unchanged; concurrent(delta +4,order -1)=+3; compare_at_price<price=400.');
    });

    await check('Phase 4 10/12 product batch create/conflict, public ACTIVE, hidden/archive remain admin', async () => {
      const catalog = await admin('/products');
      assert.ok(catalog.queryCount <= 3, 'Admin product list must use at most 3 queries');
      assert.equal(catalog.payload.data.items.length, 8);
      assert.equal(catalog.payload.data.items.flatMap(product => product.variants).every(variant => Number.isInteger(variant.stock_quantity)), true);
      const input = {
        category_id: categories[0].id, slug: 'isolated-admin-smoke-product',
        name_vi: 'Sản phẩm thử local', name_en: 'Isolated admin smoke product', status: 'ACTIVE',
        image: { url: 'https://res.cloudinary.com/demo/image/upload/smoke.jpg', alt_vi: 'Hoa thử', alt_en: 'Test flowers' },
        variants: [{ sku: 'ISOLATED-SMOKE-STANDARD', size_code: 'STANDARD', price: 100000, compare_at_price: 120000, stock_quantity: 12, low_stock_threshold: 2, is_active: true }],
      };
      const created = await admin('/products', 'POST', input, 201);
      const id = created.payload.data.id;
      assert.ok(Number.isInteger(id));
      assert.equal(created.queryCount, 3, 'One product + one variant + one image must be one 3-statement batch');
      const active = (await localJson('/api/products', undefined, 200)).payload.data.items;
      assert.ok(active.some(product => product.id === id));
      const beforeConflict = (await first('SELECT COUNT(*) AS total FROM products')).total;
      await localError('/api/admin/products', adminInit('POST', input), 409, 'CONFLICT');
      await localError('/api/admin/products', adminInit('POST', { ...input, slug: 'isolated-conflicting-sku' }), 409, 'CONFLICT');
      assert.equal((await first('SELECT COUNT(*) AS total FROM products')).total, beforeConflict, 'SKU conflict must roll back inserted product');
      for (const status of ['HIDDEN', 'ARCHIVED']) {
        await admin(`/products/${id}`, 'PATCH', {
          status, name_en: 'Patched isolated product', image: { url: 'https://res.cloudinary.com/demo/image/upload/patched.jpg' },
        });
        const publicItems = (await localJson('/api/products', undefined, 200)).payload.data.items;
        assert.equal(publicItems.some(product => product.id === id), false);
        await localError(`/api/products/${input.slug}`, {}, 404, 'NOT_FOUND');
        const record = (await admin('/products')).payload.data.items.find(product => product.id === id);
        assert.equal(record.status, status);
        assert.equal(record.name_en, 'Patched isolated product');
        assert.equal(record.images.filter(image => image.is_primary).length, 1);
        assert.equal(record.images.find(image => image.is_primary).url, 'https://res.cloudinary.com/demo/image/upload/patched.jpg');
        if (status === 'ARCHIVED') assert.match((await first('SELECT archived_at FROM products WHERE id = ?', [id])).archived_at, /Z$/);
      }
      console.log('D1 Phase 4 products: list_statements<=3; create_batch=3; slug/SKU=CONFLICT/rollback; ACTIVE visible; HIDDEN/ARCHIVED public absent/admin retained.');
    });

    await check('Phase 4 11/12 zone create/fee edit changes quote immediately; soft delete removes delivery', async () => {
      const zones = (await admin('/delivery-zones')).payload.data.items;
      const existing = zones.find(zone => zone.province_name === 'Thành phố Hà Nội' && zone.ward_name === 'Phường Hoàn Kiếm');
      assert.ok(existing);
      const localQuote = async input => (await localJson('/api/checkout/quote', post(input), 200)).payload.data;
      const input = {
        items: [{ variant_id: peonyVariant.id, quantity: 1 }],
        province_name: existing.province_name, ward_name: existing.ward_name, delivery_method_code: 'STANDARD',
      };
      assert.equal((await localQuote(input)).delivery_fee, 20000);
      await admin(`/delivery-zones/${existing.id}`, 'PUT', {
        province_name: existing.province_name, ward_name: existing.ward_name, fee: 23000,
        free_from_amount: null, eta_minutes: existing.eta_minutes, is_active: true,
      });
      assert.equal((await localQuote(input)).delivery_fee, 23000);
      const newZone = {
        province_name: 'Thành phố Hà Nội', ward_name: 'Cửa Nam', fee: 17000,
        free_from_amount: null, eta_minutes: 120, is_active: true,
      };
      const created = (await admin('/delivery-zones', 'POST', newZone, 201)).payload.data;
        const newQuote = { ...input, province_name: newZone.province_name, ward_name: newZone.ward_name };
      assert.equal((await localQuote(newQuote)).delivery_fee, 17000);
      await localError('/api/admin/delivery-zones', adminInit('POST', newZone), 409, 'CONFLICT');
      await admin(`/delivery-zones/${created.id}`, 'PUT', { ...newZone, is_active: false });
      await localError('/api/checkout/quote', post(newQuote), 422, 'NO_DELIVERY_ZONE');
      assert.equal((await admin('/delivery-zones')).payload.data.items.some(zone => zone.id === created.id && !zone.is_active), true);
      console.log('D1 Phase 4 delivery: admin fee 20000→23000; next quote=23000; create catalog ward zone=17000; inactive quote=NO_DELIVERY_ZONE; row retained.');
    });

    await check('Phase 4 12/12 logout expires cookie; private bodies contain no credentials/JWT; D1 intact', async () => {
      const result = await admin('/logout', 'POST', {});
      assert.deepEqual(result.payload, { data: { ok: true } });
      assert.match(result.response.headers.get('set-cookie'), /^lunara_admin=;/);
      assert.match(result.response.headers.get('set-cookie'), /; Max-Age=0(?:;|$)/i);
      await localError('/api/admin/me', adminInit('GET', undefined, null), 401, 'UNAUTHORIZED');
      assert.deepEqual(await all('PRAGMA foreign_key_check'), []);
      assert.equal((await first('SELECT COUNT(*) AS total FROM product_variants WHERE stock_quantity < 0')).total, 0);
      console.log('D1 Phase 4 privacy: every parsed public/admin JSON body checked for credentials/JWT/secret/SQL/stack; JWT only in intended HttpOnly Set-Cookie header; foreign_key_check=[]; negative_stock=0.');
    });
    console.log(`Phase 4 mandatory smoke: ${passed - adminBeforePassed}/12 PASS, ${failed - adminBeforeFailed} FAIL.`);
  } finally {
    if (server) await new Promise((resolve, reject) => server.close(cause => cause ? reject(cause) : resolve()));
    await platform.dispose();
  }
}

try {
  await orderSmoke();
} catch (cause) {
  failed++;
  console.error(`FAIL Phase 3/4 isolated smoke setup: ${cause.stack || cause.message}`);
}
await check('persisted preview catalog/categories/delivery seed unchanged after isolated Phase 3/4 writes', async () => {
  assert.deepEqual((await json('/api/products')).payload.data.items, products);
  assert.deepEqual((await json('/api/categories')).payload.data, categories);
  assert.deepEqual((await json('/api/delivery/options')).payload.data, deliveryOptions);
});
console.log(`Local smoke: ${passed}/${passed + failed} PASS, ${failed} FAIL; persisted seed untouched.`);
if (failed) process.exitCode = 1;
