import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';

// Never accept a remote target, alternate config, or caller-supplied SQL.
assert.equal(process.argv.length, 2, 'db:verify accepts no arguments and only uses local D1.');
const root = fileURLToPath(new URL('../', import.meta.url));
const configPath = path.join(root, 'wrangler.jsonc');
const schema = readFileSync(path.join(root, 'migrations/0001_mvp.sql'), 'utf8');
const imageSchema = readFileSync(path.join(root, 'migrations/0002_category_images.sql'), 'utf8');
const seed = readFileSync(path.join(root, 'docs/sql/MVP_SEED_DEV.sql'), 'utf8');
const tables = [
  'categories', 'delivery_zones', 'order_items', 'order_status_history', 'orders',
  'product_images', 'product_variants', 'products', 'user_addresses', 'users',
];
const expectedCounts = { categories: 4, products: 8, product_variants: 24, product_images: 8, delivery_zones: 4 };
const schemaQuery = `SELECT type, name, tbl_name, sql FROM sqlite_master
  WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'
  AND name NOT LIKE '_cf_%' AND tbl_name != 'd1_migrations' ORDER BY type, name`;
let assertions = 0;
let passed = 0;
let failed = 0;

function equal(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  assertions++;
}

function statement(db, sql, values = []) {
  const prepared = db.prepare(sql);
  return values.length ? prepared.bind(...values) : prepared;
}

async function rows(db, sql, values) {
  return (await statement(db, sql, values).all()).results;
}

async function run(db, sql, values) {
  return statement(db, sql, values).run();
}

async function rejects(action, constraint) {
  await assert.rejects(action, constraint);
  assertions++;
}

async function group(number, name, action) {
  try {
    await action();
    passed++;
    console.log(`PASS ${String(number).padStart(2, '0')}/13 ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${String(number).padStart(2, '0')}/13 ${name}: ${error.message}`);
  }
}

// Wrangler's installed SQL splitter handles comments, quoted strings and semicolons.
// Execute trusted repository migration/seed only; test values below always use binds.
async function apply(db, sql) {
  const statements = splitSqlQuery(sql);
  assert.ok(statements.length, 'SQL file must contain executable statements');
  await db.batch(statements.map(query => db.prepare(query)));
}

async function counts(db) {
  const result = {};
  for (const table of Object.keys(expectedCounts)) {
    result[table] = (await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first()).count;
  }
  return result;
}

async function snapshot(db) {
  const result = {};
  // Table names are the fixed allowlist above, never input.
  for (const table of tables) result[table] = await rows(db, `SELECT * FROM ${table} ORDER BY id`);
  return result;
}

async function checkStructure(db) {
  equal((await rows(db, `SELECT name FROM sqlite_master WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'
    AND name != 'd1_migrations' ORDER BY name`)).map(row => row.name), tables, 'exactly 10 MVP tables');
  equal(await rows(db, 'PRAGMA foreign_key_check'), [], 'foreign keys');
}

function order(db, number, overrides = {}) {
  const values = {
    order_number: number, idempotency_key: null,
    sender_name: 'Demo sender', sender_phone: '0900000000',
    recipient_name: 'Demo recipient', recipient_phone: '0911111111',
    province_name: 'Demo province', ward_name: 'Demo ward', address_line: 'Demo street',
    delivery_date: '2026-10-20', delivery_time_slot: '08:00-10:00',
    subtotal: 1000, discount_total: 0, delivery_fee: 0, grand_total: 1000,
    payment_method: 'COD', ...overrides,
  };
  return statement(db, `INSERT INTO orders (${Object.keys(values).join(', ')})
    VALUES (${Object.keys(values).map(() => '?').join(', ')})`, Object.values(values));
}

