import test from 'node:test';
import assert from 'node:assert/strict';
import { canReviewCheckout, copySenderToRecipient, updateCheckoutForm } from '../src/features/cart/checkout-form.ts';

const form = { senderName: 'Demo sender', senderPhone: '0900000001', senderEmail: '', anonymous: false,
  recipientName: 'Demo recipient', recipientPhone: '0900000002', address: 'Demo street 123', date: '2026-10-17', slot: '08:00-10:00', cardType: 'NONE', cardMessage: '', note: '' };
const payload = () => ({ items: [{ variant_id: 1, quantity: 1 }],
  sender: { name: form.senderName, phone: form.senderPhone, is_anonymous: false },
  recipient: { name: form.recipientName, phone: form.recipientPhone, address_line: form.address, province_name: 'Thành phố Hà Nội', ward_name: 'Hoàn Kiếm' },
  delivery: { date: form.date, time_slot: form.slot, method_code: 'STANDARD' }, card: { type: 'NONE' } });
const options = { quoteReady: true, termsAccepted: true, payment: 'COD', today: '2026-10-16', latestDate: '2026-11-15', slots: ['08:00-10:00'] };

test('same recipient copies and continues syncing only name/phone while preserving delivery data', () => {
  const copied = copySenderToRecipient(form);
  assert.equal(copied.recipientName, form.senderName);
  assert.equal(copied.recipientPhone, form.senderPhone);
  assert.equal(copied.address, form.address);
  assert.equal(form.recipientName, 'Demo recipient');
  const renamed = updateCheckoutForm(copied, 'senderName', 'Updated demo', true);
  assert.equal(renamed.recipientName, 'Updated demo');
  const phone = updateCheckoutForm(renamed, 'senderPhone', '0900000003', true);
  assert.equal(phone.recipientPhone, '0900000003');
  assert.equal(updateCheckoutForm(phone, 'recipientName', 'Another demo', false).recipientName, 'Another demo');
  assert.equal(updateCheckoutForm(form, 'senderName', 'Separate demo', false).recipientName, form.recipientName);
});

test('explicit card choice accepts a message and choosing no card clears unsent text', () => {
  const selected = updateCheckoutForm(form, 'cardType', 'GREETING_CARD', false);
  const withMessage = updateCheckoutForm(selected, 'cardMessage', 'Demo greeting', false);
  assert.equal(withMessage.cardType, 'GREETING_CARD');
  const noCard = updateCheckoutForm(withMessage, 'cardType', 'NONE', false);
  assert.equal(noCard.cardMessage, '');
  assert.equal(updateCheckoutForm({ ...form, cardType: 'BANNER' }, 'cardMessage', 'Demo banner', false).cardType, 'BANNER');
});

test('review requires valid order details, live quote, explicit consent and supported payment', () => {
  assert.equal(canReviewCheckout(payload(), options), true);
  for (const override of [{ termsAccepted: false }, { quoteReady: false }, { payment: 'BANK_TRANSFER' }]) {
    assert.equal(canReviewCheckout(payload(), { ...options, ...override }), false);
  }
  for (const phone of ['', 'invalid', '0900']) {
    const order = payload(); order.sender.phone = phone;
    assert.equal(canReviewCheckout(order, options), false);
  }
  const order = payload(); order.recipient.name = '  ';
  assert.equal(canReviewCheckout(order, options), false);
  order.recipient.name = 'Demo'; order.recipient.address_line = '123';
  assert.equal(canReviewCheckout(order, options), false);
  order.recipient.address_line = 'Demo street'; order.card = { type: 'GREETING_CARD', message: '  ' };
  assert.equal(canReviewCheckout(order, options), false);
});

test('review rejects past/too-far dates and slots absent from delivery options', () => {
  for (const date of ['', '2026-10-15', '2026-11-16']) {
    const order = payload(); order.delivery.date = date;
    assert.equal(canReviewCheckout(order, options), false);
  }
  const order = payload(); order.delivery.time_slot = 'unknown';
  assert.equal(canReviewCheckout(order, options), false);
  assert.equal(canReviewCheckout(payload(), { ...options, slots: [] }), false);
});
