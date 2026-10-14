import assert from 'node:assert/strict';

const baseUrl = new URL(process.argv[2] || 'http://127.0.0.1:5173');
if (baseUrl.hostname !== '127.0.0.1') {
  throw new Error('Phase 0 smoke checks require a local server on 127.0.0.1.');
}

const request = (route, headers = {}) => fetch(new URL(route, baseUrl), {
  headers,
  signal: AbortSignal.timeout(10_000),
});

const health = await request('/api/health');
assert.equal(health.status, 200);
assert.match(health.headers.get('content-type'), /application\/json/);
const payload = await health.json();
assert.equal(payload.data.ok, true);
assert.equal(typeof payload.data.time, 'string');
assert.ok(Number.isFinite(Date.parse(payload.data.time)));

// Navigation headers exercise the SPA fallback/API routing boundary too.
const navigationHeaders = { accept: 'text/html', 'sec-fetch-mode': 'navigate' };
for (const headers of [{}, navigationHeaders]) {
  const missing = await request('/api/khong-co', headers);
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('content-type'), /application\/json/);
  assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  const navigationHealth = await request('/api/health', headers);
  assert.equal(navigationHealth.status, 200);
  assert.equal((await navigationHealth.json()).data.ok, true);
}

for (const route of ['/', '/shop']) {
  const response = await request(route, navigationHeaders);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /id="root"/);
}

console.log(`Phase 0 smoke passed at ${baseUrl.origin}: health, API JSON 404, home and SPA /shop.`);
