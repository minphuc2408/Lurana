import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';
import writeXlsxFile from 'write-excel-file/universal';
import { readSheet } from 'read-excel-file/universal';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import app from '../worker/index.ts';
import { signSession } from '../worker/lib/auth.ts';
import { createProductWorkbook, encodeWorkbook, parseProductWorkbook } from '../worker/services/product-workbook.ts';
import { importProducts } from '../worker/services/product-import.ts';
import { patchAdminProduct } from '../worker/services/admin-catalog.ts';
import { PRODUCT_IMPORT_COLUMNS, productImportRequestSchema } from '../shared/product-import.ts';
import { createTestDb } from './helpers/worker.mjs';

const input = (overrides = {}) => ({ category_id: 1, slug: 'excel-bouquet', name_vi: 'Hoa nhập Excel', name_en: 'Excel flowers',
  description_vi: 'Mô tả tiếng Việt', description_en: '', badge_code: 'NEW', is_featured: true, status: 'HIDDEN',
  sku: 'EXCEL-S', size_code: 'S', price: 250000, compare_at_price: 300000, stock_quantity: 10, low_stock_threshold: 3, is_active: true, ...overrides });
const cell = value => value == null ? null : { value, type: typeof value === 'number' ? Number : typeof value === 'boolean' ? Boolean : String };
async function workbook(values, columns = PRODUCT_IMPORT_COLUMNS) {
  const blob = await writeXlsxFile([columns.map(cell), ...values.map(row => columns.map(column => cell(row[column])))], { sheet: 'Products' }).toBlob();
  return encodeWorkbook(new Uint8Array(await blob.arrayBuffer()));
}
function fixture(t) { const harness = createTestDb(); t.after(() => harness.close()); return harness; }
const invalid = action => assert.rejects(action, error => error.code === 'VALIDATION_ERROR' && error.status === 400);
const conflict = action => assert.rejects(action, error => error.code === 'CONFLICT' && error.status === 409);

test('Excel template round-trips with blank Products, current categories, bilingual instructions and separate examples', async () => {
  const bytes = await createProductWorkbook([{ id: 23, code: 'BOUQUETS', name_vi: 'Bó hoa', name_en: 'Bouquets' }]);
  assert.deepEqual((await readSheet(bytes.buffer, 'Products'))[0], [...PRODUCT_IMPORT_COLUMNS]);
  assert.deepEqual((await readSheet(bytes.buffer, 'Categories'))[1], [23, 'BOUQUETS', 'Bó hoa', 'Bouquets']);
  assert.equal((await readSheet(bytes.buffer, 'Examples')).length, 4);
  await invalid(() => parseProductWorkbook(encodeWorkbook(bytes)));
});

