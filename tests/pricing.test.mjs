import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFee, getDeliveryOptions } from '../worker/services/delivery.ts';
import { priceCart } from '../worker/services/pricing.ts';
import { createTestDb } from './helpers/worker.mjs';

const province = 'Thành phố Hà Nội';
const ward = 'Phường Hoàn Kiếm';

function fixture(t) {
  const harness = createTestDb();
  t.after(() => harness.close());
  return harness;
}

function variant(harness, sku = 'BPB-S') {
  return { ...harness.sqlite.prepare('SELECT * FROM product_variants WHERE sku = ?').get(sku) };
}

function quote(harness, items, method = 'STANDARD', location = province, district = ward) {
  return priceCart(harness.db, items, location, district, method);
}

function rejectsCode(action, code, status) {
  return assert.rejects(action, error => error.code === code && error.status === status);
}

test('delivery chooses exact active ward before province default and binds the address', async t => {
  const h = fixture(t);
  assert.equal(await resolveFee(h.db, province, ward, 450000, 'STANDARD'), 20000);
  assert.equal(h.queryCount, 1);
  assert.deepEqual(h.queries[0].values, [province, ward, ward]);
  assert.equal(await resolveFee(h.db, province, 'Phường mới', 450000, 'STANDARD'), 35000);
  const hostileWard = "' OR 1=1 --";
  assert.equal(await resolveFee(h.db, province, hostileWard, 450000, 'STANDARD'), 35000);
  assert.ok(h.queries.every(({ sql }) => !sql.includes(hostileWard)));
});

test('delivery free threshold waives base fee only, including at the exact threshold', async t => {
  const h = fixture(t);
  assert.equal(await resolveFee(h.db, province, ward, 799999, 'EXPRESS'), 50000);
  assert.equal(await resolveFee(h.db, province, ward, 800000, 'EXPRESS'), 30000);
  assert.equal(await resolveFee(h.db, province, ward, 800001, 'SAME_DAY'), 50000);
  assert.equal(await resolveFee(h.db, province, 'Phường mới', 999999, 'STANDARD'), 35000);
  assert.equal(await resolveFee(h.db, province, 'Phường mới', 1000000, 'STANDARD'), 0);
  h.exec("UPDATE delivery_zones SET free_from_amount = NULL WHERE ward_name <> ''");
  assert.equal(await resolveFee(h.db, province, ward, 9000000, 'STANDARD'), 20000);
  h.exec("UPDATE delivery_zones SET free_from_amount = 0 WHERE ward_name <> ''");
  assert.equal(await resolveFee(h.db, province, ward, 0, 'EXPRESS'), 30000);
});

test('inactive delivery rows are ignored and unsupported province throws NO_DELIVERY_ZONE', async t => {
  const h = fixture(t);
  h.exec("UPDATE delivery_zones SET is_active = 0 WHERE ward_name <> ''");
  assert.equal(await resolveFee(h.db, province, ward, 450000, 'STANDARD'), 35000);
  await rejectsCode(() => resolveFee(h.db, 'Tỉnh chưa giao', ward, 450000, 'STANDARD'), 'NO_DELIVERY_ZONE', 422);
  h.exec('UPDATE delivery_zones SET is_active = 0');
  await rejectsCode(() => resolveFee(h.db, province, ward, 450000, 'STANDARD'), 'NO_DELIVERY_ZONE', 422);
});

test('delivery service validates arguments before touching D1', async t => {
  const h = fixture(t);
  for (const subtotal of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    await rejectsCode(() => resolveFee(h.db, province, ward, subtotal, 'STANDARD'), 'VALIDATION_ERROR', 400);
  }
  await rejectsCode(() => resolveFee(h.db, province, ward, 450000, 'UNKNOWN'), 'VALIDATION_ERROR', 400);
  await rejectsCode(() => resolveFee(h.db, '', ward, 450000, 'STANDARD'), 'VALIDATION_ERROR', 400);
  assert.equal(h.queryCount, 0);
});

