import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import writeXlsxFile from 'write-excel-file/universal';
import app from '../worker/index.ts';
import { signSession } from '../worker/lib/auth.ts';
import { PRODUCT_IMPORT_COLUMNS } from '../shared/product-import.ts';
import { createTestDb } from '../tests/helpers/worker.mjs';

const origin = process.argv[2] || 'http://127.0.0.1:4173';
if (new URL(origin).hostname !== '127.0.0.1') throw new Error('Loopback preview only');
const output = path.resolve('.security-review/product-import');
const profile = path.join(output, 'edge-' + Date.now());
mkdirSync(profile, { recursive: true });
const fixture = createTestDb();
for (let index = 1; index < 8; index++) fixture.sqlite.prepare('INSERT INTO product_images(product_id,image_url,sort_order) VALUES(1,?,?)')
  .run(`https://images.unsplash.com/full-gallery-${index}.jpg`, index);
const env = { DB: fixture.db, ADMIN_PASSWORD: 'synthetic-import-password-at-least-24-characters', JWT_SECRET: 'synthetic-import-signing-secret-at-least-32-characters' };
const cookie = `lunara_admin=${await signSession(env)}`;
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-gpu', '--disable-sync', '--no-first-run', '--disable-background-networking',
  '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let ws, nextId = 0, templateDownloads = 0, importCommits = 0, failNextImport = false, cancelledInterceptions = 0;
