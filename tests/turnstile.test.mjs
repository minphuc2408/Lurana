import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstile } from '../worker/lib/turnstile.ts';

const forbidden = error => error.code === 'FORBIDDEN' && error.status === 403
  && error.message === 'Xác minh bảo mật không hợp lệ. Vui lòng thử lại.' && error.details === undefined;

test('local Turnstile bypass is conditional on an absent secret and makes no network calls', async () => {
  const unexpectedFetch = () => { throw new Error('must not make a network call'); };
  await verifyTurnstile(undefined, undefined, unexpectedFetch);
  await verifyTurnstile('', 'demo-token', unexpectedFetch);
});

test('configured Turnstile rejects missing, blank and oversized tokens before network calls', async () => {
  let calls = 0;
  const unexpectedFetch = () => { calls++; throw new Error('unexpected network call'); };
  for (const token of [undefined, '', '  \n ', 'a'.repeat(2049)]) {
    await assert.rejects(() => verifyTurnstile('demo-secret', token, unexpectedFetch), forbidden);
  }
  assert.equal(calls, 0);
});

test('Turnstile sends token and secret to Siteverify and permits only explicit success', async () => {
  let calls = 0;
  await verifyTurnstile('demo-secret', 'demo-token', async (url, options) => {
    calls++;
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { secret: 'demo-secret', response: 'demo-token' });
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ success: true, hostname: 'example.test' });
  });
  assert.equal(calls, 1);
});

test('Turnstile forwards a validated order UUID for Siteverify retries', async () => {
  const key = '95c90a6f-c8e8-4c81-af58-318d75c86c91';
  const requests = [];
  const requestFetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return Response.json({ success: true });
  };
  await verifyTurnstile('demo-secret', 'demo-token', requestFetch, key);
  await verifyTurnstile('demo-secret', 'demo-token', requestFetch, key);
  assert.deepEqual(requests, [
    { secret: 'demo-secret', response: 'demo-token', idempotency_key: key },
    { secret: 'demo-secret', response: 'demo-token', idempotency_key: key },
  ]);
});

test('failed, malformed and unavailable Siteverify responses all fail closed with a safe error', async () => {
  for (const requestFetch of [
    async () => Response.json({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
    async () => Response.json({ success: 'true' }),
    async () => Response.json({}),
    async () => Response.json(null),
    async () => Response.json({ success: true }, { status: 503 }),
    async () => new Response('invalid json', { status: 200 }),
    async () => { throw new Error('demo-secret and demo-token must not appear in public errors'); },
  ]) {
    await assert.rejects(() => verifyTurnstile('demo-secret', 'demo-token', requestFetch), forbidden);
  }
});
