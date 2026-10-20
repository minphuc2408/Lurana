import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { listCategories, listProducts, listProductPage, listProductsByVariants, getProduct } from '../worker/services/catalog.ts';
import { productsQuerySchema, productsByVariantsQuerySchema } from '../shared/schemas.ts';
import { createTestDb } from './helpers/worker.mjs';

async function fixture(t) {
  const harness = await createTestDb();
  t.after(() => harness.close());
  return harness;
}

test('categories return the four active seed categories in sort order with only public fields', async t => {
  const { db, sqlite } = await fixture(t);
  const categories = await listCategories(db);
  assert.deepEqual(categories.map(category => category.code), ['bouquets', 'arrangements', 'dried-flowers', 'gift-sets']);
  assert.deepEqual(Object.keys(categories[0]).sort(), ['code', 'id', 'image_url', 'name_en', 'name_vi', 'slug']);
  sqlite.exec("UPDATE categories SET sort_order = -1 WHERE code = 'gift-sets'; UPDATE categories SET is_active = 0 WHERE code = 'bouquets'");
  assert.deepEqual((await listCategories(db)).map(category => category.code), ['gift-sets', 'arrangements', 'dried-flowers']);
});

test('seed catalog executes three D1 statements and returns 8 products, 24 S/M/L variants and 8 primary images', async t => {
  const { db, queries } = await fixture(t);
  queries.length = 0;
  const products = await listProducts(db);
  assert.equal(queries.length, 3, 'catalog executes exactly 3 D1 statements');
  assert.match(queries[0].sql, /FROM products p JOIN categories c/);
  assert.match(queries[1].sql, /FROM product_variants/);
  assert.match(queries[2].sql, /FROM product_images/);
  assert.equal(products.length, 8);
  for (const product of products) {
    assert.deepEqual(product.variants.map(variant => variant.size_code), ['S', 'M', 'L']);
    assert.equal(product.images.length, 1);
    assert.equal(product.images[0].is_primary, true);
    assert.equal(typeof product.is_featured, 'boolean');
    assert.ok(product.name_vi && product.name_en);
    assert.deepEqual(Object.keys(product).sort(), ['badge_code', 'category_code', 'description_en', 'description_vi', 'id', 'images', 'is_featured', 'name_en', 'name_vi', 'slug', 'variants']);
    assert.deepEqual(Object.keys(product.variants[0]).sort(), ['compare_at_price', 'id', 'in_stock', 'low_stock', 'max_quantity', 'price', 'size_code', 'sku']);
    assert.deepEqual(Object.keys(product.images[0]).sort(), ['alt_en', 'alt_vi', 'is_primary', 'url']);
  }
  console.log('Catalog D1 evidence: products=8, variants=24, primary_images=8, executed_statements=3.');
});

test('category and featured filters compose with bind parameters; empty catalog needs only one statement', async t => {
  const { db, queries } = await fixture(t);
  queries.length = 0;
  const products = await listProducts(db, { category: 'bouquets', featured: true });
  assert.equal(queries.length, 3);
  assert.deepEqual(queries[0].values, ['bouquets', 1, 40, 0]);
  assert.deepEqual(products.map(product => product.slug), ['blush-peony-bouquet', 'pastel-rose-bouquet']);
  assert.equal((await listProducts(db, { featured: false })).length, 5);
  queries.length = 0;
  assert.deepEqual(await listProducts(db, { category: "bouquets' OR 1=1 --" }), []);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0].values, ["bouquets' OR 1=1 --", 40, 0]);
});

test('hidden and archived products disappear from lists and details', async t => {
  const { db, sqlite, queries } = await fixture(t);
  for (const status of ['HIDDEN', 'ARCHIVED']) {
    sqlite.prepare('UPDATE products SET status = ? WHERE slug = ?').run(status, 'blush-peony-bouquet');
    assert.equal((await listProducts(db)).length, 7);
    assert.ok((await listProducts(db)).every(product => product.slug !== 'blush-peony-bouquet'));
    queries.length = 0;
    await assert.rejects(() => getProduct(db, 'blush-peony-bouquet'), error => error.code === 'NOT_FOUND' && error.status === 404);
    assert.equal(queries.length, 1);
  }
});

