import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, phoneSchema, quoteSchema } from '../shared/schemas.ts';
import { parseSchema } from '../worker/lib/validate.ts';
import { todayInVN, toIso, validateDeliverySlot } from '../worker/lib/datetime.ts';

test('Vietnamese phones normalize +84, spaces and dots; reject other shapes', () => {
  for (const value of ['0901234567', '+84 901.234.567', ' 090 123 4567 ']) {
    assert.equal(normalizePhone(value), '0901234567');
    assert.equal(phoneSchema.parse(value), '0901234567');
  }
  for (const value of ['+63 901234567', '901234567', '09012345678', '+84abc123456', '090-123-4567']) {
    assert.equal(phoneSchema.safeParse(value).success, false);
  }
});

test('quote validation trims addresses and discards client prices/totals/roles', () => {
  const quote = parseSchema(quoteSchema, {
    items: [{ variant_id: 1, quantity: 2, price: 1, stock_quantity: 999 }],
    province_name: ' Thành phố Hà Nội ', ward_name: ' Phường Hoàn Kiếm ',
    delivery_method_code: 'STANDARD', subtotal: 1, delivery_fee: 0, total: 1, role: 'ADMIN',
  });
  assert.deepEqual(quote, { items: [{ variant_id: 1, quantity: 2 }], province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', delivery_method_code: 'STANDARD' });
});

test('cart validation separates invalid input from limits', () => {
  const body = { items: [{ variant_id: 1, quantity: 1 }], province_name: 'Tỉnh', ward_name: 'Phường', delivery_method_code: 'STANDARD' };
  for (const items of [[], [{ variant_id: 0, quantity: 1 }], [{ variant_id: 1, quantity: 0 }], [{ variant_id: 1, quantity: 1.5 }], [{ variant_id: '1', quantity: 1 }]]) {
    assert.throws(() => parseSchema(quoteSchema, { ...body, items }), error => error.code === 'VALIDATION_ERROR' && error.status === 400 && Array.isArray(error.details));
  }
  for (const items of [Array.from({ length: 16 }, (_, i) => ({ variant_id: i + 1, quantity: 1 })), [{ variant_id: 1, quantity: 21 }]]) {
    assert.throws(() => parseSchema(quoteSchema, { ...body, items }), error => error.code === 'CART_LIMIT' && error.status === 422);
  }
});

test('Vietnam local day and SQLite timestamps do not depend on the host timezone', () => {
  assert.equal(todayInVN(new Date('2026-10-13T16:59:59Z')), '2026-10-13');
  assert.equal(todayInVN(new Date('2026-10-13T17:00:00Z')), '2026-10-14');
  assert.equal(toIso('2026-10-14 03:20:00'), '2026-10-14T03:20:00.000Z');
  assert.equal(toIso('2026-10-14T03:20:00Z'), '2026-10-14T03:20:00.000Z');
});

test('delivery rejects past dates, impossible dates, invalid slots and more than 30 days', () => {
  const now = new Date('2026-10-14T03:00:00Z'); // 10:00 in Vietnam.
  for (const [date, slot] of [['2026-10-13', '12:00-14:00'], ['2026-02-30', '12:00-14:00'], ['2026-2-3', '12:00-14:00'], ['2026-11-14', '12:00-14:00'], ['2026-10-14', '11:00-13:00'], ['2026-10-14', '08:00-10:00']]) {
    assert.throws(() => validateDeliverySlot(date, slot, 'STANDARD', now), error => error.code === 'INVALID_DELIVERY_SLOT' && error.status === 422);
  }
  assert.doesNotThrow(() => validateDeliverySlot('2026-10-14', '12:00-14:00', 'STANDARD', now));
  assert.doesNotThrow(() => validateDeliverySlot('2026-11-13', '08:00-10:00', 'STANDARD', now));
  assert.doesNotThrow(() => validateDeliverySlot('2026-10-14', '10:00-12:00', 'STANDARD', now));
  assert.throws(() => validateDeliverySlot('2026-10-14', '12:00-14:00', 'EXPRESS', new Date(now.getTime() + 1)), /Ngày hoặc khung giờ/);
});

test('urgent methods require today, before 16:00 and at least 120 preparation minutes', () => {
  for (const method of ['EXPRESS', 'SAME_DAY']) {
    assert.doesNotThrow(() => validateDeliverySlot('2026-10-14', '18:00-20:00', method, new Date('2026-10-14T08:59:59Z')));
    assert.throws(() => validateDeliverySlot('2026-10-14', '18:00-20:00', method, new Date('2026-10-14T09:00:00Z')), /Ngày hoặc khung giờ/);
    assert.throws(() => validateDeliverySlot('2026-10-15', '12:00-14:00', method, new Date('2026-10-14T03:00:00Z')), /Ngày hoặc khung giờ/);
    assert.throws(() => validateDeliverySlot('2026-10-14', '12:00-14:00', method, new Date('2026-10-14T04:00:00Z')), /Ngày hoặc khung giờ/);
  }
});
