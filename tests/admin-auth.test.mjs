import test from 'node:test';
import assert from 'node:assert/strict';
import { sign, decode } from 'hono/jwt';
import app from '../worker/index.ts';
import { checkPassword, SESSION_SECONDS } from '../worker/lib/auth.ts';
import { adminEnv, adminCookie } from './helpers/admin.mjs';

const origin = 'http://localhost';
const login = (password, headers = {}, url = `${origin}/api/admin/login`) => app.request(url, {
  method: 'POST', headers: { Origin: new URL(url).origin, 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify({ password }),
}, adminEnv);

test('admin password uses SHA-256 and native timingSafeEqual for equal-length digests', async t => {
  const calls = [];
  const equal = crypto.subtle.timingSafeEqual;
  t.mock.method(crypto.subtle, 'timingSafeEqual', (a, b) => { calls.push([a.byteLength, b.byteLength]); return equal(a, b); });
  assert.equal(await checkPassword(adminEnv.ADMIN_PASSWORD, adminEnv.ADMIN_PASSWORD), true);
  assert.equal(await checkPassword('wrong', adminEnv.ADMIN_PASSWORD), false);
  assert.deepEqual(calls, [[32, 32], [32, 32]]);
  assert.equal(await checkPassword('anything', ''), false);
});

test('admin login sets strict HttpOnly 12h cookie and returns only ok, never bearer credentials', async () => {
  const wrong = await login('wrong');
  assert.equal(wrong.status, 401); assert.equal((await wrong.json()).error.code, 'INVALID_CREDENTIALS');
  assert.equal(wrong.headers.get('Set-Cookie'), null);
  for (const scheme of ['http', 'https']) {
    const response = await login(adminEnv.ADMIN_PASSWORD, {}, `${scheme}://localhost/api/admin/login`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const cookie = response.headers.get('Set-Cookie');
    assert.match(cookie, /^lunara_admin=/); assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Path=\//); assert.match(cookie, /Max-Age=43200/);
    assert.equal(cookie.includes('Secure'), scheme === 'https');
    const { payload, header } = decode(cookie.split(';', 1)[0].split('=')[1]);
    assert.equal(header.alg, 'HS256'); assert.equal(payload.role, 'ADMIN');
    assert.equal(payload.exp - payload.iat, SESSION_SECONDS);
    assert.deepEqual(await response.json(), { data: { ok: true } });
  }
});

test('missing, blank, short and equal secrets fail closed without cookies or logs', async t => {
  const logs = []; t.mock.method(console, 'error', (...args) => logs.push(args));
  for (const env of [{}, { ...adminEnv, ADMIN_PASSWORD: '' }, { ...adminEnv, JWT_SECRET: ' ' },
    { ...adminEnv, ADMIN_PASSWORD: 'short' }, { ...adminEnv, JWT_SECRET: 'short' },
    { ADMIN_PASSWORD: adminEnv.JWT_SECRET, JWT_SECRET: adminEnv.JWT_SECRET }]) {
    const response = await app.request('/api/admin/login', { method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminEnv.ADMIN_PASSWORD }) }, env);
    assert.equal(response.status, 401); assert.equal((await response.json()).error.code, 'INVALID_CREDENTIALS');
    assert.equal(response.headers.get('Set-Cookie'), null);
  }
  assert.deepEqual(logs, []);
});

test('every admin boundary requires auth, including unknown routes and logout', async () => {
  for (const [method, path] of [['GET', ''], ['GET', '/me'], ['GET', '/summary'], ['GET', '/orders'],
    ['GET', '/orders/unknown'], ['PATCH', '/orders/unknown/status'], ['PATCH', '/orders/unknown/note'],
    ['GET', '/products'], ['POST', '/products'], ['PATCH', '/products/1'], ['PATCH', '/variants/1'],
    ['GET', '/delivery-zones'], ['POST', '/delivery-zones'], ['PUT', '/delivery-zones/1'],
    ['POST', '/logout'], ['GET', '/unknown'], ['GET', '/login'], ['DELETE', '/login']]) {
    const response = await app.request(`/api/admin${path}`, { method }, adminEnv);
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.equal((await response.json()).error.code, 'UNAUTHORIZED');
  }
  const cookie = await adminCookie(app, {});
  const me = await app.request('/api/admin/me', { headers: { Cookie: cookie } }, adminEnv);
  assert.deepEqual(await me.json(), { data: { role: 'ADMIN' } });
});