test('delivery options group active DB zones, preserve a missing default and expose configured limits', async t => {
  const h = fixture(t);
  h.sqlite.prepare('INSERT INTO delivery_zones (province_name, ward_name, fee) VALUES (?, ?, ?)')
    .run('Tỉnh thử nghiệm', 'Phường A', 12000);
  h.exec("UPDATE delivery_zones SET is_active = 0 WHERE province_name = 'Thành phố Hồ Chí Minh' AND ward_name <> ''");
  const options = await getDeliveryOptions(h.db);
  assert.equal(h.queryCount, 1);
  const hanoi = options.provinces.find(value => value.province_name === province);
  assert.deepEqual(hanoi, {
    province_name: province, default_fee: 35000, free_from_amount: 1000000,
    wards: [{ ward_name: ward, fee: 20000 }],
  });
  assert.deepEqual(options.provinces.find(value => value.province_name === 'Tỉnh thử nghiệm'), {
    province_name: 'Tỉnh thử nghiệm', default_fee: null, free_from_amount: null,
    wards: [{ ward_name: 'Phường A', fee: 12000 }],
  });
  assert.deepEqual(options.provinces.find(value => value.province_name === 'Thành phố Hồ Chí Minh').wards, []);
  assert.deepEqual(options.methods, [
    { code: 'STANDARD', surcharge: 0 }, { code: 'EXPRESS', surcharge: 30000 }, { code: 'SAME_DAY', surcharge: 50000 },
  ]);
  assert.deepEqual(options.limits, { max_cart_lines: 15, max_quantity_per_line: 20, max_advance_days: 30 });
  assert.ok(options.time_slots.length > 0);
  assert.ok(options.time_slots.every(value => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value)));
});

test('pricing uses current DB price, strips client money and reads all variants in one IN query', async t => {
  const h = fixture(t);
  const small = variant(h);
  const medium = variant(h, 'PRB-M');
  h.sqlite.prepare('UPDATE product_variants SET price = ? WHERE id = ?').run(451000, small.id);
  const items = [{ variant_id: small.id, quantity: 1, price: 1, unit_price: 1, total: 1 },
    { variant_id: medium.id, quantity: 1, price: 1 }];
  const result = await quote(h, items, 'EXPRESS');
  assert.deepEqual(result.lines.map(line => [line.variant_id, line.unit_price, line.line_total]), [
    [small.id, 451000, 451000], [medium.id, 520000, 520000],
  ]);
  assert.equal(result.subtotal, 971000);
  assert.equal(result.discount_total, 0);
  assert.equal(result.delivery_fee, 30000);
  assert.equal(result.grand_total, 1001000);
  assert.deepEqual(result.issues, []);
  assert.equal(h.queryCount, 2, 'one variant query plus one delivery query');
  const reads = h.queries.filter(({ sql }) => sql.includes('FROM product_variants'));
  assert.equal(reads.length, 1);
  assert.match(reads[0].sql, /v\.id IN \(\?,\?\)/);
  assert.deepEqual(reads[0].values, [small.id, medium.id]);
  assert.equal(items[0].price, 1, 'input was not mutated');
});

test('duplicate variants merge before pricing and preserve the first requested order', async t => {
  const h = fixture(t);
  const small = variant(h);
  const medium = variant(h, 'BPB-M');
  const result = await quote(h, [
    { variant_id: small.id, quantity: 1 }, { variant_id: medium.id, quantity: 1 },
    { variant_id: small.id, quantity: 2 },
  ]);
  assert.deepEqual(result.lines.map(line => [line.variant_id, line.quantity]), [[small.id, 3], [medium.id, 1]]);
  assert.equal(result.subtotal, 2000000);
  assert.equal(result.delivery_fee, 0);
  assert.deepEqual(h.queries[0].values, [small.id, medium.id]);
});

test('missing and inactive variants, hidden products and inactive categories produce unavailable issues', async t => {
  const h = fixture(t);
  const inactive = variant(h, 'BPB-S');
  const hidden = variant(h, 'PRB-S');
  const category = variant(h, 'SGB-S');
  h.sqlite.prepare('UPDATE product_variants SET is_active = 0 WHERE id = ?').run(inactive.id);
  h.sqlite.prepare("UPDATE products SET status = 'HIDDEN' WHERE id = ?").run(hidden.product_id);
  h.exec("UPDATE categories SET is_active = 0 WHERE code = 'arrangements'");
  const ids = [inactive.id, hidden.id, category.id, 999999];
  const result = await quote(h, ids.map(variant_id => ({ variant_id, quantity: 1 })));
  assert.deepEqual(result.lines, []);
  assert.equal(result.subtotal, 0);
  assert.equal(result.delivery_fee, 20000);
  assert.equal(result.grand_total, 20000);
  assert.deepEqual(result.issues, ids.map(variant_id => ({ variant_id, code: 'VARIANT_UNAVAILABLE' })));
});

