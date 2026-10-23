import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';
import { adminCatalogRoutes } from '../worker/routes/admin-catalog.ts';
import { handleError } from '../worker/lib/errors.ts';
import { listAdminProducts, createAdminProduct, patchAdminProduct, patchAdminVariant,
  listAdminDeliveryZones, createAdminDeliveryZone, putAdminDeliveryZone } from '../worker/services/admin-catalog.ts';
import { listProducts, getProduct } from '../worker/services/catalog.ts';
import { priceCart } from '../worker/services/pricing.ts';
import { createOrder } from '../worker/services/orders.ts';
import { todayInVN } from '../worker/lib/datetime.ts';
import { createTestDb } from './helpers/worker.mjs';

function fixture(t) {
  const harness = createTestDb();
  t.after(() => harness.close());
  return harness;
}
function product(overrides = {}) {
  return { category_id: 1, slug: 'admin-test-bouquet', name_vi: 'Hoa quản trị', name_en: 'Admin flowers',
    description_vi: null, description_en: null, badge_code: 'NEW', is_featured: true, status: 'ACTIVE',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/admin-flower.png', alt_vi: 'Hoa', alt_en: 'Flower' },
    variants: [{ sku: 'ADMIN-STANDARD', size_code: 'STANDARD', price: 100000, compare_at_price: 120000,
      stock_quantity: 20, low_stock_threshold: 3, is_active: true }], ...overrides };
}
function zone(overrides = {}) {
  return { province_name: 'Thành phố Hà Nội', ward_name: 'Cửa Nam', fee: 22000, free_from_amount: null,
    eta_minutes: null, is_active: true, ...overrides };
}
const rejectsCode = (action, code, status) => assert.rejects(action, error => error.code === code && error.status === status);

test('admin catalog returns every product/variant status and exact stock in exactly three statements', async t => {
  const { db, sqlite, queries } = fixture(t);
  sqlite.exec("UPDATE products SET status = 'HIDDEN' WHERE id = 1; UPDATE products SET status = 'ARCHIVED' WHERE id = 2; UPDATE categories SET is_active = 0 WHERE id = 1; UPDATE product_variants SET is_active = 0, stock_quantity = 123 WHERE id = 1");
  queries.length = 0;
  const products = await listAdminProducts(db);
  assert.equal(queries.length, 3);
  assert.equal(products.length, 8);
  assert.equal(products[0].status, 'HIDDEN');
  assert.equal(products[1].status, 'ARCHIVED');
  assert.equal(products[0].variants[0].stock_quantity, 123);
  assert.equal(products[0].variants[0].is_active, false);
  assert.equal(typeof products[0].is_featured, 'boolean');
  assert.equal(products[0].images[0].is_primary, true);
  assert.doesNotMatch(JSON.stringify(products), /password|secret/);
});

test('admin catalog has no public 100-product truncation or per-product queries', async t => {
  const { db, sqlite, queries } = fixture(t);
  const insert = sqlite.prepare('INSERT INTO products (category_id, slug, name_vi, name_en) VALUES (?, ?, ?, ?)');
  for (let i = 0; i < 105; i++) insert.run(1, `admin-extra-${i}`, `Hoa ${i}`, `Flower ${i}`);
  queries.length = 0;
  assert.equal((await listAdminProducts(db)).length, 113);
  assert.equal(queries.length, 3);
  assert.ok(queries.every(query => query.values.length <= 100));
});

