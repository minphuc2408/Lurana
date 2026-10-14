import test from 'node:test';
import assert from 'node:assert/strict';
import { isUuid, newOrderNumber } from '../worker/lib/ids.ts';

test('idempotency keys require UUID v4 with a valid RFC variant', () => {
  for (const variant of ['8', '9', 'a', 'b']) {
    const uuid = `95c90a6f-c8e8-4c81-${variant}f58-318d75c86c91`;
    assert.equal(isUuid(uuid), true);
    assert.equal(isUuid(uuid.toUpperCase()), true);
  }
  for (const value of [undefined, null, 42, '', '95c90a6fc8e84c81af58318d75c86c91',
    '95c90a6f-c8e8-1c81-af58-318d75c86c91', '95c90a6f-c8e8-7c81-af58-318d75c86c91',
    '95c90a6f-c8e8-4c81-cf58-318d75c86c91', '00000000-0000-0000-0000-000000000000',
    '95c90a6f-c8e8-4c81-af58-318d75c86c91\n', ' 95c90a6f-c8e8-4c81-af58-318d75c86c91']) {
    assert.equal(isUuid(value), false, String(value));
  }
});

test('order numbers use the Vietnamese date and six unambiguous characters', () => {
  for (const [instant, date] of [['2026-10-13T16:59:59Z', '261013'], ['2026-10-13T17:00:00Z', '261014'], ['2026-12-31T17:00:00Z', '270101']]) {
    const number = newOrderNumber(new Date(instant));
    assert.match(number, new RegExp(`^LNR-${date}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$`));
    assert.doesNotMatch(number.slice(-6), /[01ILO]/);
  }
});

test('order suffix uses secure random bytes and rejects bytes that would bias the alphabet', t => {
  const random = t.mock.method(crypto, 'getRandomValues', array => {
    array.fill(255);
    array.set([255, 248, 0, 1, 2, 3, 4, 5]);
    return array;
  });
  assert.equal(newOrderNumber(new Date('2026-10-14T03:00:00Z')), 'LNR-261014-234567');
  assert.equal(random.mock.callCount(), 1);
  assert.ok(random.mock.calls[0].arguments[0] instanceof Uint8Array);
});