test('insufficient and zero stock keep quote lines with available issues and never write stock', async t => {
  const h = fixture(t);
  const small = variant(h);
  const medium = variant(h, 'BPB-M');
  h.sqlite.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(1, small.id);
  h.sqlite.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(0, medium.id);
  const result = await quote(h, [{ variant_id: small.id, quantity: 2 }, { variant_id: medium.id, quantity: 1 }]);
  assert.equal(result.lines.length, 2);
  assert.equal(result.subtotal, 1550000);
  assert.deepEqual(result.issues, [
    { variant_id: small.id, code: 'OUT_OF_STOCK', available: 1 },
    { variant_id: medium.id, code: 'OUT_OF_STOCK', available: 0 },
  ]);
  assert.equal(variant(h).stock_quantity, 1);
  assert.equal(variant(h, 'BPB-M').stock_quantity, 0);
  assert.ok(h.queries.every(({ sql }) => /^\s*SELECT\b/i.test(sql)), 'all pricing SQL is read-only');
});

test('image snapshot chooses primary first, then sort order fallback, then null', async t => {
  const h = fixture(t);
  const small = variant(h);
  const primary = h.sqlite.prepare('SELECT image_url FROM product_images WHERE product_id = ?').get(small.product_id).image_url;
  h.sqlite.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)')
    .run(small.product_id, 'https://example.test/fallback.png', -1);
  const items = [{ variant_id: small.id, quantity: 1 }];
  assert.equal((await quote(h, items)).lines[0].image_url, primary);
  h.sqlite.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(small.product_id);
  assert.equal((await quote(h, items)).lines[0].image_url, 'https://example.test/fallback.png');
  h.sqlite.prepare('DELETE FROM product_images WHERE product_id = ?').run(small.product_id);
  assert.equal((await quote(h, items)).lines[0].image_url, null);
});

test('raw cart size and per-line or merged quantity overflow throw CART_LIMIT before D1', async t => {
  const h = fixture(t);
  const id = variant(h).id;
  await rejectsCode(() => quote(h, Array.from({ length: 16 }, () => ({ variant_id: id, quantity: 1 }))), 'CART_LIMIT', 422);
  await rejectsCode(() => quote(h, [{ variant_id: id, quantity: 21 }]), 'CART_LIMIT', 422);
  await rejectsCode(() => quote(h, [{ variant_id: id, quantity: 20 }, { variant_id: id, quantity: 1 }]), 'CART_LIMIT', 422);
  assert.equal(h.queryCount, 0);
});

test('empty cart, zero or malformed quantity and invalid IDs throw VALIDATION_ERROR before D1', async t => {
  const h = fixture(t);
  const id = variant(h).id;
  const invalid = [[], [{ variant_id: id, quantity: 0 }], [{ variant_id: id, quantity: -1 }],
    [{ variant_id: id, quantity: 1.5 }], [{ variant_id: id, quantity: Number.NaN }],
    [{ variant_id: 0, quantity: 1 }], [{ variant_id: '1', quantity: 1 }]];
  for (const items of invalid) await rejectsCode(() => quote(h, items), 'VALIDATION_ERROR', 400);
  await rejectsCode(() => quote(h, [{ variant_id: id, quantity: 1 }], 'UNKNOWN'), 'VALIDATION_ERROR', 400);
  assert.equal(h.queryCount, 0);
});

test('maximum 15 cart lines and quantity 20 are accepted', async t => {
  const h = fixture(t);
  const variants = h.sqlite.prepare('SELECT id FROM product_variants ORDER BY id LIMIT 15').all();
  const result = await quote(h, variants.map(({ id }, index) => ({ variant_id: id, quantity: index === 0 ? 20 : 1 })));
  assert.equal(result.lines.length, 15);
  assert.equal(result.lines[0].quantity, 20);
  assert.equal(h.queryCount, 2);
});

test('pricing normalizes location whitespace and unsupported province still throws NO_DELIVERY_ZONE', async t => {
  const h = fixture(t);
  const items = [{ variant_id: variant(h).id, quantity: 1 }];
  assert.equal((await quote(h, items, 'STANDARD', ` ${province} `, ` ${ward} `)).delivery_fee, 20000);
  await rejectsCode(() => quote(h, items, 'STANDARD', 'Tỉnh chưa giao'), 'NO_DELIVERY_ZONE', 422);
});
