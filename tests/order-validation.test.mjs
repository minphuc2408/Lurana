import test from 'node:test';
import assert from 'node:assert/strict';
import { orderSchema, lookupOrderSchema } from '../shared/schemas.ts';
import { parseSchema } from '../worker/lib/validate.ts';

const validOrder = () => ({
  items: [{ variant_id: 1, quantity: 2 }],
  sender: { name: 'Demo người đặt', phone: '0901234567', is_anonymous: false },
  recipient: {
    name: 'Demo người nhận', phone: '0912345678', province_name: 'Thành phố Hà Nội',
    ward_name: 'Phường Hoàn Kiếm', address_line: '123 đường Demo',
  },
  delivery: { method_code: 'STANDARD', date: '2026-10-15', time_slot: '08:00-10:00' },
  card: { type: 'NONE' },
});

test('order validation normalizes contact fields and strips every client price/role field', () => {
  const body = validOrder();
  Object.assign(body, { price: 1, subtotal: 1, delivery_fee: 0, grand_total: 1, role: 'ADMIN', stock_released: 1 });
  Object.assign(body.items[0], { price: 1, unit_price: 1, line_total: 2 });
  Object.assign(body.sender, { name: ' Demo người đặt ', phone: '+84 901.234.567', email: ' Demo@example.test ', role: 'ADMIN' });
  Object.assign(body.recipient, { name: ' Demo người nhận ', phone: ' 091 234.5678 ', province_name: ' Thành phố Hà Nội ', ward_name: ' Phường Hoàn Kiếm ', address_line: ' 123 đường Demo ' });
  Object.assign(body.delivery, { fee: 0, currency: 'USD' });
  Object.assign(body.card, { price: 0 });
  body.customer_note = '  Giữ nguyên lời khách nhập.\nPlease ring once.  ';
  const parsed = parseSchema(orderSchema, body);
  assert.deepEqual(parsed, { ...validOrder(), sender: { ...validOrder().sender, email: 'Demo@example.test' }, customer_note: body.customer_note });
});

test('order requires valid names, phones, email, address and a boolean anonymous flag', () => {
  const invalid = [
    ['sender', 'name', '   '], ['sender', 'name', 'a'.repeat(101)],
    ['recipient', 'name', ''], ['sender', 'phone', '+63 901234567'],
    ['recipient', 'phone', '123'], ['sender', 'email', 'not-an-email'],
    ['sender', 'is_anonymous', 'false'], ['recipient', 'address_line', '1234'],
    ['recipient', 'address_line', 'a'.repeat(201)], ['recipient', 'province_name', ' '],
    ['recipient', 'ward_name', 'a'.repeat(101)],
  ];
  for (const [section, field, value] of invalid) {
    const body = validOrder();
    body[section][field] = value;
    assert.throws(() => parseSchema(orderSchema, body), error =>
      error.code === 'VALIDATION_ERROR' && error.status === 400
      && error.details.some(issue => issue.path === `${section}.${field}`));
  }
  const boundaries = validOrder();
  boundaries.sender.name = 'a'.repeat(100);
  boundaries.recipient.address_line = 'a'.repeat(200);
  boundaries.sender.is_anonymous = true;
  assert.equal(orderSchema.safeParse(boundaries).success, true);
});

test('greeting cards and banners require nonblank messages, and preserve customer text', () => {
  for (const type of ['GREETING_CARD', 'BANNER']) {
    for (const message of [undefined, '', '  \n  ', 'a'.repeat(201)]) {
      assert.equal(orderSchema.safeParse({ ...validOrder(), card: { type, message } }).success, false);
    }
    const message = '  Chúc mừng!\nHappy birthday!  ';
    assert.equal(orderSchema.parse({ ...validOrder(), card: { type, message } }).card.message, message);
    assert.equal(orderSchema.safeParse({ ...validOrder(), card: { type, message: 'a'.repeat(200) } }).success, true);
  }
  assert.equal(orderSchema.safeParse({ ...validOrder(), card: { type: 'NONE' } }).success, true);
  assert.equal(orderSchema.safeParse({ ...validOrder(), card: { type: 'OTHER' } }).success, false);
});

test('order retains CART_LIMIT errors and enforces customer note bounds', () => {
  for (const items of [Array.from({ length: 16 }, (_, i) => ({ variant_id: i + 1, quantity: 1 })), [{ variant_id: 1, quantity: 21 }]]) {
    assert.throws(() => parseSchema(orderSchema, { ...validOrder(), items }), error => error.code === 'CART_LIMIT' && error.status === 422);
  }
  for (const items of [[], [{ variant_id: 1, quantity: 0 }], [{ variant_id: '1', quantity: 1 }]]) {
    assert.throws(() => parseSchema(orderSchema, { ...validOrder(), items }), error => error.code === 'VALIDATION_ERROR' && error.status === 400);
  }
  assert.equal(orderSchema.safeParse({ ...validOrder(), customer_note: 'a'.repeat(500) }).success, true);
  assert.equal(orderSchema.safeParse({ ...validOrder(), customer_note: 'a'.repeat(501) }).success, false);
});

test('lookup normalizes phone and order number without exposing extra client fields', () => {
  assert.deepEqual(lookupOrderSchema.parse({ order_number: ' LNR-261014-K7QX2M ', phone: '+84 901.234.567', admin_note: 'fake', role: 'ADMIN' }), {
    order_number: 'LNR-261014-K7QX2M', phone: '0901234567',
  });
  assert.equal(lookupOrderSchema.safeParse({ order_number: 'wrong-code', phone: '0901234567' }).success, true);
  for (const body of [{ phone: '0901234567' }, { order_number: ' ' , phone: '0901234567' }, { order_number: 'LNR-261014-K7QX2M', phone: 'wrong' }]) {
    assert.equal(lookupOrderSchema.safeParse(body).success, false);
  }
});
