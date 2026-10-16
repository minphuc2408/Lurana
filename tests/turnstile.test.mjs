import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstile } from '../worker/lib/turnstile.ts';

const forbidden = error => error.code === 'FORBIDDEN' && error.status === 403
  && error.message === 'Xác minh bảo mật không hợp lệ. Vui lòng thử lại.' && error.details === undefined;

test('missing or blank Turnstile configuration fails closed without a network call', async () => {
  let calls = 0;
  const unexpectedFetch = () => { calls++; throw new Error('unexpected network'); };
  for (const secret of [undefined, '', ' \n ']) {
    for (const expected of [undefined, { action: 'lookup', hostname: 'localhost' },
      { action: 'lookup', hostname: 'localhost', allowLocalBypass: false },
      ...['shop.example', 'localhost.attacker.test', '127.0.0.1.attacker.test', '127.0.0.2', ''].map(hostname => ({ action: 'lookup', hostname, allowLocalBypass: true }))]) {
      await assert.rejects(verifyTurnstile(secret, 'ignored-token', unexpectedFetch, undefined, expected),
        error => error.code === 'TURNSTILE_NOT_CONFIGURED' && error.status === 503 && error.details === undefined);
    }
  }
  assert.equal(calls, 0);
});

test('Turnstile bypass requires explicit server opt-in and exact loopback hostname', async () => {
  const unexpectedFetch = () => { throw new Error('must not make a network call'); };
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
    for (const secret of [undefined, '', '  ']) {
      await verifyTurnstile(secret, undefined, unexpectedFetch, undefined, { action: 'lookup', hostname, allowLocalBypass: true });
    }
  }
});

test('a configured secret always requires verification even with local bypass enabled', async () => {
  const expected = { action: 'lookup', hostname: 'localhost', allowLocalBypass: true };
  await assert.rejects(verifyTurnstile('demo-secret', undefined, () => { throw new Error('unexpected'); }, undefined, expected), forbidden);
  let calls = 0;
  await verifyTurnstile('demo-secret', 'demo-token', async () => {
    calls++;
    return Response.json({ success: true, action: 'lookup', hostname: 'localhost' });
  }, undefined, expected);
  assert.equal(calls, 1);
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