test('admin JWT rejects tampering, expiration, bad role, invalid/missing times and algorithm confusion', async t => {
  const now = Math.floor(Date.now() / 1000);
  const valid = { role: 'ADMIN', iat: now - 10, exp: now + 100 };
  const logs = []; t.mock.method(console, 'error', (...args) => logs.push(args));
  const token = await sign(valid, adminEnv.JWT_SECRET, 'HS256');
  const tokens = [token.replace(/^./, token[0] === 'e' ? 'a' : 'e'), 'bad.jwt.token',
    await sign(valid, 'another-local-demo-secret-with-32-characters', 'HS256'),
    await sign(valid, adminEnv.JWT_SECRET, 'HS512')];
  for (const payload of [{ ...valid, exp: now }, { ...valid, role: 'CUSTOMER' },
    { role: 'ADMIN' }, { ...valid, iat: now + 1000 }, { ...valid, iat: '0' },
    { ...valid, exp: '9999999999' }, { ...valid, exp: now + SESSION_SECONDS + 100 },
    { ...valid, iat: now + 0.5 }]) tokens.push(await sign(payload, adminEnv.JWT_SECRET, 'HS256'));
  for (const jwt of tokens) {
    const response = await app.request('/api/admin/me', { headers: { Cookie: `lunara_admin=${jwt}` } }, adminEnv);
    assert.equal(response.status, 401); assert.equal((await response.json()).error.code, 'UNAUTHORIZED');
  }
  assert.deepEqual(logs, []);
});

test('admin writes require matching scheme/host/port Origin and JSON content type, including login/logout', async () => {
  const cookie = await adminCookie(app, {});
  for (const path of ['/api/admin/login', '/api/admin/logout']) {
    for (const badOrigin of [null, 'null', 'https://localhost', 'http://localhost:9000', 'http://localhost.evil.test']) {
      const headers = { Cookie: cookie, 'Content-Type': 'application/json' };
      if (badOrigin !== null) headers.Origin = badOrigin;
      const response = await app.request(path, { method: 'POST', headers, body: '{}' }, adminEnv);
      assert.equal(response.status, 403); assert.equal((await response.json()).error.code, 'FORBIDDEN');
    }
    for (const mediaType of [undefined, 'text/plain', 'application/jsonp', 'application/x-www-form-urlencoded']) {
      const headers = { Origin: origin, Cookie: cookie };
      if (mediaType) headers['Content-Type'] = mediaType;
      const response = await app.request(path, { method: 'POST', headers, body: '{}' }, adminEnv);
      assert.equal(response.status, 400); assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
    }
  }
  const response = await app.request('/api/admin/logout', { method: 'POST',
    headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json; charset=utf-8' }, body: '{}' }, adminEnv);
  assert.equal(response.status, 200); assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.match(response.headers.get('Set-Cookie'), /HttpOnly/);
  const loggedOut = await app.request('/api/admin/me', { headers: { Cookie: 'lunara_admin=' } }, adminEnv);
  assert.equal(loggedOut.status, 401);
});

test('admin malformed and oversized login input is rejected without revealing submitted password', async () => {
  for (const body of ['{broken', JSON.stringify({ password: 'x'.repeat(1100) }), JSON.stringify({ password: 'x'.repeat(5000) })]) {
    const response = await app.request('/api/admin/login', { method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' }, body }, adminEnv);
    assert.equal(response.status, 400); const text = await response.text();
    assert.equal(JSON.parse(text).error.code, 'VALIDATION_ERROR');
    assert.ok(!text.includes(adminEnv.ADMIN_PASSWORD) && !text.includes(adminEnv.JWT_SECRET));
    assert.ok(!text.includes('x'.repeat(100)));
  }
});