test('inactive categories hide their products and inactive variants are omitted', async t => {
  const { db, sqlite } = await fixture(t);
  sqlite.exec("UPDATE product_variants SET is_active = 0 WHERE sku = 'BPB-M'");
  assert.deepEqual((await getProduct(db, 'blush-peony-bouquet')).variants.map(variant => variant.size_code), ['S', 'L']);
  sqlite.exec("UPDATE categories SET is_active = 0 WHERE code = 'bouquets'");
  assert.equal((await listProducts(db)).length, 4);
  await assert.rejects(() => getProduct(db, 'blush-peony-bouquet'), error => error.code === 'NOT_FOUND');
});

test('public stock fields derive from DB without exposing internal stock and image identifiers', async t => {
  const { db, sqlite } = await fixture(t);
  sqlite.exec("UPDATE product_variants SET stock_quantity = 100 WHERE sku = 'BPB-S'; UPDATE product_variants SET stock_quantity = 3 WHERE sku = 'BPB-M'; UPDATE product_variants SET stock_quantity = 0 WHERE sku = 'BPB-L'; UPDATE product_images SET cloudinary_public_id = 'private/internal-id' WHERE product_id = 1");
  const product = await getProduct(db, 'blush-peony-bouquet');
  assert.deepEqual(product.variants.map(variant => [variant.in_stock, variant.low_stock, variant.max_quantity]), [[true, false, 20], [true, true, 3], [false, false, 0]]);
  assert.doesNotMatch(JSON.stringify(product), /stock_quantity|low_stock_threshold|archived_at|cloudinary_public_id|private\/internal-id/);
});

test('details assemble all ordered images in three statements and missing slugs return NOT_FOUND', async t => {
  const { db, sqlite, queries } = await fixture(t);
  sqlite.exec("INSERT INTO product_images (product_id, image_url, sort_order) VALUES (1, 'https://example.test/second.png', 2), (1, 'https://example.test/first.png', 1)");
  queries.length = 0;
  const product = await getProduct(db, 'blush-peony-bouquet');
  assert.equal(queries.length, 3);
  assert.deepEqual(product.images.slice(1).map(image => image.url), ['https://example.test/first.png', 'https://example.test/second.png']);
  assert.equal(product.images[1].alt_vi, null);
  queries.length = 0;
  await assert.rejects(() => getProduct(db, "missing' OR 1=1 --"), error => error.code === 'NOT_FOUND' && error.status === 404);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0].values, ["missing' OR 1=1 --"]);
});