test('Excel groups repeated slugs, preserves fields and performs read-only validation before atomic create without images', async t => {
  const { db, sqlite } = fixture(t);
  const base64 = await workbook([input(), input({ sku: 'EXCEL-M', size_code: 'M', price: 280000 })]);
  const before = sqlite.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  const preview = await importProducts(db, base64, true);
  assert.equal(preview.validated, true); assert.equal(preview.product_count, 1); assert.equal(preview.variant_count, 2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM products').get().n, before);
  const result = await importProducts(db, base64, false);
  assert.equal(result.validated, false);
  const product = sqlite.prepare('SELECT * FROM products WHERE slug=?').get('excel-bouquet');
  assert.equal(product.name_vi, input().name_vi); assert.equal(product.description_vi, input().description_vi);
  assert.equal(product.badge_code, 'NEW'); assert.equal(product.is_featured, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM product_images WHERE product_id=?').get(product.id).n, 0);
  assert.deepEqual(sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE product_id=? ORDER BY id').all(product.id).map(row => row.stock_quantity), [10, 10]);
  await patchAdminProduct(db, product.id, { images: [{ url: 'https://images.unsplash.com/excel.jpg', is_primary: true }] });
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM product_images WHERE product_id=?').get(product.id).n, 1);
  await conflict(() => importProducts(db, base64, false));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM products').get().n, before + 1);
});

test('Excel rejects missing columns and fields, numeric SKU, bad enums, price, quantity, duplicates and inconsistent groups with row numbers', async t => {
  const { db, queries } = fixture(t);
  for (const values of [
    [input({ name_vi: '' })], [input({ sku: 123 })], [input({ category_id: '' })], [input({ price: '250,000' })],
    [input({ price: -1 })], [input({ price: 1.5 })], [input({ stock_quantity: '' })], [input({ low_stock_threshold: '' })],
    [input({ compare_at_price: 1 })], [input({ size_code: 'XL' })], [input({ status: 'VISIBLE' })], [input({ is_active: 'yes' })],
    [input(), input({ sku: 'EXCEL-M', size_code: 'M', name_en: 'Different name' })],
    [input(), input({ sku: 'EXCEL-M' })], [input(), input({ slug: 'other' })],
  ]) {
    queries.length = 0;
    const base64 = await workbook(values);
    await assert.rejects(() => importProducts(db, base64, false), error => error.code === 'VALIDATION_ERROR'
      && error.details.some(issue => issue.row >= 2));
    assert.equal(queries.length, 0);
  }
  await invalid(async () => parseProductWorkbook(await workbook([input()], PRODUCT_IMPORT_COLUMNS.slice(1))));
});

test('Excel reports existing slugs/SKUs and inactive/missing categories before any writes', async t => {
  const { db, sqlite } = fixture(t);
  await conflict(async () => importProducts(db, await workbook([input({ slug: 'blush-peony-bouquet' })]), false));
  await conflict(async () => importProducts(db, await workbook([input({ sku: 'BPB-S' })]), false));
  await invalid(async () => importProducts(db, await workbook([input({ category_id: 999 })]), false));
  sqlite.exec('UPDATE categories SET is_active=0 WHERE id=1');
  await invalid(async () => importProducts(db, await workbook([input()]), false));
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM products WHERE slug='excel-bouquet'").get().n, 0);
});

test('Excel rejects formula cells, corrupt files, oversized ZIP expansion and pathological row coordinates', async () => {
  await invalid(() => parseProductWorkbook(btoa('not an xlsx')));
  const bytes = Uint8Array.from(atob(await workbook([input()])), char => char.charCodeAt(0));
  const entries = unzipSync(bytes);
  const sheet = Object.keys(entries).find(key => key.startsWith('xl/worksheets/') && key.endsWith('.xml'));
  const original = strFromU8(entries[sheet]);
  for (const changed of [original.replace('<v>250000</v>', '<f>1+1</f><v>250000</v>'), original.replace('r="A2"', 'r="A1048576"')]) {
    assert.notEqual(changed, original);
    await invalid(() => parseProductWorkbook(encodeWorkbook(zipSync({ ...entries, [sheet]: strToU8(changed) }))));
  }
  const moved = { ...entries, 'xl/custom.xml': strToU8(original.replace('r="A2"', 'r="A1048576"')) };
  delete moved[sheet];
  moved['xl/_rels/workbook.xml.rels'] = strToU8(strFromU8(moved['xl/_rels/workbook.xml.rels']).replace(sheet.slice(3), 'custom.xml'));
  await assert.rejects(() => parseProductWorkbook(encodeWorkbook(zipSync(moved))), error => error.code === 'VALIDATION_ERROR' && /1000/.test(error.message));
  await invalid(() => parseProductWorkbook(encodeWorkbook(zipSync({ 'xl/worksheets/sheet1.xml': new Uint8Array(2 * 1024 * 1024 + 1) }))));
  assert.equal(productImportRequestSchema.safeParse({ file_name: 'bad.xls', content_base64: 'AAAA' }).success, false);
  assert.equal(productImportRequestSchema.safeParse({ file_name: 'bad.xlsx', content_base64: 'not base64' }).success, false);
});

test('Excel maximum 50 products/250 variants uses <=37 statements, <=100 binds; >limits write nothing', async t => {
  const { db, sqlite, queries } = fixture(t);
  const values = Array.from({ length: 50 }, (_, p) => ['S', 'M', 'L', 'STANDARD', 'DELUXE'].map(size => input({ slug: `bulk-${p}`, sku: `BULK-${p}-${size}`, size_code: size }))).flat();
  const base64 = await workbook(values);
  queries.length = 0;
  const result = await importProducts(db, base64, false);
  assert.equal(result.product_count, 50); assert.equal(result.variant_count, 250);
  assert.equal(queries.length, 37); assert.ok(queries.every(query => query.values.length <= 100));
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM product_variants WHERE sku LIKE 'BULK-%'").get().n, 250);
  await invalid(async () => importProducts(db, await workbook([...values, input({ slug: 'bulk-over-limit', sku: 'OVER' })]), false));
  await invalid(async () => importProducts(db, await workbook(Array.from({ length: 51 }, (_, i) => input({ slug: `over-${i}`, sku: `OVER-${i}` }))), false));
});

test('Excel concurrent SKU conflict rolls back all imported products and variants without retry', async t => {
  const { db, sqlite } = fixture(t);
  let batches = 0;
  const racing = { ...db, async batch(statements) {
    batches++;
    sqlite.prepare('INSERT INTO product_variants(product_id,sku,size_code,price) VALUES(1,?,\'DELUXE\',1)').run('EXCEL-M');
    return db.batch(statements);
  } };
  await conflict(async () => importProducts(racing, await workbook([input(), input({ slug: 'excel-other', sku: 'EXCEL-M' })]), false));
  assert.equal(batches, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM products WHERE slug LIKE 'excel-%'").get().n, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM product_variants WHERE sku='EXCEL-S'").get().n, 0);
});

test('Excel admin API requires cookie, same origin and JSON, downloads current template and supports validation/commit', async t => {
  const { db } = fixture(t);
  const env = { DB: db, ADMIN_PASSWORD: 'synthetic-import-password-with-24-characters', JWT_SECRET: 'synthetic-import-signing-secret-more-than-32-characters' };
  const cookie = `lunara_admin=${await signSession(env)}`;
  const url = 'https://example.test/api/admin/products/import';
  const payload = { file_name: 'products.xlsx', content_base64: await workbook([input()]), validate_only: true };
  const post = (headers, body = payload) => app.request(url, { method: 'POST', headers, body: JSON.stringify(body) }, env);
  assert.equal((await post({})).status, 401);
  assert.equal((await post({ cookie, 'Content-Type': 'application/json' })).status, 403);
  assert.equal((await post({ cookie, Origin: 'https://other.test', 'Content-Type': 'application/json' })).status, 403);
  assert.equal((await post({ cookie, Origin: 'https://example.test', 'Content-Type': 'multipart/form-data' })).status, 400);
  assert.equal((await app.request('https://example.test/api/admin/products/import-template', {}, env)).status, 401);
  const template = await app.request('https://example.test/api/admin/products/import-template', { headers: { cookie } }, env);
  assert.equal(template.status, 200); assert.equal(template.headers.get('Cache-Control'), 'no-store');
  const file = (await template.json()).data; assert.match(file.file_name, /\.xlsx$/);
  assert.equal((await readSheet(Uint8Array.from(atob(file.content_base64), char => char.charCodeAt(0)).buffer, 'Categories')).length, 5);
  const headers = { cookie, Origin: 'https://example.test', 'Content-Type': 'application/json' };
  assert.equal((await post(headers)).status, 200);
  assert.equal((await post(headers, { ...payload, validate_only: false })).status, 201);
  assert.equal((await post(headers, { ...payload, validate_only: false })).status, 409);
  assert.equal((await post(headers, { ...payload, content_base64: 'A'.repeat(1_400_001) })).status, 400);
});

test('Excel import and late conflict rollback run on isolated real workerd D1', async () => {
  const platform = await getPlatformProxy({ configPath: fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)),
    envFiles: [fileURLToPath(new URL('../.dev.vars.example', import.meta.url))], persist: false, remoteBindings: false });
  try {
    const db = platform.env.DB;
    for (const file of ['../migrations/0001_mvp.sql', '../migrations/0002_category_images.sql', '../migrations/0003_hanoi_administrative_areas.sql', '../docs/sql/MVP_SEED_DEV.sql']) {
      await db.batch(splitSqlQuery(readFileSync(new URL(file, import.meta.url), 'utf8')).map(sql => db.prepare(sql)));
    }
    const result = await importProducts(db, await workbook([input()]), false);
    assert.equal(result.product_count, 1);
    assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM product_variants WHERE sku='EXCEL-S'").first('n'), 1);
    await db.prepare("CREATE TRIGGER import_failure BEFORE INSERT ON product_variants WHEN NEW.sku='LATE-FAIL' BEGIN SELECT RAISE(ABORT,'UNIQUE constraint failed: product_variants.sku'); END").run();
    await conflict(async () => importProducts(db, await workbook([input({ slug: 'rolled-back', sku: 'LATE-FAIL' })]), false));
    assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM products WHERE slug='rolled-back'").first('n'), 0);
  } finally { await platform.dispose(); }
});