test('product creation persists product, all variants and one primary image in one atomic batch', async t => {
  const { db, sqlite, queries } = fixture(t);
  let batches = 0;
  const counted = { ...db, batch: async statements => { batches++; return db.batch(statements); } };
  const input = product({ variants: [product().variants[0], {
    sku: "ADMIN-S' safe", size_code: 'S', price: 80000, stock_quantity: 5,
  }] });
  queries.length = 0;
  const created = await createAdminProduct(counted, input);
  assert.equal(batches, 1);
  assert.equal(queries.length, 4);
  assert.ok(created.id > 8);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ?').get(created.id).n, 1);
  const publicProduct = await getProduct(db, input.slug);
  assert.deepEqual(publicProduct.variants.map(row => row.size_code), ['S', 'STANDARD']);
  assert.equal(publicProduct.images[0].url, input.image.url);
  assert.ok((await listProducts(db)).some(row => row.id === created.id));
  assert.ok(queries.some(query => query.values.includes("ADMIN-S' safe")));
  assert.ok(queries.every(query => !query.sql.includes("ADMIN-S' safe")));
});

test('duplicate slug/SKU returns CONFLICT and failed child insert rolls the entire creation back', async t => {
  const { db, sqlite } = fixture(t);
  const baseline = sqlite.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  await rejectsCode(() => createAdminProduct(db, product({ slug: 'blush-peony-bouquet' })), 'CONFLICT', 409);
  await rejectsCode(() => createAdminProduct(db, product({ variants: [product().variants[0], {
    sku: 'BPB-S', size_code: 'S', price: 50000,
  }] })), 'CONFLICT', 409);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM products').get().n, baseline);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM product_variants WHERE sku = 'ADMIN-STANDARD'").get().n, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM product_images WHERE image_url = 'https://res.cloudinary.com/demo/image/upload/admin-flower.png'").get().n, 0);
});

test('product create validation rejects bad image URLs, duplicate sizes, compare price and missing category without partial records', async t => {
  const { db, sqlite, queries } = fixture(t);
  for (const bad of [
    product({ slug: 'by-variants' }),
    product({ image: { url: 'malformed-url' } }),
    product({ image: { url: 'javascript:alert(1)' } }),
    product({ image: { url: 'https://user:password@example.test/image.png' } }),
    product({ variants: [{ ...product().variants[0], compare_at_price: 1 }] }),
    product({ variants: [product().variants[0], { ...product().variants[0], sku: 'OTHER' }] }),
  ]) {
    queries.length = 0;
    await rejectsCode(() => createAdminProduct(db, bad), 'VALIDATION_ERROR', 400);
    assert.equal(queries.length, 0);
  }
  await rejectsCode(() => createAdminProduct(db, product({ category_id: 999 })), 'VALIDATION_ERROR', 400);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM products WHERE slug = 'admin-test-bouquet'").get().n, 0);
});

test('product patches update text, primary image and archive timestamp while public visibility follows status', async t => {
  const { db, sqlite } = fixture(t);
  const { id } = await createAdminProduct(db, product());
  sqlite.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)').run(id, 'https://res.cloudinary.com/demo/image/upload/extra.png', 1);
  await patchAdminProduct(db, id, { name_vi: "Hoa ' mới", name_en: 'Updated flowers', description_vi: 'Mô tả',
    description_en: null, badge_code: null, is_featured: false, image: { url: 'https://res.cloudinary.com/demo/image/upload/new.png' } });
  const updated = await getProduct(db, 'admin-test-bouquet');
  assert.equal(updated.name_vi, "Hoa ' mới");
  assert.equal(updated.badge_code, null);
  assert.equal(updated.is_featured, false);
  assert.deepEqual(updated.images.map(image => image.url), ['https://res.cloudinary.com/demo/image/upload/new.png', 'https://res.cloudinary.com/demo/image/upload/extra.png']);
  for (const status of ['HIDDEN', 'ARCHIVED']) {
    await patchAdminProduct(db, id, { status });
    await rejectsCode(() => getProduct(db, 'admin-test-bouquet'), 'NOT_FOUND', 404);
    assert.equal((await listAdminProducts(db)).find(row => row.id === id).status, status);
  }
  const archived = sqlite.prepare('SELECT archived_at FROM products WHERE id = ?').get(id).archived_at;
  assert.match(archived, /^\d{4}-\d{2}-\d{2}T.*Z$/);
  await patchAdminProduct(db, id, { status: 'ARCHIVED' });
  assert.equal(sqlite.prepare('SELECT archived_at FROM products WHERE id = ?').get(id).archived_at, archived);
  await patchAdminProduct(db, id, { status: 'ACTIVE' });
  assert.equal(sqlite.prepare('SELECT archived_at FROM products WHERE id = ?').get(id).archived_at, null);
  assert.equal((await getProduct(db, 'admin-test-bouquet')).id, id);
});

