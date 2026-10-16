import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import app from '../worker/index.ts';
import { createImageUploadTicket } from '../worker/services/cloudinary.ts';
import { adminCookie, adminEnv } from './helpers/admin.mjs';
import { adminImageUploadTicketSchema } from '../shared/admin-upload-schemas.ts';
import { validateProductImage, cloudinaryImageUrl, uploadProductImage } from '../src/features/admin/product-image.service.ts';

const cloudEnv = { CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: '123456',
  CLOUDINARY_API_SECRET: 'synthetic-cloudinary-secret', CLOUDINARY_SCOPE: 'staging', CLOUDINARY_UPLOAD_PRESET: 'lunara_products_staging' };
const origin = 'http://localhost';
const image = ticket => ({ public_id: ticket.params.public_id, resource_type: 'image', format: 'jpg',
  secure_url: `https://res.cloudinary.com/demo/image/upload/v123/${ticket.params.public_id}.jpg` });

test('upload ticket signs exactly the server-owned scope, UUID, formats and overwrite policy using SHA-256', async () => {
  for (const scope of ['local', 'staging', 'prod']) {
    const env = { ...cloudEnv, CLOUDINARY_SCOPE: scope };
    const ticket = await createImageUploadTicket(env);
    assert.equal(adminImageUploadTicketSchema.safeParse(ticket).success, true);
    assert.match(ticket.params.public_id, new RegExp(`^lunara/${scope}/products/[a-f0-9-]{36}$`));
    assert.equal(ticket.params.asset_folder, `lunara/${scope}/products`);
    assert.equal(ticket.params.overwrite, 'false');
    assert.equal(ticket.params.allowed_formats, 'jpg,png,webp');
    assert.ok(Math.abs(Number(ticket.params.timestamp) - Date.now() / 1000) < 2);
    const fields = Object.keys(ticket.params).sort().map(key => `${key}=${ticket.params[key]}`).join('&');
    assert.equal(ticket.signature, createHash('sha256').update(fields + env.CLOUDINARY_API_SECRET).digest('hex'));
    assert.ok(!JSON.stringify(ticket).includes(env.CLOUDINARY_API_SECRET));
    assert.notEqual((await createImageUploadTicket(env)).params.public_id, ticket.params.public_id);
  }
});

test('missing/blank credentials or invalid scope fail closed without leaking configuration', async () => {
  for (const key of Object.keys(cloudEnv)) {
    for (const value of [undefined, '', ' ']) {
      await assert.rejects(() => createImageUploadTicket({ ...cloudEnv, [key]: value }), error => error.status === 503 && error.code === 'CLOUDINARY_NOT_CONFIGURED');
    }
  }
  await assert.rejects(() => createImageUploadTicket({ ...cloudEnv, CLOUDINARY_SCOPE: 'elsewhere' }));
});

test('upload signing requires admin cookie, same origin and JSON; validates metadata and rejects caller signing fields', async () => {
  const env = { ...adminEnv, ...cloudEnv };
  const cookie = await adminCookie(app, env);
  const request = (body, headers = {}) => app.request(`${origin}/api/admin/uploads/sign`, { method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie, ...headers }, body: JSON.stringify(body) }, env);
  const valid = { mime: 'image/jpeg', size: 12 };
  assert.equal((await request(valid, { Cookie: '' })).status, 401);
  assert.equal((await request(valid, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await request(valid, { 'Content-Type': 'text/plain' })).status, 400);
  for (const body of [{ ...valid, public_id: 'overwrite-production' }, { ...valid, upload_preset: 'unsigned' },
    { ...valid, mime: 'image/svg+xml' }, { ...valid, size: 0 }, { ...valid, size: 5242881 }, { junk: 'x'.repeat(1100) }]) {
    assert.equal((await request(body)).status, 400);
  }
  const response = await request(valid);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(adminImageUploadTicketSchema.safeParse((await response.json()).data).success, true);
  const missing = await app.request(`${origin}/api/admin/uploads/sign`, { method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(valid) }, adminEnv);
  assert.equal(missing.status, 503);
});

test('client validates size/type and only accepts HTTPS Cloudinary URLs for the exact uploaded public ID', async () => {
  validateProductImage({ type: 'image/webp', size: 5242880 });
  for (const file of [{ type: 'image/svg+xml', size: 1 }, { type: 'image/jpeg', size: 0 }, { type: 'image/png', size: 5242881 }]) {
    assert.throws(() => validateProductImage(file), error => error.code === 'INVALID_IMAGE');
  }
  const ticket = await createImageUploadTicket(cloudEnv);
  const result = image(ticket);
  assert.equal(cloudinaryImageUrl(result, ticket), result.secure_url);
  for (const patch of [{ resource_type: 'video' }, { public_id: 'another-file' }, { format: 'svg' },
    { secure_url: result.secure_url.replace('https:', 'http:') }, { secure_url: result.secure_url.replace('res.cloudinary.com', 'res.cloudinary.com.evil.test') },
    { secure_url: result.secure_url.replace('/demo/', '/another-cloud/') }, { secure_url: result.secure_url + '?x=1' }]) {
    assert.throws(() => cloudinaryImageUrl({ ...result, ...patch }, ticket), error => error.code === 'BAD_RESPONSE');
  }
});

test('browser upload sends signed multipart directly without cookies and never retries ambiguous provider failures', async t => {
  const ticket = await createImageUploadTicket(cloudEnv);
  const file = new File(['synthetic image'], 'test.jpg', { type: 'image/jpeg' });
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.cloudinary.com/v1_1/demo/image/upload');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.body.get('signature'), ticket.signature);
    assert.equal(options.body.get('file').name, 'test.jpg');
    assert.equal(options.body.get('overwrite'), 'false');
    return Response.json(image(ticket));
  });
  assert.deepEqual(await uploadProductImage(file, ticket), { url: image(ticket).secure_url, cloudinary_public_id: ticket.params.public_id });
  mock.mock.mockImplementation(async () => { throw new Error('network'); });
  await assert.rejects(() => uploadProductImage(file, ticket), error => error.code === 'IMAGE_UPLOAD_FAILED');
  assert.equal(mock.mock.callCount(), 2);
});
