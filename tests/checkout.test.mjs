import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutIntent } from '../src/features/cart/checkout-intent.ts';
import { apiRequest, apiErrorKey, ApiError } from '../src/shared/api/client.ts';
import { submitOrder, lookupOrder } from '../src/features/orders/order-api.service.ts';
import { formatVietnamDate } from '../src/shared/lib/format.ts';

test('checkout retries retain their UUID; changed contents create a fresh intent', () => {
  const payload = { items: [{ variant_id: 2, quantity: 1 }], note: '' };
  const first = checkoutIntent(payload, null);
  assert.match(first.key, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(checkoutIntent(structuredClone(payload), first), first);
  const edited = checkoutIntent({ ...payload, note: 'Greeting' }, first);
  assert.notEqual(edited.key, first.key);
  assert.notEqual(checkoutIntent(payload, edited).key, first.key);
});

test('all public/admin API errors have localized keys and unknown failures use the fallback', () => {
  for (const code of ['TIMEOUT', 'BAD_RESPONSE', 'NETWORK', 'NO_DELIVERY_ZONE', 'INVALID_DELIVERY_SLOT', 'UNAUTHORIZED', 'INVALID_CREDENTIALS', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'INVALID_TRANSITION', 'OUT_OF_STOCK', 'VARIANT_UNAVAILABLE', 'VALIDATION_ERROR', 'CART_LIMIT']) {
    assert.notEqual(apiErrorKey(new ApiError(code, 'Raw backend text')), 'API request failed');
  }
  assert.equal(apiErrorKey(new Error('unknown')), 'API request failed');
});

test('displayed timestamps and calendar dates stay in Vietnam in both locales', () => {
  assert.match(formatVietnamDate('2026-10-14T18:00:00Z', 'en'), /15 Oct 2026/);
  assert.match(formatVietnamDate('2026-10-15', 'en'), /15 Oct 2026/);
  assert.match(formatVietnamDate('2026-10-15', 'vi'), /2026/);
});

test('API timeout stops a hanging request and exposes a retryable localized code', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  const request = apiRequest('/orders');
  const rejected = assert.rejects(request, error => error instanceof ApiError && error.code === 'TIMEOUT');
  t.mock.timers.tick(20_000);
  await rejected;
});

test('order service forwards the same idempotency key and lookup sends private fields in the JSON body', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ data: { order_number: 'LN-TEST' } }), { status: calls.length === 1 ? 201 : 200 });
  });
  const payload = { items: [{ variant_id: 2, quantity: 1 }] };
  const intent = checkoutIntent(payload, null);
  await submitOrder(payload, intent.key);
  await submitOrder(payload, intent.key);
  await lookupOrder({ order_number: 'LN-TEST', phone: '0900000000' });
  assert.equal(calls[0].options.headers['Idempotency-Key'], calls[1].options.headers['Idempotency-Key']);
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[2].url, '/api/orders/lookup');
  assert.deepEqual(JSON.parse(calls[2].options.body), { order_number: 'LN-TEST', phone: '0900000000' });
});