test('primary image patch creates a missing image or promotes an existing fallback without duplicates', async t => {
  const { db, sqlite } = fixture(t);
  sqlite.exec('DELETE FROM product_images WHERE product_id = 1; UPDATE product_images SET is_primary = 0 WHERE product_id = 2');
  for (const id of [1, 2]) {
    await patchAdminProduct(db, id, { image: { url: 'https://res.cloudinary.com/demo/image/upload/primary.png', alt_vi: 'Ảnh mới' } });
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ?').get(id).n, 1);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ? AND is_primary = 1').get(id).n, 1);
  }
  await rejectsCode(() => patchAdminProduct(db, 999, { status: 'HIDDEN' }), 'NOT_FOUND', 404);
  await rejectsCode(() => patchAdminProduct(db, 1, {}), 'VALIDATION_ERROR', 400);
});

test('stock_delta increments/decrements atomically, takes priority over absolute stock and rejects negative result', async t => {
  const { db, sqlite, queries } = fixture(t);
  assert.equal((await patchAdminVariant(db, 1, { stock_delta: 5 })).stock_quantity, 25);
  assert.equal((await patchAdminVariant(db, 1, { stock_delta: -3, stock_quantity: 999 })).stock_quantity, 22);
  await assert.rejects(() => patchAdminVariant(db, 1, { stock_delta: -23 }), cause =>
    cause.code === 'VALIDATION_ERROR' && cause.status === 400 && cause.message === 'Tồn kho không thể âm.');
  assert.equal(sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE id = 1').get().stock_quantity, 22);
  assert.equal((await patchAdminVariant(db, 1, { stock_quantity: 7 })).stock_quantity, 7);
  assert.ok(queries.some(query => /stock_quantity = stock_quantity \+ \?/.test(query.sql)));
  assert.ok(queries.some(query => query.values.includes(-23)));
  await rejectsCode(() => patchAdminVariant(db, 1, { stock_delta: Number.MAX_SAFE_INTEGER }), 'VALIDATION_ERROR', 400);
  assert.equal(sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE id = 1').get().stock_quantity, 7);
});

test('stock_delta preserves order consumption occurring after variant read', async t => {
  const { db, sqlite } = fixture(t);
  let injected = false;
  const concurrent = { ...db, prepare(sql) {
    const prepared = db.prepare(sql);
    if (!/SELECT.*FROM product_variants WHERE id/.test(sql)) return prepared;
    return { ...prepared, bind(...values) {
      const bound = prepared.bind(...values);
      return { ...bound, async first() {
        const row = await bound.first();
        if (!injected) {
          injected = true;
          sqlite.prepare('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?').run(2, 1);
        }
        return row;
      } };
    } };
  } };
  assert.equal((await patchAdminVariant(concurrent, 1, { stock_delta: 5 })).stock_quantity, 23);
  console.log('Admin catalog evidence: stock_delta preserves interleaved order consumption (20 - 2 + 5 = 23).');
});

test('variant patch validates effective compare price before writes, preserves omitted fields and can clear compare price', async t => {
  const { db, sqlite, queries } = fixture(t);
  queries.length = 0;
  await rejectsCode(() => patchAdminVariant(db, 5, { price: 600000 }), 'VALIDATION_ERROR', 400);
  assert.equal(queries.length, 1, 'invalid effective price performs read only');
  assert.equal(sqlite.prepare('SELECT price FROM product_variants WHERE id = 5').get().price, 520000);
  await rejectsCode(() => patchAdminVariant(db, 1, { compare_at_price: 100 }), 'VALIDATION_ERROR', 400);
  const updated = await patchAdminVariant(db, 5, { price: 600000, compare_at_price: null, low_stock_threshold: 9, is_active: false });
  assert.equal(updated.price, 600000);
  assert.equal(updated.compare_at_price, null);
  assert.equal(updated.low_stock_threshold, 9);
  assert.equal(updated.is_active, false);
  assert.equal(updated.stock_quantity, 15);
  await rejectsCode(() => patchAdminVariant(db, 999, { stock_delta: 1 }), 'NOT_FOUND', 404);
  for (const body of [{}, { stock_delta: 0.5 }, { stock_quantity: -1 }, { price: -1 }]) {
    await rejectsCode(() => patchAdminVariant(db, 1, body), 'VALIDATION_ERROR', 400);
  }
});

test('concurrent price change still cannot violate DB compare price constraint', async t => {
  const { db, sqlite } = fixture(t);
  const concurrent = { ...db, prepare(sql) {
    const prepared = db.prepare(sql);
    if (!/SELECT.*FROM product_variants WHERE id/.test(sql)) return prepared;
    return { ...prepared, bind(...values) {
      const bound = prepared.bind(...values);
      return { ...bound, async first() {
        const row = await bound.first();
        sqlite.prepare('UPDATE product_variants SET price = ? WHERE id = ?').run(600000, 1);
        return row;
      } };
    } };
  } };
  await rejectsCode(() => patchAdminVariant(concurrent, 1, { compare_at_price: 500000 }), 'VALIDATION_ERROR', 400);
  assert.equal(sqlite.prepare('SELECT compare_at_price FROM product_variants WHERE id = 1').get().compare_at_price, null);
});

test('delivery zone fee changes immediately affect quote and inactive zones remain visible only in admin', async t => {
  const { db } = fixture(t);
  const created = await createAdminDeliveryZone(db, zone());
  const quote = () => priceCart(db, [{ variant_id: 1, quantity: 1 }], created.province_name, created.ward_name, 'STANDARD');
  assert.equal((await quote()).delivery_fee, 22000);
  const changed = await putAdminDeliveryZone(db, created.id, zone({ fee: 33000, eta_minutes: 60 }));
  assert.equal(changed.fee, 33000);
  assert.equal(changed.eta_minutes, 60);
  assert.equal((await quote()).delivery_fee, 33000);
  await putAdminDeliveryZone(db, created.id, zone({ fee: 33000, free_from_amount: 400000 }));
  assert.equal((await quote()).delivery_fee, 0);
  await putAdminDeliveryZone(db, created.id, zone({ is_active: false }));
  await rejectsCode(quote, 'NO_DELIVERY_ZONE', 422);
  assert.equal((await listAdminDeliveryZones(db)).find(row => row.id === created.id).is_active, false);
});

test('delivery zone bound names, conflict, validation and missing IDs behave safely', async t => {
  const { db, queries } = fixture(t);
  const input = zone({ province_name: "Tỉnh ' OR 1=1 --", ward_name: "Phường %_" });
  await rejectsCode(() => createAdminDeliveryZone(db, input), 'VALIDATION_ERROR', 400);
  const created = await createAdminDeliveryZone(db, zone({ ward_name: 'Ba Đình' }));
  assert.ok(queries.some(query => query.values.includes(input.province_name)));
  assert.ok(queries.every(query => !query.sql.includes(input.province_name)));
  await rejectsCode(() => createAdminDeliveryZone(db, zone({ ward_name: 'Ba Đình' })), 'CONFLICT', 409);
  const second = await createAdminDeliveryZone(db, zone());
  await rejectsCode(() => putAdminDeliveryZone(db, second.id, zone({ ward_name: 'Ba Đình' })), 'CONFLICT', 409);
  await rejectsCode(() => putAdminDeliveryZone(db, 999, zone()), 'NOT_FOUND', 404);
  for (const bad of [zone({ fee: -1 }), zone({ eta_minutes: 0 }), zone({ province_name: '' }), zone({ free_from_amount: -1 })]) {
    await rejectsCode(() => createAdminDeliveryZone(db, bad), 'VALIDATION_ERROR', 400);
  }
});

test('admin catalog routes expose expected envelopes and validate route IDs/stripped empty patches', async t => {
  const { db } = fixture(t);
  const app = new Hono();
  app.onError(handleError);
  app.route('/api/admin', adminCatalogRoutes);
  const request = (route, method = 'GET', body) => app.request(`/api/admin${route}`, {
    method, headers: { 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
  }, { DB: db });
  let response = await request('/products');
  const firstPage = (await response.json()).data;
  assert.equal(firstPage.items.length, 5);
  assert.equal(firstPage.total, 8);
  assert.equal(firstPage.limit, 5);
  response = await request('/products', 'POST', product());
  assert.equal(response.status, 201);
  assert.ok((await response.json()).data.id > 8);
  response = await request('/products', 'POST', product({ image: { url: 'malformed-url' } }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
  response = await request('/products/1', 'PATCH', { image: { url: 'malformed-url' } });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
  for (const id of ['0', '-1', '1.5', '9007199254740992']) {
    response = await request(`/variants/${id}`, 'PATCH', { stock_delta: 1 });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
  }
  response = await request('/products/1', 'PATCH', { password: 'ignored' });
  assert.equal(response.status, 400);
  response = await request('/variants/1', 'PATCH', { stock_delta: 2 });
  assert.equal((await response.json()).data.stock_quantity, 22);
  response = await request('/delivery-zones', 'POST', zone());
  assert.equal(response.status, 201);
  const created = (await response.json()).data;
  response = await request(`/delivery-zones/${created.id}`, 'PUT', zone({ fee: 99000 }));
  assert.equal((await response.json()).data.fee, 99000);
  response = await request('/delivery-zones');
  assert.ok((await response.json()).data.items.some(row => row.id === created.id));
});

test('admin catalog maps wrapped D1 causes into safe domain errors', async t => {
  const { db } = fixture(t);
  const broken = { ...db, async batch() {
    throw new Error('D1_ERROR', { cause: new Error('UNIQUE constraint failed: product_variants.sku') });
  } };
  await rejectsCode(() => createAdminProduct(broken, product()), 'CONFLICT', 409);
});

test('admin catalog runs on isolated real workerd D1: atomic rollback, archive/image and concurrent order stock', async t => {
  const platform = await getPlatformProxy({ configPath: fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)),
    envFiles: [fileURLToPath(new URL('../.dev.vars.example', import.meta.url))], persist: false, remoteBindings: false });
  try {
    const db = platform.env.DB;
    for (const file of ['../migrations/0001_mvp.sql', '../migrations/0002_category_images.sql', '../migrations/0003_hanoi_administrative_areas.sql', '../docs/sql/MVP_SEED_DEV.sql']) {
      await db.batch(splitSqlQuery(readFileSync(new URL(file, import.meta.url), 'utf8')).map(sql => db.prepare(sql)));
    }
    await t.test('a child SKU conflict rolls back product and earlier child on real D1', async () => {
      const input = product({ variants: [product().variants[0], { sku: 'BPB-S', size_code: 'S', price: 50000 }] });
      await rejectsCode(() => createAdminProduct(db, input), 'CONFLICT', 409);
      assert.equal(await db.prepare('SELECT COUNT(*) AS n FROM products WHERE slug = ?').bind(input.slug).first('n'), 0);
      assert.equal(await db.prepare('SELECT COUNT(*) AS n FROM product_variants WHERE sku = ?').bind('ADMIN-STANDARD').first('n'), 0);
      const created = await createAdminProduct(db, product());
      assert.ok(created.id > 8);
      assert.equal((await getProduct(db, 'admin-test-bouquet')).variants[0].stock_quantity, undefined);
    });
    await t.test('primary image and archive status are persisted by the real atomic D1 patch', async () => {
      const product = (await listAdminProducts(db)).find(row => row.slug === 'admin-test-bouquet');
      await patchAdminProduct(db, product.id, { status: 'ARCHIVED', image: { url: 'https://res.cloudinary.com/demo/image/upload/d1-updated.png' } });
      const archived = (await listAdminProducts(db)).find(row => row.id === product.id);
      assert.match(archived.archived_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
      assert.equal(archived.images[0].url, 'https://res.cloudinary.com/demo/image/upload/d1-updated.png');
      await rejectsCode(() => getProduct(db, product.slug), 'NOT_FOUND', 404);
      await patchAdminProduct(db, product.id, { status: 'ACTIVE' });
      assert.equal((await getProduct(db, product.slug)).id, product.id);
    });
    await t.test('real D1 gallery replacement persists eight images and rolls back all links on insert failure', async () => {
      const product = (await listAdminProducts(db)).find(row => row.slug === 'admin-test-bouquet');
      await patchAdminProduct(db, product.id, { images: gallery() });
      assert.equal((await getProduct(db, product.slug)).images.length, 8);
      const before = (await db.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY id').bind(product.id).all()).results;
      await db.prepare("CREATE TRIGGER gallery_failure BEFORE INSERT ON product_images WHEN NEW.image_url LIKE '%broken%' BEGIN SELECT RAISE(ABORT,'synthetic gallery failure'); END").run();
      await assert.rejects(() => patchAdminProduct(db, product.id, { images: [{ url: 'https://images.unsplash.com/broken.jpg', is_primary: true }] }));
      assert.deepEqual((await db.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY id').bind(product.id).all()).results, before);
    });
    await t.test('concurrent admin delta and new order conserve real D1 stock; excessive negative delta rolls back', async () => {
      const date = new Date(Date.parse(`${todayInVN()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
      const order = {
        items: [{ variant_id: 1, quantity: 2 }],
        sender: { name: 'Người đặt demo admin D1', phone: '0900000000', is_anonymous: false },
        recipient: { name: 'Người nhận demo admin D1', phone: '0911111111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: '12 Phố Hoa Demo' },
        delivery: { method_code: 'STANDARD', date, time_slot: '08:00-10:00' }, card: { type: 'NONE' },
      };
      await Promise.all([patchAdminVariant(db, 1, { stock_delta: 5 }), createOrder(db, order, randomUUID())]);
      assert.equal(await db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').bind(1).first('stock_quantity'), 23);
      await assert.rejects(() => patchAdminVariant(db, 1, { stock_delta: -24 }), error =>
        error.code === 'VALIDATION_ERROR' && error.message === 'Tồn kho không thể âm.');
      assert.equal(await db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').bind(1).first('stock_quantity'), 23);
    });
    console.log('Admin catalog real D1 evidence: creation rollback, atomic image/archive, concurrent order + delta => stock=23; persist=false, remoteBindings=false.');
  } finally { await platform.dispose(); }
});


const gallery = (count = 8, cover = 3) => Array.from({length: count}, (_, index) => ({
 url: `https://res.cloudinary.com/demo/image/upload/v1/lunara/test/photo-${index}.webp`, cloudinary_public_id: `lunara/test/photo-${index}`,
 alt_vi: `Ảnh ${index}`, alt_en: `Photo ${index}`, is_primary: index === cover,
}));
test('eight-image create stores public IDs/order with one cover; list only returns cover and detail returns full gallery', async t => {
 const { db, sqlite } = fixture(t);
 const input = product(); delete input.image; input.images = gallery();
 const { id } = await createAdminProduct(db, input);
 const rows = sqlite.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order').all(id);
 assert.equal(rows.length,8); assert.deepEqual(rows.map(r=>r.sort_order),[0,1,2,3,4,5,6,7]);
 assert.equal(rows.filter(r=>r.is_primary).length,1); assert.equal(rows[3].cloudinary_public_id,input.images[3].cloudinary_public_id);
 const detail=await getProduct(db,input.slug); assert.equal(detail.images.length,8);
 assert.deepEqual(detail.images.map(i=>i.url),input.images.map(i=>i.url));
 const summary=(await listProducts(db)).find(p=>p.id===id); assert.equal(summary.images.length,1); assert.equal(summary.images[0].url,input.images[3].url);
 assert.doesNotMatch(JSON.stringify(detail),/cloudinary_public_id/);
 const admin=(await listAdminProducts(db)).find(p=>p.id===id); assert.equal(admin.images[3].cloudinary_public_id,input.images[3].cloudinary_public_id);
});

test('gallery replacement reorders, removes links and changes cover atomically without touching stock', async t => {
 const { db, sqlite } = fixture(t); const input=product(); delete input.image; input.images=gallery(3,0);
 const {id}=await createAdminProduct(db,input);
 const stock=sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE product_id=?').get(id).stock_quantity;
 const images=[{...input.images[2],is_primary:true},{...input.images[0],is_primary:false}];
 await patchAdminProduct(db,id,{images});
 const before=sqlite.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order').all(id);
 assert.deepEqual(before.map(i=>i.image_url),images.map(i=>i.url)); assert.deepEqual(before.map(i=>i.sort_order),[0,1]);
 sqlite.exec("CREATE TRIGGER reject_gallery BEFORE INSERT ON product_images WHEN NEW.image_url LIKE '%broken%' BEGIN SELECT RAISE(ABORT,'synthetic gallery failure'); END");
 await assert.rejects(()=>patchAdminProduct(db,id,{name_en:'Must roll back',images:[{url:'https://images.unsplash.com/broken.jpg',is_primary:true}]}));
 assert.deepEqual(sqlite.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order').all(id),before);
 assert.equal(sqlite.prepare('SELECT name_en FROM products WHERE id=?').get(id).name_en,input.name_en);
 assert.equal(sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE product_id=?').get(id).stock_quantity,stock);
});

test('gallery rejects invalid count, duplicate URLs, cover ambiguity and mismatched public IDs before writing', async t => {
 const {db,queries}=fixture(t);
 for(const images of [[],gallery(9,0),gallery(2,-1),gallery(2,0).map(i=>({...i,is_primary:true})),[gallery(1,0)[0],gallery(1,0)[0]],
 [{...gallery(1,0)[0],cloudinary_public_id:'someone-else'}], [{url:'not-a-url',cloudinary_public_id:'asset',is_primary:true}]]) {
  queries.length=0; await rejectsCode(()=>patchAdminProduct(db,1,{images}),'VALIDATION_ERROR',400); assert.equal(queries.length,0);
 }
 await rejectsCode(()=>patchAdminProduct(db,1,{image:{url:'https://images.unsplash.com/a.jpg'},images:gallery(1,0)}),'VALIDATION_ERROR',400);
});

test('public list selects one deterministic fallback image when a legacy product has no cover', async t => {
 const {db,sqlite}=fixture(t);
 sqlite.exec("UPDATE product_images SET is_primary=0 WHERE product_id=1; INSERT INTO product_images(product_id,image_url,sort_order) VALUES(1,'https://images.unsplash.com/secondary.jpg',2)");
 const item=(await listProducts(db)).find(p=>p.id===1); assert.equal(item.images.length,1);
 assert.equal((await getProduct(db,'blush-peony-bouquet')).images.length,2);
 assert.notEqual(item.images[0].url,'https://images.unsplash.com/secondary.jpg');
});
