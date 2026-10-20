import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contrast } from '../src/shared/theme/themes.ts';

const origin = process.argv[2] || 'http://127.0.0.1:4173';
const parsedOrigin = new URL(origin);
if (parsedOrigin.hostname !== '127.0.0.1' || parsedOrigin.username || parsedOrigin.password) throw new Error('Loopback preview only');
const fontFile = process.argv.find(arg => arg.startsWith('--font-cache='))?.slice(13);
const fonts = fontFile ? JSON.parse(readFileSync(fontFile, 'utf8')) : {};
const output = path.resolve('.security-review/refinements');
const profile = path.join(output, 'edge-' + Date.now());
mkdirSync(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-gpu', '--disable-sync', '--no-first-run', '--disable-background-networking',
  '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let ws, nextId = 0, admin = false;
const pending = new Map(), checks = [], exceptions = [], blockedWrites = [];
const snapshots = {};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function send(method, params = {}) {
  const id = ++nextId, result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params }));
  return result;
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function frame() { await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))'); }
async function waitFor(expression) {
  for (let i = 0; i < 200; i++) { if (await evaluate('Boolean(' + expression + ')')) return; await pause(50); }
  throw new Error('Timeout: ' + expression);
}
async function check(expression, label) { assert.ok(await evaluate(expression), label); checks.push(label); }
async function click(selector) { await evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()'); await frame(); }
async function key(value, modifiers = 0) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code: value, modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code: value, modifiers });
  await frame();
}
async function size(width, height = width < 768 ? 844 : 1000) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 }); await frame(); }
async function navigate(route) {
  await send('Page.navigate', { url: origin + route });
  await waitFor('document.readyState==="complete" && document.querySelector("h1")');
  await frame();
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(output, name + '.png'), Buffer.from(data, 'base64'));
}
async function fulfill(requestId, body, status = 200) {
  await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
}
try {
  for (const route of ['/api/products', '/api/categories', '/api/delivery/options']) {
    const response = await fetch(origin + route);
    assert.ok(response.ok, 'Public GET snapshot: ' + route);
    snapshots[route] = await response.json();
  }
  const product = snapshots['/api/products'].data.items.find(item => item.variants.some(variant => variant.in_stock));
  assert.ok(product, 'One local product in stock');
  const variant = product.variants.find(item => item.in_stock);
  const detail = await fetch(origin + '/api/products/' + product.slug);
  assert.ok(detail.ok, 'Public detail snapshot');
  snapshots['/api/products/' + product.slug] = await detail.json();
  let target;
  for (let i = 0; i < 200 && !target; i++) {
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
    if (message.method === 'Fetch.requestPaused') intercept(message.params).catch(error => { exceptions.push(error.message); send('Fetch.failRequest', { requestId: message.params.requestId, errorReason: 'Failed' }).catch(() => {}); });
  });
  async function intercept({ requestId, request }) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      // This runner never sends order, upload, session or admin writes to D1.
      if (request.method !== 'GET') { blockedWrites.push(url.pathname); await fulfill(requestId, { error: { code: 'TEST_WRITE_BLOCKED' } }, 403); return; }
      if (url.pathname === '/api/admin/me') { await fulfill(requestId, admin ? { data: { role: 'ADMIN' } } : { error: { code: 'UNAUTHORIZED' } }, admin ? 200 : 401); return; }
      if (url.pathname === '/api/admin/summary') { await fulfill(requestId, { data: { today_orders: 0, low_stock_count: 0, period_days: 30, orders_by_status: {} } }); return; }
      if (url.pathname === '/api/admin/orders') { await fulfill(requestId, { data: { items: [], total: 0, limit: 20, offset: 0 } }); return; }
      if (url.pathname === '/api/admin/products') { await fulfill(requestId, { data: { items: [] } }); return; }
      if (url.pathname === '/api/admin/delivery-zones') { await fulfill(requestId, { data: { items: [], provinces: [] } }); return; }
      if (snapshots[url.pathname]) { await fulfill(requestId, snapshots[url.pathname]); return; }
    }
    const font = fonts[request.url];
    if (font) { await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: font.mime }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: font.body }); return; }
    await send('Fetch.continueRequest', { requestId });
  }
  await send('Page.enable'); await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*', requestStage: 'Request' }, { urlPattern: '*fonts.googleapis.com/*', requestStage: 'Request' }, { urlPattern: '*fonts.gstatic.com/*', requestStage: 'Request' }] });
  await size(1440); await navigate('/');
  await evaluate("localStorage.setItem('lunara.theme.v1','original');localStorage.setItem('lunara_language','en')");
  await navigate('/');
  await send('DOM.enable'); await send('CSS.enable');
  const { root: documentNode } = await send('DOM.getDocument');
  const { nodeId } = await send('DOM.querySelector', { nodeId: documentNode.nodeId, selector: '[data-home-hero] a' });
  await send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['focus-visible'] });
  await frame();
  // Tailwind transition-colors also interpolates outline-color; inspect its settled state.
  await pause(250);
  const focus = await evaluate("(()=>{const e=document.querySelector('[data-home-hero] a'),s=getComputedStyle(e),ctx=document.createElement('canvas').getContext('2d',{willReadFrequently:true});ctx.fillStyle='#F8FBFA';ctx.fillRect(0,0,1,1);ctx.fillStyle=s.outlineColor;ctx.fillRect(0,0,1,1);return {color:s.outlineColor,width:s.outlineWidth,style:s.outlineStyle,pixels:[...ctx.getImageData(0,0,1,1).data]}})()");
  const outlineHex = '#' + focus.pixels.slice(0, 3).map(value => value.toString(16).padStart(2, '0')).join('');
  const focusContrast = contrast(outlineHex, '#F8FBFA');
  assert.ok(parseFloat(focus.width) >= 2 && focus.style !== 'none', 'Focus is visible');
  assert.ok(focusContrast >= 3, 'Original focus contrast >=3:1: ' + JSON.stringify({ focus, focusContrast })); checks.push('Original focus contrast >=3:1');
  await send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
  await check("!document.querySelector('[data-zalo-contact]')", 'Unconfigured floating contact is hidden');
  await evaluate(`localStorage.setItem('lunara.cart.v1',JSON.stringify({version:1,lines:[{variantId:${variant.id},quantity:1}]}))`);
  for (const language of ['en', 'vi']) {
    await evaluate("localStorage.setItem('lunara_language'," + JSON.stringify(language) + ')');
    for (const width of [320, 390, 640, 768, 1024, 1440]) {
      await size(width);
      await navigate('/shop'); await waitFor("document.querySelector('[data-product-id]')");
      if (width === 390) await screenshot('shop-mobile-' + language);
      if (width < 640) {
        await check("document.querySelector('[data-shop-filter-toggle]').getAttribute('aria-expanded')==='false' && !document.querySelector('#shop-price-range').getClientRects().length", 'Secondary mobile filters start collapsed ' + language + '/' + width);
        await click('[data-shop-filter-toggle]');
        await check("document.querySelector('#shop-price-range').getClientRects().length>0", 'Mobile filter disclosure opens ' + language + '/' + width);
      }
      await check('document.documentElement.scrollWidth<=innerWidth', 'Shop fits ' + language + '/' + width);
      await navigate('/checkout'); await waitFor("document.querySelector('[name=senderName]')");
      await check("[...document.querySelectorAll('[data-checkout-form] input:not([type=checkbox]):not([type=radio]),[data-checkout-form] textarea')].every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)", 'Checkout controls >=16px ' + language + '/' + width);
      const placeholderPairs = await evaluate("(()=>{const ctx=document.createElement('canvas').getContext('2d',{willReadFrequently:true});const hex=()=>[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('');return [...document.querySelectorAll('[data-checkout-form] input[placeholder]:not(:disabled),[data-checkout-form] textarea[placeholder]')].map(e=>{ctx.globalAlpha=1;ctx.fillStyle=getComputedStyle(e).backgroundColor;ctx.fillRect(0,0,1,1);const background='#'+hex();const s=getComputedStyle(e,'::placeholder');ctx.fillStyle=s.color;ctx.globalAlpha=parseFloat(s.opacity);ctx.fillRect(0,0,1,1);return {background,foreground:'#'+hex()}})})()");
      assert.ok(placeholderPairs.length > 0 && placeholderPairs.every(pair => contrast(pair.foreground, pair.background) >= 4.5), 'Checkout placeholder contrast >=4.5:1 ' + language + '/' + width);
      checks.push('Checkout placeholder contrast >=4.5:1 ' + language + '/' + width);
      await check('document.documentElement.scrollWidth<=innerWidth', 'Checkout fits ' + language + '/' + width);
      if (width === 1440) {
        await evaluate('scrollTo(0,600)'); await frame();
        await check("document.querySelector('[data-checkout-summary]').getBoundingClientRect().top>=document.querySelector('[data-storefront-header]').getBoundingClientRect().bottom+15", 'Checkout summary clears header ' + language);
        await screenshot('checkout-sticky-' + language);
      }
      if (width === 390) await screenshot('checkout-mobile-' + language);
      await navigate('/orders/track');
      await check("[...document.querySelectorAll('[data-order-lookup] input')].every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)", 'Tracking controls >=16px ' + language + '/' + width);
    }
  }
  admin = true;
  for (const language of ['en', 'vi']) for (const width of [390, 1440]) {
    await evaluate("localStorage.setItem('lunara_language'," + JSON.stringify(language) + ')'); await size(width);
    for (const route of ['/admin/dashboard', '/admin/orders', '/admin/stock', '/admin/delivery-zones']) {
      await navigate(route); await waitFor("document.querySelector('main [data-testid]')");
      await check("document.querySelector('h1').getClientRects().length>0", 'Admin page heading visible ' + route + '/' + language + '/' + width);
      await check('document.documentElement.scrollWidth<=innerWidth', 'Admin fits ' + route + '/' + language + '/' + width);
    }
  }
  await size(390); await navigate('/admin/dashboard');
  await click('header [aria-haspopup=dialog]'); await waitFor("document.querySelector('[data-admin-mobile-menu]')");
  await check("document.activeElement.closest('[data-admin-mobile-menu]')!==null", 'Admin menu receives focus');
  for (let i = 0; i < 16; i++) { await key('Tab'); await check("document.activeElement.closest('[data-admin-mobile-menu]')!==null", 'Admin Tab stays in menu ' + i); }
  await key('Tab', 8); await check("document.activeElement.closest('[data-admin-mobile-menu]')!==null", 'Admin Shift+Tab stays in menu');
  await screenshot('admin-mobile-menu');
  await key('Escape'); await waitFor("!document.querySelector('[data-admin-mobile-menu]')");
  await check("document.activeElement.matches('header [aria-haspopup=dialog]')", 'Admin Escape restores trigger focus');
  await click('header [aria-haspopup=dialog]'); await waitFor("document.querySelector('[data-admin-mobile-menu]')");
  await size(1024); await waitFor("!document.querySelector('[data-admin-mobile-menu]')");
  await check("!document.querySelector('main').closest('[aria-hidden=true]') && getComputedStyle(document.body).pointerEvents!=='none'", 'Desktop resize releases modal background');
  assert.deepEqual(blockedWrites, [], 'No API writes attempted'); assert.deepEqual(exceptions, [], 'No runtime exceptions');
  const result = { checks: checks.length, focus, focusContrast, languages: ['en', 'vi'], widths: [320, 390, 640, 768, 1024, 1440], apiMode: 'Cached public GET snapshots and synthetic read-only admin responses', blockedWrites, exceptions };
  writeFileSync(path.join(output, 'results.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
} catch (error) {
  try { await screenshot('failure'); } catch {}
  throw error;
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await Promise.race([send('Browser.close'), pause(1000)]); } catch {} ws.close(); }
  browser.kill();
}
