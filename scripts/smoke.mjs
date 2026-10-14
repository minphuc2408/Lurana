import assert from 'node:assert/strict';

const baseUrl = new URL(process.argv[2] || 'http://127.0.0.1:5173');
if (baseUrl.hostname !== '127.0.0.1' || !['http:', 'https:'].includes(baseUrl.protocol)) {
  throw new Error('Smoke checks require a local server on 127.0.0.1.');
}

const request = (route, options = {}) => fetch(new URL(route, baseUrl), {
  ...options, redirect: 'error', signal: AbortSignal.timeout(10_000),
});
const navigationHeaders = { accept: 'text/html', 'sec-fetch-mode': 'navigate' };
const forbiddenKeys = new Set(['stock_quantity', 'archived_at', 'cloudinary_public_id', 'password_hash', 'stack', 'stack_trace', 'sql']);
let passed = 0;
let failed = 0;
let products;
let categories;

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

console.log(`D1 LOCAL ONLY smoke at ${baseUrl.origin}; requests do not create orders or mutate persisted data.`);

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
    const response = await request(route, { headers: navigationHeaders });
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
    assert.deepEqual(Object.keys(category).sort(), ['code', 'id', 'name_en', 'name_vi', 'slug']);
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
  const provinces = [...options.provinces].sort((a, b) => a.province_name.localeCompare(b.province_name));
  assert.deepEqual(provinces, [
    { province_name: 'Thành phố Hà Nội', default_fee: 35000, free_from_amount: 1000000, wards: [{ ward_name: 'Phường Hoàn Kiếm', fee: 20000 }] },
    { province_name: 'Thành phố Hồ Chí Minh', default_fee: 35000, free_from_amount: 1000000, wards: [{ ward_name: 'Phường Bến Nghé', fee: 20000 }] },
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

await check('quote unknown ward falls back to province default; unknown province is 422', async () => {
  const data = await quote(quoteBody({ ward_name: 'Phường mẫu không có dòng riêng' }));
  assert.equal(data.delivery_fee, 35000);
  assert.equal(data.grand_total, 485000);
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

await check('deferred orders/admin return JSON 404 and no-store', async () => {
  await error('/api/orders', 404, 'NOT_FOUND', post({}));
  await error('/api/admin/products', 404, 'NOT_FOUND');
});

console.log(`Phase 2 smoke: ${passed}/${passed + failed} PASS, ${failed} FAIL at ${baseUrl.origin}.`);
if (failed) process.exitCode = 1;
