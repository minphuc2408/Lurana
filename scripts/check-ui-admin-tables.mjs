import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import writeXlsxFile from 'write-excel-file/universal';
import app from '../worker/index.ts';
import { signSession } from '../worker/lib/auth.ts';
import { ZONE_IMPORT_COLUMNS } from '../shared/zone-import.ts';
import { listAdministrativeAreas } from '../worker/services/administrative-areas.ts';
import { canonicalWardName } from '../shared/delivery-areas.ts';
import { createOrder } from '../worker/services/orders.ts';
import { todayInVN } from '../worker/lib/datetime.ts';
import { randomUUID } from 'node:crypto';
import { createTestDb } from '../tests/helpers/worker.mjs';

const origin = process.argv[2] || 'http://127.0.0.1:4173';
if (new URL(origin).hostname !== '127.0.0.1') throw new Error('Loopback preview only');
const output = path.resolve('.security-review/admin-tables');
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
const pending = new Map(), checks = [], exceptions = [], requests = [];
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
  const blob = await writeXlsxFile([ZONE_IMPORT_COLUMNS.map(cell), ...values.map(row => ZONE_IMPORT_COLUMNS.map(column => cell(row[column] ?? '')))], { sheet: 'DeliveryZones' }).toBlob();
  const target = path.join(output, fileName); writeFileSync(target, Buffer.from(await blob.arrayBuffer()));
  const { root } = await send('DOM.getDocument');
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-testid=zone-import-file]' });
  await send('DOM.setFileInputFiles', { nodeId, files: [target] });
}
async function intercept({ requestId, request }) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) requests.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), method: request.method });
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
    writeFileSync(path.join(output, 'lunarra-delivery-zones-template.xlsx'), Buffer.from(file.content_base64, 'base64'));
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
  const areas = await listAdministrativeAreas(fixture.db);
  const availableArea = () => {
    const existing = fixture.sqlite.prepare('SELECT province_name,ward_name FROM delivery_zones').all();
    return areas.flatMap(province => province.wards.map(ward => ({ province_name: province.province_name, ward_name: ward.ward_name })))
      .find(area => !existing.some(zone => zone.province_name === area.province_name && canonicalWardName(zone.ward_name) === area.ward_name));
  };
  for (let i = 0; i < 12; i++) {
    const product = fixture.sqlite.prepare("INSERT INTO products(category_id,slug,name_vi,name_en,status) VALUES(1,?,?,?,'ACTIVE')").run(`table-${i}`, `Hoa kiểm tra ${i}`, `Table flowers ${i}`);
    for (const size of ['S', 'M']) fixture.sqlite.prepare('INSERT INTO product_variants(product_id,sku,size_code,price,stock_quantity) VALUES(?,?,?,?,?)').run(product.lastInsertRowid, `TABLE-${i}-${size}`, size, 200000, 20);
  }
  for (let i = 0; i < 20 || fixture.sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n % 5 !== 1; i++) {
    const area = availableArea(); fixture.sqlite.prepare('INSERT INTO delivery_zones(province_name,ward_name,fee,is_active) VALUES(?,?,?,?)').run(area.province_name, area.ward_name, 20000, i % 2);
  }
  fixture.sqlite.exec('UPDATE product_variants SET stock_quantity=200 WHERE id=1');
  const date = new Date(Date.parse(todayInVN() + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
  for (let i = 0; i < 23; i++) await createOrder(fixture.db, { items: [{ variant_id: 1, quantity: 1 }], sender: { name: 'SMOKE sender', phone: '090' + String(i).padStart(7, '0'), is_anonymous: false }, recipient: { name: 'SMOKE recipient', phone: '0911111111', province_name: 'Thành phố Hà Nội', ward_name: 'Phường Hoàn Kiếm', address_line: '12 Phố Hoa Demo' }, delivery: { method_code: 'STANDARD', date, time_slot: '08:00-10:00' }, card: { type: 'NONE' } }, randomUUID());
  const navigate = async route => {
    await send('Page.navigate', { url: origin + route });
    await waitFor('document.readyState === "complete" && document.querySelector("[data-admin-records] tbody tr")');
  };
  const stockPager = '[data-testid=admin-products] > .admin-collection > [data-admin-pagination]';
  const zonePager = '[data-testid=admin-delivery-zones] > .admin-collection > [data-admin-pagination]';
  const selectSize = async (pager, size) => {
    await click(pager + ' [role=combobox]'); await waitFor('document.querySelector("[role=option]")');
    await evaluate(`[...document.querySelectorAll('[role=option]')].find(option => option.textContent.trim().startsWith(${JSON.stringify(String(size))})).click()`);
    await pause(400);
  };
  const ratio = async (selector, label) => check(`(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return Math.abs(r.width-innerWidth*.8)<2 && Math.abs(r.height-innerHeight*.85)<2 && r.left>=0 && r.top>=0;})()`, label);
  for (const language of ['en', 'vi']) for (const width of [1440, 390, 320]) {
    const tag = language + '-' + width;
    await send('Emulation.setDeviceMetricsOverride', { width, height: width < 768 ? 844 : 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await navigate('/admin/stock');
    await evaluate(`localStorage.setItem('lunara_language',${JSON.stringify(language)})`); await send('Page.reload');
    await waitFor(`document.querySelector('[data-variant-id="1"]')`);
    await check('document.querySelectorAll("[data-product-id]").length===5', tag + ' stock requests one page');
    await check(`document.querySelector('[data-variant-id="1"]').children[0].querySelector('span[aria-label]').textContent==='1' && document.querySelector('[data-variant-id="1"]').children[0].querySelector('button').dataset.testid==='variant-delete-1'`, tag + ' number/delete/edit first');
    await check('document.querySelector(\'[data-variant-id="1"]\').children[1].querySelectorAll("p").length===2 && getComputedStyle(document.querySelector(\'[data-variant-id="1"]\').children[1]).textAlign==="center"', tag + ' size centered and duplicate price removed');
    await check('document.documentElement.scrollWidth<=innerWidth', tag + ' stock fits viewport');
    if (language === 'en' && width === 1440) {
      await click('[data-testid=variant-edit-1]'); await input('[data-variant-id="1"] [name=price]', '123456');
      await click(stockPager + ' > div:last-child > button:last-child');
      await waitFor(`document.querySelector('[data-product-id="6"]')`);
      assert.equal(requests.filter(r=>r.path==='/api/admin/products').at(-1).query.offset, '5');
      await click(stockPager + ' > div:last-child > button:first-child'); await waitFor(`document.querySelector('[data-variant-id="1"]')`);
      await check('document.querySelector(\'[data-variant-id="1"] [name=price]\').value==="123456"', 'server page preserves unsaved draft');
      await click('[data-testid=variant-edit-2]'); await input('[data-variant-id="2"] [name=stock_delta]', '3'); await click('[data-testid=variant-save-2]');
      await waitFor('document.querySelector(\'[data-variant-id="2"]\')?.dataset.stock==="18"');
      assert.equal(fixture.sqlite.prepare('SELECT price FROM product_variants WHERE id=1').get().price, 450000);
      await click('[data-testid=variant-delete-1]'); await click('[data-testid=admin-delete-confirm]'); await waitFor('document.querySelector("[role=dialog] [role=alert]")'); await key('Escape');
      await click('[data-testid=variant-delete-3]'); await click('[data-testid=admin-delete-confirm]'); await waitFor(`!document.querySelector('[data-testid=admin-delete-confirm]') && !document.querySelector('[data-variant-id="3"]')`);
      assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) AS n FROM product_variants WHERE id=3').get().n, 0);
      await selectSize(stockPager, 10); await waitFor('document.querySelectorAll("[data-product-id]").length===10');
      assert.equal(requests.filter(r=>r.path==='/api/admin/products').at(-1).query.limit, '10');
    }
    await screenshot(tag + '-stock');
    await navigate('/admin/delivery-zones');
    await check('document.querySelectorAll("[data-zone-id]").length===10', tag + ' zone requests one page');
    await check('document.querySelector("[data-zone-id]").children[0].querySelectorAll("button").length===2 && document.querySelector("[data-zone-id]").children[0].querySelector("span[aria-label]").textContent==="1"', tag + ' zone number and icon actions');
    await check('document.documentElement.scrollWidth<=innerWidth', tag + ' zones fit viewport');
    if (language === 'en' && width === 1440) {
      await selectSize(zonePager, 5);
      const before = fixture.sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n;
      await click(zonePager + ' > div:last-child > div > span:last-child > button');
      await waitFor('document.querySelectorAll("[data-zone-id]").length===1');
      const lastId = await evaluate('document.querySelector("[data-zone-id]").dataset.zoneId');
      await click('[data-testid=zone-delete-' + lastId + ']'); await click('[data-testid=admin-delete-confirm]');
      await waitFor('!document.querySelector("[data-testid=admin-delete-confirm]") && document.querySelectorAll("[data-zone-id]").length===5');
      assert.equal(requests.filter(r=>r.path==='/api/admin/delivery-zones').at(-1).query.offset, String(Math.floor((before-2)/5)*5));
      const id = await evaluate('document.querySelector("[data-zone-id]").dataset.zoneId');
      await click('[data-testid=zone-edit-' + id + ']'); await input('[name=fee]', '34567'); await click('[data-testid=zone-form-save]'); await waitFor('!document.querySelector("[data-testid=zone-form]")');
      assert.equal(fixture.sqlite.prepare('SELECT fee FROM delivery_zones WHERE id=?').get(id).fee, 34567);
      await click('[data-testid=zone-toggle-' + id + ']'); await pause(400);
      await click('[data-testid=zone-template-download]'); await waitFor('!document.querySelector("[data-testid=zone-template-download]").disabled');
    }
    await screenshot(tag + '-zones');
    await click('[data-testid=zone-import-open]');
    const area = availableArea(), zone = { ...area, fee: 22000, free_from_amount: 500000, eta_minutes: 120, is_active: true };
    await selectFile([{ ...zone, fee: -1 }], 'zones.xlsx'); await waitFor('document.querySelector("[data-testid=zone-import-errors]")');
    await check('document.querySelector("[data-testid=zone-import-errors]").textContent.includes("2") && document.querySelector("[data-testid=zone-import-confirm]").disabled', tag + ' zone Excel row error blocks submit');
    await selectFile([zone], 'zones.xlsx'); await waitFor('document.querySelector("[data-testid=zone-import-summary]") && !document.querySelector("[data-testid=zone-import-confirm]").disabled');
    await key('Tab'); await check('Boolean(document.activeElement.closest("[role=dialog]"))', tag + ' Excel keyboard focus trapped');
    await screenshot(tag + '-excel'); await click('[data-testid=zone-import-confirm]'); await waitFor('document.querySelector("[data-testid=zone-import-summary]") && !document.querySelector("[data-testid=zone-import-confirm]")'); await key('Escape');
    assert.equal(fixture.sqlite.prepare('SELECT fee FROM delivery_zones WHERE province_name=? AND ward_name=?').get(zone.province_name, zone.ward_name).fee, 22000);
    await navigate('/admin/dashboard');
    await click('[data-testid=admin-dashboard] button[aria-haspopup=dialog]'); await waitFor('document.querySelector("[data-testid=admin-orders-dialog] tbody tr")'); await pause(250);
    await ratio('[data-testid=admin-orders-dialog]', tag + ' all-orders popup 80vw/85dvh');
    if (language === 'en' && width === 1440) {
      await selectSize('[data-testid=admin-orders-dialog] [data-admin-pagination]', 20);
      assert.equal(requests.filter(r=>r.path==='/api/admin/orders').at(-1).query.limit, '20');
    }
    await screenshot(tag + '-all-orders');
    await click('[data-testid=admin-orders-dialog] tbody tr'); await waitFor('document.querySelector("[data-testid=admin-order-detail]")'); await pause(250);
    await ratio('[data-testid=admin-order-dialog]', tag + ' order-detail popup 80vw/85dvh');
    await check('document.documentElement.scrollWidth<=innerWidth', tag + ' popup root fits viewport');
    await screenshot(tag + '-order-detail'); await key('Escape'); await key('Escape');
  }
  assert.deepEqual(exceptions, []);
  writeFileSync(path.join(output, 'result.json'), JSON.stringify({ checks, requests, cancelledInterceptions, data: 'in-memory SQLite and synthetic admin; no persisted or remote writes', exceptions }, null, 2));
  console.log(`PASS ${checks.length} admin table browser checks; server paging, draft/save/delete, Excel zones, 80vw/85dvh popups; EN/VI1440/390/320.`);
} finally { ws?.close(); browser.kill(); fixture.close(); }
