import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNTS } from '../src/features/auth/data/demo-accounts.ts';
import { authenticateDemo, passwordStrength, readDemoSession, saveDemoSession } from '../src/features/auth/auth.service.ts';

test('fixture authentication preserves role and never returns passwords', () => {
  for (const account of ACCOUNTS) {
    const result = authenticateDemo(account.email.toUpperCase(), account.password);
    assert.equal(result.success, true);
    assert.equal(result.user.role, account.role);
    assert.equal('password' in result.user, false);
  }
  assert.equal(authenticateDemo('missing@example.test', 'invalid').success, false);
});
test('session parsing accepts only known user fields and malformed storage is harmless', () => {
  const storage = new Map();
  globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  assert.equal(readDemoSession(), null);
  storage.set('lunara_user', 'broken');
  assert.equal(readDemoSession(), null);
  storage.set('lunara_user', JSON.stringify({ name: 'Demo', email: 'demo@example.test', role: 'invalid' }));
  assert.equal(readDemoSession(), null);
  const result = authenticateDemo(ACCOUNTS[0].email, ACCOUNTS[0].password);
  saveDemoSession(result.user);
  assert.deepEqual(readDemoSession(), result.user);
  assert.equal('password' in JSON.parse(storage.get('lunara_user')), false);
  saveDemoSession(null);
  assert.equal(readDemoSession(), null);
  delete globalThis.sessionStorage;
});
test('password strength scoring stays in the auth service', () => {
  assert.equal(passwordStrength(''), 0);
  assert.equal(passwordStrength('abcdefgh'), 1);
  assert.equal(passwordStrength('Abcdef12!'), 4);
});