test('catalog pages cap products and child binds at 40 with stable complete metadata', async t => {
  const { db, sqlite, queries } = await fixture(t);
  const insertProduct = sqlite.prepare('INSERT INTO products (category_id, slug, name_vi, name_en) VALUES (1, ?, ?, ?)');
  const insertVariant = sqlite.prepare("INSERT INTO product_variants (product_id, sku, size_code, price, stock_quantity) VALUES (?, ?, 'S', 1000, 1)");
  const insertImage = sqlite.prepare("INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, 'https://example.test/cap.png', 1)");
  for (let index = 0; index < 110; index++) {
    const { lastInsertRowid } = insertProduct.run(`cap-${index}`, `Hoa ${index}`, `Catalog Flower ${index}`);
    insertVariant.run(Number(lastInsertRowid), `CAP-${index}`);
    insertImage.run(Number(lastInsertRowid));
  }
  queries.length = 0;
  const first = await listProductPage(db);
  assert.deepEqual([first.total, first.page, first.pageSize, first.totalPages, first.items.length], [118, 1, 40, 3, 40]);
  assert.equal(queries.length, 4);
  assert.equal(queries[2].values.length, 40);
  assert.equal(queries[3].values.length, 40);
  const second = await listProductPage(db, { page: 2 });
  const last = await listProductPage(db, { page: 3 });
  const all = [...first.items, ...second.items, ...last.items];
  assert.equal(new Set(all.map(product => product.id)).size, 118, 'stable pages never skip or repeat products');
  assert.deepEqual([second.items.length, last.items.length], [40, 38]);
  assert.ok(all.every(product => product.variants.length > 0 && product.images.length === 1));
  const outside = await listProductPage(db, { page: 4 });
  assert.deepEqual(outside, { items: [], total: 118, page: 4, pageSize: 40, totalPages: 3 });
  assert.deepEqual(await listProductPage(db, { q: 'no such flower' }), { items: [], total: 0, page: 1, pageSize: 40, totalPages: 0 });
  const found = await listProductPage(db, { q: 'Flower 109', price: 'under-500', sort: 'low' });
  assert.deepEqual(found.items.map(product => product.slug), ['cap-109'], 'filters search beyond the first page');
  const searched = await Promise.all([1, 2, 3].map(page => listProductPage(db, { q: 'Catalog Flower', page, sort: 'low' })));
  assert.deepEqual(searched.map(page => page.items.length), [40, 40, 30]);
  assert.ok(searched.every(page => page.total === 110 && page.totalPages === 3));
  assert.equal(new Set(searched.flatMap(page => page.items.map(product => product.id))).size, 110);
});

test('catalog search folds Vietnamese case/accents and treats GLOB and LIKE punctuation literally', async t => {
  const { db, sqlite, queries } = await fixture(t);
  sqlite.prepare('UPDATE products SET name_vi = ?, name_en = ? WHERE id = 1').run('BÓ HỒNG ĐỎ TÌNH YÊU', 'Literal [rose] * ? % _');
  for (const q of ['bo hong do tinh yeu', 'Bó Hồng Đỏ', 'hồng đỏ', 'HỒNG ĐỎ', '[rose]', '[', ']', '*', '?', '%', '_']) {
    const page = await listProductPage(db, { q });
    assert.deepEqual(page.items.map(product => product.id), [1], q);
    assert.equal(page.total, 1, q);
  }
  sqlite.prepare('UPDATE products SET name_vi = ? WHERE id = 1').run('BÓ HỒNG ĐỎ TÌNH YÊU'.normalize('NFD'));
  assert.deepEqual((await listProductPage(db, { q: 'bó hồng đỏ'.normalize('NFD') })).items.map(product => product.id), [1]);
  queries.length = 0;
  assert.equal((await listProductPage(db, { q: "rose' OR 1=1 --" })).total, 0);
  assert.ok(queries.every(query => !query.sql.includes("rose' OR 1=1 --")), 'search always uses binds');
});

test('price filtering/sorting uses the smallest active size even if a larger size is cheaper', async t => {
  const { db, sqlite } = await fixture(t);
  sqlite.exec("UPDATE product_variants SET compare_at_price = NULL; UPDATE product_variants SET price = 2000000 WHERE product_id = 1; UPDATE product_variants SET price = 1 WHERE product_id = 1 AND size_code = 'L'");
  assert.ok(!(await listProductPage(db, { price: 'under-500' })).items.some(product => product.id === 1));
  assert.ok((await listProductPage(db, { price: 'over-2000' })).items.some(product => product.id === 1));
  assert.equal((await listProductPage(db, { sort: 'high' })).items[0].id, 1);
  sqlite.exec("UPDATE product_variants SET is_active = 0 WHERE product_id = 1 AND size_code IN ('S', 'M')");
  assert.equal((await listProductPage(db, { sort: 'low' })).items[0].id, 1);
});

