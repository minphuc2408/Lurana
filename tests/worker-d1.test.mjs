import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';
import app from '../worker/index.ts';

test('Phase 2 API acceptance on isolated workerd D1; no remote or persisted seed writes', async () => {
  const platform = await getPlatformProxy({ configPath: fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)), persist: false, remoteBindings: false,
    envFiles: [fileURLToPath(new URL('../.dev.vars.example', import.meta.url))] });
  try {
    const db = platform.env.DB;
    for (const file of ['../migrations/0001_mvp.sql', '../migrations/0002_category_images.sql', '../migrations/0003_hanoi_administrative_areas.sql', '../docs/sql/MVP_SEED_DEV.sql']) {
      await db.batch(splitSqlQuery(readFileSync(new URL(file, import.meta.url), 'utf8')).map(sql => db.prepare(sql)));
    }
    let queries = 0;
    // Each all()/first()/run() invocation counts a statement executed by the real D1 binding.
    const countedStatement = statement => ({
      bind(...values) { return countedStatement(statement.bind(...values)); },
      async all() { queries++; return statement.all(); },
      async first(column) { queries++; return statement.first(column); },
      async run() { queries++; return statement.run(); },
    });
    const env = { DB: { prepare(sql) { return countedStatement(db.prepare(sql)); } } };
    const read = async path => {
      const response = await app.request(path, {}, env);
      assert.equal(response.status, 200, path);
      return (await response.json()).data;
    };
    const categories = await read('/api/categories'); assert.equal(categories.length, 4);
    queries = 0;
    const products = (await read('/api/products')).items;
    assert.equal(products.length, 8); assert.equal(queries, 3);
    for (const product of products) {
      assert.deepEqual(product.variants.map(v => v.size_code), ['S', 'M', 'L']);
      assert.equal(product.images.filter(i => i.is_primary).length, 1);
    }
    console.log('D1 LOCAL API evidence: categories=4 products=8 variants=24 primary_images=8 GET /api/products statements=3.');
    const options = await read('/api/delivery/options');
    assert.equal(options.provinces.length, 1); assert.equal(options.provinces.flatMap(p => p.wards).length, 1);

    const variant = products[0].variants[0]; const before = await db.prepare('SELECT stock_quantity FROM product_variants WHERE id=?').bind(variant.id).first();
    const quoteBody = { items: [{ variant_id: variant.id, quantity: 1, price: 1 }], province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', delivery_method_code: 'STANDARD', grand_total: 1, delivery_fee: 1 };
    const post = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const checkQuote = async (body, status) => {
      const response = await app.request('/api/checkout/quote', post(body), env);
      assert.equal(response.status, status); return response.json();
    };
    const ward = (await checkQuote(quoteBody, 200)).data;
    assert.equal(ward.lines[0].unit_price, variant.price); assert.equal(ward.subtotal, 450000);
    assert.equal(ward.delivery_fee, 20000); assert.equal(ward.grand_total, 470000);
    assert.equal((await checkQuote({ ...quoteBody, ward_name: 'Cửa Nam' }, 422)).error.code, 'NO_DELIVERY_ZONE');
    assert.equal((await checkQuote({ ...quoteBody, province_name: 'Tỉnh chưa giao' }, 422)).error.code, 'NO_DELIVERY_ZONE');
    assert.equal((await checkQuote({ ...quoteBody, items: Array.from({ length: 16 }, () => ({ variant_id: variant.id, quantity: 1 })) }, 422)).error.code, 'CART_LIMIT');
    assert.equal((await checkQuote({ ...quoteBody, items: [{ variant_id: variant.id, quantity: 0 }] }, 400)).error.code, 'VALIDATION_ERROR');
    assert.equal((await checkQuote({ ...quoteBody, items: [{ variant_id: variant.id, quantity: 21 }] }, 422)).error.code, 'CART_LIMIT');
    await db.prepare('UPDATE products SET status=? WHERE slug=?').bind('HIDDEN', products[0].slug).run();
    assert.equal((await read('/api/products')).items.length, 7);
    const hidden = await app.request(`/api/products/${products[0].slug}`, {}, env);
    assert.equal(hidden.status, 404); assert.equal((await hidden.json()).error.code, 'NOT_FOUND');
    assert.deepEqual(await db.prepare('SELECT stock_quantity FROM product_variants WHERE id=?').bind(variant.id).first(), before);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM orders').first()).n, 0);
    console.log('D1 LOCAL API evidence: HIDDEN -> list=7/detail=404; DB price=450000; ward_fee=20000; unconfigured_ward=422; unknown_province=422/NO_DELIVERY_ZONE.');
    console.log('D1 LOCAL API evidence: cart16=422/CART_LIMIT qty0=400/VALIDATION_ERROR qty21=422/CART_LIMIT; stock unchanged; orders=0; persist=false.');
  } finally {
    await platform.dispose();
  }
});