const pending = new Map(), checks = [], exceptions = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function send(method, params = {}) {
  const id = ++nextId, result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params })); return result;
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 160; i++) { if (await evaluate('Boolean(' + expression + ')')) return; await pause(50); }
  throw new Error('Timeout: ' + expression);
}
async function check(expression, label) { assert.ok(await evaluate(expression), label); checks.push(label); }
async function click(selector) { await evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()'); await pause(50); }
async function input(selector, value) {
  await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await pause(50);
}
async function key(value) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code: value });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code: value });
  await pause(50);
}
async function screenshot(name) {
  await pause(250);
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(output, name + '.png'), Buffer.from(data, 'base64'));
}
async function selectFile(values, fileName = 'products.xlsx') {
  const cell = value => ({ value, type: typeof value === 'number' ? Number : typeof value === 'boolean' ? Boolean : String });
  const blob = await writeXlsxFile([PRODUCT_IMPORT_COLUMNS.map(cell), ...values.map(row => PRODUCT_IMPORT_COLUMNS.map(column => cell(row[column] ?? '')))], { sheet: 'Products' }).toBlob();
  const target = path.join(output, fileName); writeFileSync(target, Buffer.from(await blob.arrayBuffer()));
  const { root } = await send('DOM.getDocument');
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-testid=product-import-file]' });
  await send('DOM.setFileInputFiles', { nodeId, files: [target] });
}
async function intercept({ requestId, request }) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    if (url.origin !== origin) return send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    return send('Fetch.continueRequest', { requestId });
  }
  const body = request.postData ? JSON.parse(request.postData) : undefined;
  if (url.pathname.endsWith('/products/import') && !body.validate_only) {
    importCommits++;
    if (failNextImport) {
      failNextImport = false;
      await send('Fetch.failRequest', { requestId, errorReason: 'ConnectionClosed' }); return;
    }
  }
  const response = await app.request(url.toString(), { method: request.method,
    headers: { ...request.headers, cookie, Origin: origin }, ...(request.postData ? { body: request.postData } : {}) }, env);
  const responseText = await response.text();
  if (url.pathname.endsWith('/import-template')) {
    templateDownloads++;
    const file = JSON.parse(responseText).data;
    writeFileSync(path.join(output, 'lunarra-products-template.xlsx'), Buffer.from(file.content_base64, 'base64'));
  }
  await send('Fetch.fulfillRequest', { requestId, responseCode: response.status,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(responseText).toString('base64') });
}
try {
  let target;
  for (let i = 0; i < 160 && !target; i++) {
    try { const port = readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); target = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(item => item.type === 'page'); } catch {}
    if (!target) await pause(50);
  }
  assert.ok(target, 'Edge CDP available');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const job = pending.get(message.id); pending.delete(message.id); message.error ? job?.reject(new Error(JSON.stringify(message.error))) : job?.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.exception?.description);
    if (message.method === 'Fetch.requestPaused') intercept(message.params).catch(error => {
      // Navigation may cancel a paused font/image request before CDP can fulfill it.
      if (error.message.includes('"code":-32602') && error.message.includes('Invalid InterceptionId')) { cancelledInterceptions++; return; }
      exceptions.push(error.message); send('Fetch.failRequest', { requestId: message.params.requestId, errorReason: 'Failed' }).catch(() => {});
    });
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: output });
  for (const language of ['en', 'vi']) for (const width of [1440, 390, 320]) {
    const tag = language + '-' + width;
    await send('Emulation.setDeviceMetricsOverride', { width, height: width < 768 ? 844 : 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: origin + '/admin/stock' });
    await waitFor('document.querySelector("[data-testid=admin-products]")');
    await evaluate(`localStorage.setItem('lunara_language',${JSON.stringify(language)})`);
    await send('Page.reload');
    await waitFor('document.querySelector("[data-testid=product-import-open]") && !document.querySelector("[data-testid=product-import-open]").disabled');
    await check('document.documentElement.scrollWidth <= window.innerWidth', tag + ' stock fits viewport');
    await check(`document.querySelector('[data-testid=product-template-download]').textContent.includes(${JSON.stringify(language === 'vi' ? 'Tải template' : 'Download template')})`, tag + ' toolbar translation');
    if (width === 1440 && language === 'en') { await click('[data-testid=product-template-download]'); await waitFor('!document.querySelector("[data-testid=product-template-download]").disabled'); }
    if (width === 1440 && language === 'en') await input('[data-variant-id="1"] [name=price]', '123456');
    await screenshot(tag + '-stock');
    await click('[data-testid=product-import-open]');
    const row = { category_id: 1, slug: 'ui-' + tag, name_vi: 'Hoa kiểm thử ' + tag, name_en: 'UI flowers ' + tag,
      status: 'HIDDEN', sku: 'UI-' + tag, size_code: 'S', price: 200000, stock_quantity: 8, low_stock_threshold: 2 };
    await selectFile([{ ...row, price: -1 }]);
    await waitFor('document.querySelector("[data-testid=product-import-errors]")');
    await check('document.querySelector("[data-testid=product-import-errors]").textContent.includes("2") && document.querySelector("[data-testid=product-import-confirm]").disabled', tag + ' invalid row blocks import');
    await screenshot(tag + '-error');
    await selectFile([row]);
    await waitFor('document.querySelector("[data-testid=product-import-summary]") && !document.querySelector("[data-testid=product-import-confirm]").disabled');
    await check('document.documentElement.scrollWidth <= window.innerWidth && document.querySelector("[role=dialog]").getBoundingClientRect().width <= window.innerWidth', tag + ' preview fits viewport');
    await key('Tab');
    await check('Boolean(document.activeElement.closest("[role=dialog]"))', tag + ' keyboard focus stays in dialog');
    await screenshot(tag + '-preview');
    await click('[data-testid=product-import-confirm]');
    await waitFor('document.querySelector("[data-testid=product-import-summary]") && !document.querySelector("[data-testid=product-import-confirm]")');
    const productId = fixture.sqlite.prepare('SELECT id FROM products WHERE slug=?').get(row.slug).id;
    await key('Escape');
    if (width === 1440 && language === 'en') await check('document.querySelector(\'[data-variant-id="1"] [name=price]\').value === "123456"', 'import preserves existing unsaved variant draft');
    await input('[name=product_search]', row.slug);
    await waitFor(`document.querySelector('[data-testid=product-upload-images-${productId}]')`);
    if (width === 1440 && language === 'en') {
      await click(`[data-testid=product-edit-${productId}]`);
      await input('[name=name_en]', 'Edited without images');
      await click('[data-testid=product-form-save]');
      await waitFor('!document.querySelector("[data-testid=product-form]")');
      assert.equal(fixture.sqlite.prepare('SELECT name_en FROM products WHERE id=?').get(productId).name_en, 'Edited without images');
      checks.push('imported product can save text edits before adding images');
    }
    await check(`Boolean(document.querySelector('[data-testid=product-upload-images-${productId}]').compareDocumentPosition(document.querySelector('[data-testid=product-edit-${productId}]')) & Node.DOCUMENT_POSITION_FOLLOWING)`, tag + ' upload button precedes edit');
    await click(`[data-testid=product-upload-images-${productId}]`);
    await waitFor('document.querySelector("#product-tab-images").getAttribute("aria-selected") === "true"');
    await waitFor('document.activeElement?.dataset.testid === "product-image-file"');
    await check('document.activeElement?.dataset.testid === "product-image-file"', tag + ' upload shortcut focuses image input');
    await check('document.querySelector("[data-testid=product-image-file]").getBoundingClientRect().width > 0 && document.querySelector("[data-admin-gallery-empty]") !== null', tag + ' shortcut opens empty gallery and upload input');
    await screenshot(tag + '-gallery');
    await click('.admin-gallery-url summary');
    await input('[name=image_url]', 'https://images.unsplash.com/synthetic-' + tag + '.jpg');
    await click('[data-add-image-url]');
    await click('[data-testid=product-form-save]');
    await waitFor('!document.querySelector("[data-testid=product-form]")');
    assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) AS n FROM product_images WHERE product_id=?').get(productId).n, 1);
    assert.equal(fixture.sqlite.prepare('SELECT stock_quantity FROM product_variants WHERE product_id=?').get(productId).stock_quantity, 8);
  }
  await input('[name=product_search]', 'blush-peony-bouquet');
  await waitFor('document.querySelector("[data-testid=product-upload-images-1]")');
  await click('[data-testid=product-upload-images-1]');
  await waitFor('document.querySelector("#product-tab-images").getAttribute("aria-selected") === "true"');
  await check('document.querySelector("[data-testid=product-image-file]").disabled && document.activeElement?.id === "product-tab-images"', 'full gallery keeps keyboard focus inside the dialog');
  await key('Escape');
  await input('[name=product_search]', '');
  await click('[data-testid=product-import-open]');
  await selectFile([{ category_id: 1, slug: 'ui-ambiguous', name_vi: 'Hoa', name_en: 'Flowers', sku: 'UI-AMBIGUOUS', size_code: 'S', price: 1, stock_quantity: 0, low_stock_threshold: 0 }]);
  await waitFor('document.querySelector("[data-testid=product-import-confirm]") && !document.querySelector("[data-testid=product-import-confirm]").disabled');
  failNextImport = true;
  await click('[data-testid=product-import-confirm]');
  await waitFor('document.querySelector("[data-testid=product-import-confirm]").disabled && document.querySelectorAll("[role=alert]").length > 0');
  const commitsBefore = importCommits; await pause(600);
  assert.equal(importCommits, commitsBefore, 'Ambiguous import is never automatically retried');
  assert.equal(templateDownloads, 1);
  assert.deepEqual(exceptions, []);
  writeFileSync(path.join(output, 'result.json'), JSON.stringify({ checks, templateDownloads, importCommits, cancelledInterceptions, languages: ['en', 'vi'], widths: [1440, 390, 320], data: 'in-memory SQLite, synthetic admin; no local/remote persisted writes', exceptions }, null, 2));
  console.log(`PASS ${checks.length} browser checks; import, row errors, gallery save, uncertain-result guard; EN/VI 1440/390/320.`);
} finally { ws?.close(); browser.kill(); fixture.close(); }