async function verify() {
  console.log('D1 LOCAL ONLY: remoteBindings=false; persisted database is read-only in this verifier.');
  console.log(`Canonical SHA-256: ${createHash('sha256').update(schema).digest('hex')}`);
  for (const file of ['docs/sql/MVP_SCHEMA.sql', 'docs/pipeline/MVP_SCHEMA.sql']) {
    const pointer = readFileSync(path.join(root, file), 'utf8');
    assert.ok(pointer.includes('../../migrations/0001_mvp.sql'), `${file} must point to canonical`);
    assert.doesNotMatch(pointer, /CREATE\s+(TABLE|INDEX)/i, `${file} must not duplicate DDL`);
  }

  // Default persistence is shared with wrangler d1 ... --local, without changing its data.
  let localSchema;
  const local = await getPlatformProxy({ configPath, remoteBindings: false });
  try {
    const db = local.env.DB;
    await checkStructure(db);
    equal(await counts(db), expectedCounts, 'seed counts in persisted local D1');
    const migrations = await rows(db, 'SELECT name FROM d1_migrations ORDER BY id');
    equal(migrations, [{ name: '0001_mvp.sql' }, { name: '0002_category_images.sql' }], 'base and category-image migrations recorded');
    localSchema = await rows(db, schemaQuery);
    console.log(`LOCAL migration: ${JSON.stringify(migrations)}; seed: ${JSON.stringify(await counts(db))}`);
    console.log('LOCAL foreign_key_check: []; business tables: 10');
  } finally {
    await local.dispose();
  }

  // Destructive cases use actual local workerd D1 bindings with persistence disabled.
  // No fixture writes or deletes touch .wrangler/state or a remote database.
  const isolated = await getPlatformProxy({ configPath, persist: false, remoteBindings: false });
  try {
    const db = isolated.env.DB;
    await apply(db, schema);
    await apply(db, imageSchema);
    equal(await rows(db, schemaQuery), localSchema, 'persisted local schema matches the migration chain');
    await apply(db, seed);
    equal(await counts(db), expectedCounts, 'initial isolated seed');

    await group(1, 'order total formula and discount CHECK', async () => {
      await rejects(() => order(db, 'BAD-TOTAL', { grand_total: 999 }).run(), /CHECK constraint failed: chk_order_total/);
      await rejects(() => order(db, 'BAD-DISCOUNT', { discount_total: 2000, grand_total: 0 }).run(), /CHECK constraint failed: chk_order_discount/);
      await order(db, 'GOOD-TOTAL', { discount_total: 200, delivery_fee: 350, grand_total: 1150 }).run();
      equal((await db.prepare('SELECT grand_total FROM orders WHERE order_number = ?').bind('GOOD-TOTAL').first()).grand_total, 1150);
    });

    await group(2, 'delivery_date YYYY-MM-DD shape CHECK', async () => {
      for (const date of ['2026-1-5', '2026-10-200', 'abcd-10-20']) {
        await rejects(() => order(db, `BAD-DATE-${date}`, { delivery_date: date }).run(), /CHECK constraint failed:.*delivery_date/);
      }
    });

    await group(3, 'unique idempotency_key; multiple NULL keys allowed', async () => {
      await order(db, 'KEY-1', { idempotency_key: 'demo-idempotency-key' }).run();
      await rejects(() => order(db, 'KEY-2', { idempotency_key: 'demo-idempotency-key' }).run(), /UNIQUE constraint failed: orders.idempotency_key/);
      await order(db, 'NULL-KEY-1').run();
      await order(db, 'NULL-KEY-2').run();
      equal((await db.prepare('SELECT COUNT(*) AS count FROM orders WHERE order_number IN (?, ?) AND idempotency_key IS NULL')
        .bind('NULL-KEY-1', 'NULL-KEY-2').first()).count, 2);
    });

    await group(4, 'duplicate order_number rejected', async () => {
      await order(db, 'UNIQUE-NUMBER').run();
      await rejects(() => order(db, 'UNIQUE-NUMBER').run(), /UNIQUE constraint failed: orders.order_number/);
    });

    await group(5, 'oversell CHECK rolls back real D1 batch: order/items/history/stock', async () => {
      const variant = await db.prepare('SELECT * FROM product_variants WHERE sku = ?').bind('BPB-L').first();
      const beforeOrders = await rows(db, 'SELECT * FROM orders ORDER BY id');
      const beforeItems = await rows(db, 'SELECT * FROM order_items ORDER BY id');
      const beforeHistory = await rows(db, 'SELECT * FROM order_status_history ORDER BY id');
      const quantity = variant.stock_quantity + 1;
      await rejects(() => db.batch([
        order(db, 'ROLLBACK-ORDER', { idempotency_key: 'rollback-key' }),
        statement(db, `INSERT INTO order_items
          (order_id, product_id, variant_id, sku_snapshot, name_vi_snapshot, name_en_snapshot, size_snapshot, unit_price, quantity, line_total)
          SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM orders WHERE order_number = ?`,
        [variant.product_id, variant.id, variant.sku, 'Demo hoa', 'Demo flower', variant.size_code, 1000, quantity, 1000 * quantity, 'ROLLBACK-ORDER']),
        statement(db, `INSERT INTO order_status_history (order_id, to_status)
          SELECT id, ? FROM orders WHERE order_number = ?`, ['PENDING', 'ROLLBACK-ORDER']),
        statement(db, 'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, variant.id]),
      ]), /CHECK constraint failed: stock_quantity >= 0/);
      equal(await rows(db, 'SELECT * FROM orders ORDER BY id'), beforeOrders, 'order rolled back');
      equal(await rows(db, 'SELECT * FROM order_items ORDER BY id'), beforeItems, 'items rolled back');
      equal(await rows(db, 'SELECT * FROM order_status_history ORDER BY id'), beforeHistory, 'history rolled back');
      equal(await db.prepare('SELECT * FROM product_variants WHERE id = ?').bind(variant.id).first(), variant, 'stock intact');
      // A valid batch is a positive control: the failed case must be a CHECK, not broken setup.
      await db.batch([
        order(db, 'VALID-BATCH'),
        statement(db, 'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?', [1, variant.id]),
      ]);
      equal((await db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').bind(variant.id).first()).stock_quantity, variant.stock_quantity - 1);
      equal((await db.prepare('SELECT COUNT(*) AS count FROM orders WHERE order_number = ?').bind('VALID-BATCH').first()).count, 1);
      await run(db, 'UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [variant.stock_quantity, variant.id]);
    });

    await group(6, 'line_total = unit_price * quantity CHECK', async () => {
      const sql = `INSERT INTO order_items (order_id, sku_snapshot, name_vi_snapshot, name_en_snapshot,
        size_snapshot, unit_price, quantity, line_total)
        SELECT id, ?, ?, ?, ?, ?, ?, ? FROM orders WHERE order_number = ?`;
      const values = ['DEMO-SKU', 'Demo hoa', 'Demo flower', 'S', 1000, 2, 5, 'UNIQUE-NUMBER'];
      await rejects(() => run(db, sql, values), /CHECK constraint failed: chk_line_total/);
      values[6] = 2000;
      await run(db, sql, values);
      equal((await db.prepare('SELECT line_total FROM order_items WHERE sku_snapshot = ?').bind('DEMO-SKU').first()).line_total, 2000);
    });

    await group(7, 'one primary image/product and default address/user', async () => {
      const product = await db.prepare('SELECT id FROM products WHERE slug = ?').bind('blush-peony-bouquet').first();
      const imageSql = 'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)';
      await rejects(() => run(db, imageSql, [product.id, 'https://example.test/primary.png', 1]), /UNIQUE constraint failed: product_images.product_id/);
      await run(db, imageSql, [product.id, 'https://example.test/extra-1.png', 0]);
      await run(db, imageSql, [product.id, 'https://example.test/extra-2.png', 0]);
      await run(db, 'INSERT INTO users (email, full_name) VALUES (?, ?)', ['demo@example.test', 'Demo user']);
      const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind('demo@example.test').first();
      const addressSql = `INSERT INTO user_addresses
        (user_id, recipient_name, recipient_phone, province_name, ward_name, address_line, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const address = [user.id, 'Demo recipient', '0900000000', 'Demo province', 'Demo ward', 'Demo street', 1];
      await run(db, addressSql, address);
      await rejects(() => run(db, addressSql, address), /UNIQUE constraint failed: user_addresses.user_id/);
      address[6] = 0;
      await run(db, addressSql, address);
      await run(db, addressSql, address);
      equal((await db.prepare('SELECT COUNT(*) AS count FROM user_addresses WHERE user_id = ? AND is_default = 0').bind(user.id).first()).count, 2);
      await run(db, 'DELETE FROM product_images WHERE product_id = ? AND is_primary = 0', [product.id]);
    });

    await group(8, 'variant price, unique product/size and valid size CHECK', async () => {
      const variant = await db.prepare('SELECT * FROM product_variants WHERE sku = ?').bind('BPB-S').first();
      await rejects(() => run(db, 'UPDATE product_variants SET compare_at_price = ? WHERE id = ?', [variant.price - 1, variant.id]), /CHECK constraint failed:.*compare_at_price/);
      const sql = 'INSERT INTO product_variants (product_id, sku, size_code, price) VALUES (?, ?, ?, ?)';
      await rejects(() => run(db, sql, [variant.product_id, 'DEMO-DUPLICATE', variant.size_code, 1000]), /UNIQUE constraint failed: product_variants.product_id, product_variants.size_code/);
      await rejects(() => run(db, sql, [variant.product_id, 'DEMO-XL', 'XL', 1000]), /CHECK constraint failed:.*size_code/);
      await run(db, 'UPDATE product_variants SET compare_at_price = ? WHERE id = ?', [variant.price, variant.id]);
      await run(db, 'UPDATE product_variants SET compare_at_price = ? WHERE id = ?', [variant.compare_at_price, variant.id]);
    });

    await group(9, 'lowercase and unique email', async () => {
      const sql = 'INSERT INTO users (email, full_name) VALUES (?, ?)';
      await rejects(() => run(db, sql, ['UPPER@example.test', 'Demo']), /CHECK constraint failed: email = lower\(email\)/);
      await run(db, sql, ['unique@example.test', 'Demo']);
      await rejects(() => run(db, sql, ['unique@example.test', 'Demo duplicate']), /UNIQUE constraint failed: users.email/);
    });

    await group(10, 'COD only', async () => {
      await rejects(() => order(db, 'NON-COD', { payment_method: 'MOMO' }).run(), /CHECK constraint failed:.*payment_method/);
    });

    await group(11, 'hard delete preserves every order snapshot; product/variant FKs become NULL', async () => {
      const category = await db.prepare('SELECT id FROM categories WHERE code = ?').bind('bouquets').first();
      await run(db, 'INSERT INTO products (category_id, slug, name_vi, name_en) VALUES (?, ?, ?, ?)', [category.id, 'demo-delete-product', 'Demo hoa', 'Demo flower']);
      const product = await db.prepare('SELECT id FROM products WHERE slug = ?').bind('demo-delete-product').first();
      await run(db, 'INSERT INTO product_variants (product_id, sku, size_code, price) VALUES (?, ?, ?, ?)', [product.id, 'DEMO-DELETE-S', 'S', 1000]);
      await run(db, 'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)', [product.id, 'https://example.test/snapshot.png', 1]);
      const variant = await db.prepare('SELECT id FROM product_variants WHERE sku = ?').bind('DEMO-DELETE-S').first();
      await run(db, `INSERT INTO order_items
        (order_id, product_id, variant_id, sku_snapshot, name_vi_snapshot, name_en_snapshot, size_snapshot,
        image_url_snapshot, unit_price, quantity, line_total)
        SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM orders WHERE order_number = ?`,
      [product.id, variant.id, 'DEMO-DELETE-S', 'Demo hoa', 'Demo flower', 'S', 'https://example.test/snapshot.png', 1000, 2, 2000, 'UNIQUE-NUMBER']);
      const before = await db.prepare('SELECT * FROM order_items WHERE sku_snapshot = ?').bind('DEMO-DELETE-S').first();
      await run(db, 'DELETE FROM products WHERE id = ?', [product.id]);
      equal(await db.prepare('SELECT * FROM order_items WHERE id = ?').bind(before.id).first(), { ...before, product_id: null, variant_id: null });
      equal(await rows(db, 'SELECT id FROM product_variants WHERE product_id = ?', [product.id]), []);
      equal(await rows(db, 'SELECT id FROM product_images WHERE product_id = ?', [product.id]), []);
    });

    await group(12, 'category delete RESTRICT with products', async () => {
      const before = await rows(db, 'SELECT * FROM categories ORDER BY id');
      await rejects(() => run(db, 'DELETE FROM categories WHERE code = ?', ['bouquets']), /FOREIGN KEY constraint failed/);
      equal(await rows(db, 'SELECT * FROM categories ORDER BY id'), before);
    });

    await group(13, 'raw 0001 reapplies; seed twice leaves business rows unchanged', async () => {
      const beforeSchema = await rows(db, schemaQuery);
      const beforeData = await snapshot(db);
      await apply(db, schema);
      equal(await rows(db, schemaQuery), beforeSchema, 'raw migration idempotent');
      equal(await snapshot(db), beforeData, 'migration preserves data');
      await apply(db, seed);
      await apply(db, seed);
      equal(await snapshot(db), beforeData, 'seed does not duplicate or overwrite any business row');
      equal(await counts(db), expectedCounts, 'seed includes 8 primary images');
    });

    // Check additional v2 delivery constraints without adding another numbered group.
    await rejects(() => run(db, 'INSERT INTO delivery_zones (province_name, ward_name, fee) VALUES (?, ?, ?)',
      ['Thành phố Hà Nội', '', 1]), /UNIQUE constraint failed: delivery_zones.province_name, delivery_zones.ward_name/);
    await rejects(() => run(db, 'UPDATE delivery_zones SET fee = ? WHERE province_name = ?', [-1, 'Thành phố Hà Nội']), /CHECK constraint failed: fee >= 0/);
    await checkStructure(db);
    console.log(`D1 LOCAL constraints: ${passed}/13 groups passed; ${failed} failed; ${assertions} assertions.`);
    console.log('Deferred/0002 was not loaded. Persisted local seed was not modified by destructive cases.');
    if (failed) process.exitCode = 1;
  } finally {
    await isolated.dispose();
  }
}

try {
  await verify();
} catch (error) {
  console.error(`db:verify FAILED: ${error.stack}`);
  process.exitCode = 1;
}
