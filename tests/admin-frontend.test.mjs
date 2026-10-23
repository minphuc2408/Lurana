import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedAdminTransitions, buildProductSlug, buildVariantPatch, rebaseVariantDraft, variantDraft } from '../src/features/admin/admin-api.adapters.ts';
import { formatVietnamDate } from '../src/shared/lib/format.ts';

test('compact admin dates keep Vietnam time and full calendar dates without changing the storefront format', () => {
  for (const locale of ['en', 'vi']) {
    assert.equal(formatVietnamDate('2026-10-22', locale, { compact: true }), '22/10/2026');
    const timestamp = formatVietnamDate('2026-10-21T23:15:00Z', locale, { compact: true });
    assert.ok(timestamp.includes('22/10/2026'));
    assert.ok(timestamp.includes('06:15'));
    assert.notEqual(formatVietnamDate('2026-10-22', locale), '22/10/2026');
  }
  assert.equal(formatVietnamDate('invalid', 'vi', { compact: true }), 'invalid');
});

test('automatic product slugs normalize Vietnamese, punctuation and long or non-Latin names', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  assert.equal(buildProductSlug(' Bó Đỗ Quyên & Hoa Hồng! ', id), `bo-do-quyen-hoa-hong-${id}`);
  assert.equal(buildProductSlug('🌸', id), `product-${id}`);
  assert.equal(buildProductSlug('', id), `product-${id}`);
  for (const name of ['A'.repeat(300), 'Bó hoa - '.repeat(40), '花']) {
    const slug = buildProductSlug(name, id);
    assert.ok(slug.length <= 200);
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
});

test('products with the same name receive separate automatic slugs', () => {
  const first = buildProductSlug('Rose Bouquet');
  const second = buildProductSlug('Rose Bouquet');
  assert.notEqual(first, second);
  assert.match(first, /^rose-bouquet-[a-f0-9-]{36}$/);
});
import { patchAdminVariant } from '../worker/services/admin-catalog.ts';
import { createTestDb } from './helpers/worker.mjs';

const variant = { id: 1, product_id: 1, sku: 'TEST-S', size_code: 'S', price: 450000,
  compare_at_price: 500000, stock_quantity: 8, low_stock_threshold: 5, is_active: true };

test('admin actions follow the legal COD path and terminal orders expose no transition', () => {
  assert.deepEqual(allowedAdminTransitions('PENDING'), ['CONFIRMED', 'CANCELLED']);
  assert.deepEqual(allowedAdminTransitions('CONFIRMED'), ['PREPARING', 'CANCELLED']);
  assert.deepEqual(allowedAdminTransitions('PREPARING'), ['IN_TRANSIT', 'CANCELLED']);
  assert.deepEqual(allowedAdminTransitions('IN_TRANSIT'), ['DELIVERED', 'CANCELLED']);
  assert.deepEqual(allowedAdminTransitions('DELIVERED'), []);
  assert.deepEqual(allowedAdminTransitions('CANCELLED'), []);
});

test('unchanged variant controls are omitted; a stock edit sends only an atomic delta', () => {
  assert.deepEqual(buildVariantPatch(variant, variantDraft(variant)), {});
  assert.deepEqual(buildVariantPatch(variant, { ...variantDraft(variant), stock_delta: '-2' }), { stock_delta: -2 });
  const noCompare = { ...variant, compare_at_price: null };
  assert.deepEqual(buildVariantPatch(noCompare, variantDraft(noCompare)), {});
});

test('stock edit built from an old UI snapshot preserves a newer server price and stock', async t => {
  const harness = createTestDb();
  t.after(() => harness.close());
  const patch = buildVariantPatch(variant, { ...variantDraft(variant), stock_delta: '3' });
  harness.sqlite.prepare('UPDATE product_variants SET price = ?, compare_at_price = ?, stock_quantity = ? WHERE id = ?').run(480000, 550000, 9, 1);
  await patchAdminVariant(harness.db, 1, patch);
  const current = harness.sqlite.prepare('SELECT price, compare_at_price, stock_quantity FROM product_variants WHERE id = 1').get();
  assert.deepEqual({ ...current }, { price: 480000, compare_at_price: 550000, stock_quantity: 12 });
});

test('explicit price/compare/threshold/active edits do not include an absolute stock count', () => {
  const patch = buildVariantPatch(variant, { ...variantDraft(variant), price: '460000', compare_at_price: '', low_stock_threshold: '2', is_active: false });
  assert.deepEqual(patch, { price: 460000, compare_at_price: null, low_stock_threshold: 2, is_active: false });
  assert.equal(Object.hasOwn(patch, 'stock_quantity'), false);
});

test('variant editor rejects invalid or unsafe integer input before sending a write', () => {
  for (const price of ['', '-1', '12.5', 'Infinity', '9007199254740992']) {
    assert.throws(() => buildVariantPatch(variant, { ...variantDraft(variant), price }), error => error.code === 'VALIDATION_ERROR');
  }
  for (const stock_delta of ['1.1', 'NaN', '-9007199254740992']) {
    assert.throws(() => buildVariantPatch(variant, { ...variantDraft(variant), stock_delta }), error => error.code === 'VALIDATION_ERROR');
  }
});

test('rechecking an ambiguous stock write clears its delta and preserves only explicit non-stock edits', () => {
  const fresh = { ...variant, price: 480000, compare_at_price: 550000, stock_quantity: 11 };
  assert.deepEqual(rebaseVariantDraft(variant, { ...variantDraft(variant), stock_delta: '3' }, fresh, true), variantDraft(fresh));
  assert.equal(rebaseVariantDraft(variant, { ...variantDraft(variant), stock_delta: '3' }, fresh).stock_delta, '3', 'Unsubmitted adjustments on other rows survive a refresh');
  const rebased = rebaseVariantDraft(variant, { ...variantDraft(variant), price: '460000', low_stock_threshold: '2', stock_delta: '3', is_active: false }, fresh, true);
  assert.deepEqual(rebased, { ...variantDraft(fresh), price: '460000', low_stock_threshold: '2', is_active: false });
  assert.deepEqual(buildVariantPatch(fresh, rebased), { price: 460000, low_stock_threshold: 2, is_active: false });
});