test('cart variant restore is bounded, returns public active products and works independently of pages', async t => {
  const { db, sqlite, queries } = await fixture(t);
  queries.length = 0;
  const restored = await listProductsByVariants(db, [1, 2, 4]);
  assert.deepEqual(restored.map(product => product.id), [1, 2]);
  assert.equal(queries.length, 3);
  assert.doesNotMatch(JSON.stringify(restored), /stock_quantity|low_stock_threshold|cloudinary_public_id/);
  sqlite.exec("UPDATE products SET status = 'HIDDEN' WHERE id = 1; UPDATE product_variants SET is_active = 0 WHERE id = 4");
  assert.deepEqual(await listProductsByVariants(db, [1, 4, 999999]), []);
  await assert.rejects(() => listProductsByVariants(db, Array.from({ length: 16 }, (_, index) => index + 1)), error => error.code === 'VALIDATION_ERROR');
});

test('catalog query schemas reject malformed pages and unbounded or ambiguous variant restore requests', () => {
  assert.equal(productsQuerySchema.parse({}).page, 1);
  for (const page of ['', '0', '-1', '1.2', '1e2', '9007199254740991']) assert.equal(productsQuerySchema.safeParse({ page }).success, false, page);
  for (const input of [{ q: 'a\0b' }, { q: 'a'.repeat(101) }, { price: 'unknown' }, { sort: 'unknown' }]) assert.equal(productsQuerySchema.safeParse(input).success, false);
  assert.deepEqual(productsByVariantsQuerySchema.parse({ variant_ids: '1,2' }), { variant_ids: [1, 2] });
  for (const variant_ids of ['', '0', '-1', '1,1', '1.2', '1,', '9007199254740992', Array.from({ length: 16 }, (_, index) => index + 1).join(',')]) {
    assert.equal(productsByVariantsQuerySchema.safeParse({ variant_ids }).success, false, variant_ids);
  }
});


test('category illustrations are nullable, remain tied to category codes and use the existing active/sort query', async t => {
  const { db, sqlite } = await fixture(t);
  assert.ok((await listCategories(db)).every(category => category.image_url === null));
  sqlite.exec(readFileSync(new URL('../docs/sql/CATEGORY_IMAGES.sql', import.meta.url), 'utf8'));
  const categories = await listCategories(db);
  for (const category of categories) {
    assert.equal(category.image_url, `/images/categories/${category.code}-v1.webp`);
    const asset = readFileSync(new URL('../public' + category.image_url, import.meta.url));
    assert.equal(asset.toString('ascii', 0, 4), 'RIFF');
    assert.equal(asset.toString('ascii', 8, 12), 'WEBP');
    assert.ok(asset.length < 25000, 'Category thumbnails stay small');
  }
  sqlite.exec("UPDATE categories SET is_active = 0 WHERE code = 'bouquets'");
  assert.ok((await listCategories(db)).every(category => category.code !== 'bouquets'));
});

test('category-image migration upgrades populated 0001 without changing category identity, products or stock; URL update is repeatable', t => {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync(new URL('../migrations/0001_mvp.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../docs/sql/MVP_SEED_DEV.sql', import.meta.url), 'utf8'));
  const read = table => sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all().map(row => ({ ...row }));
  const before = Object.fromEntries(['categories', 'products', 'product_variants', 'product_images'].map(table => [table, read(table)]));
  sqlite.exec(readFileSync(new URL('../migrations/0002_category_images.sql', import.meta.url), 'utf8'));
  assert.deepEqual(read('categories'), before.categories.map(category => ({ ...category, image_url: null })));
  assert.throws(() => sqlite.exec("UPDATE categories SET image_url = '' WHERE code = 'bouquets'"), /CHECK constraint/);
  sqlite.exec("INSERT INTO categories (code,slug,name_vi,name_en) VALUES ('future','future','Future','Future')");
  const update = readFileSync(new URL('../docs/sql/CATEGORY_IMAGES.sql', import.meta.url), 'utf8');
  sqlite.exec(update);
  const assigned = read('categories');
  sqlite.exec(update);
  assert.deepEqual(read('categories'), assigned);
  assert.equal(assigned.find(category => category.code === 'future').image_url, null);
  for (const table of ['products', 'product_variants', 'product_images']) assert.deepEqual(read(table), before[table]);
  assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
});
