import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { themes } from '../src/shared/theme/themes.ts';

const origin = process.argv[2] || 'http://127.0.0.1:4173';
const url = new URL(origin);
if (url.hostname !== '127.0.0.1' || url.username || url.password) throw new Error('Loopback preview only');
const baseline = process.argv.includes('--baseline');
const entry = process.argv.find(value => value.startsWith('--entry='))?.slice(8);
if (entry && (!entry.startsWith('/') || entry.startsWith('//'))) throw new Error('Entry must be a local path');
const stage = baseline ? 'before' : entry ? 'entry' : 'after';
const apiOrigin = process.argv.find(value => value.startsWith('--api-origin='))?.slice(13) || origin;
if (new URL(apiOrigin).hostname !== '127.0.0.1') throw new Error('Loopback API snapshots only');
const fontFile = process.argv.find(value => value.startsWith('--font-cache='))?.slice(13);
const fonts = fontFile ? JSON.parse(readFileSync(fontFile, 'utf8')) : {};
const output = path.resolve('.security-review/landing-motion');
const profile = path.join(output, 'edge-' + Date.now());
mkdirSync(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-sync', '--no-first-run', '--disable-background-networking',
  '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const pending = new Map(), checks = [], exceptions = [], snapshots = {}, layouts = {};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, nextId = 0, catalogMode = 'loaded', imageMode = 'loaded', blockedWrites = 0;
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
  for (let i = 0; i < 200; i++) { if (await evaluate('Boolean(' + expression + ')')) return; await pause(40); }
  throw new Error('Timeout: ' + expression);
}
async function check(expression, label) { assert.ok(await evaluate(expression), label); checks.push(label); }
async function click(selector) { await evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()'); await pause(60); }
async function size(width) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: width < 768 ? 844 : 1000, deviceScaleFactor: 1, mobile: width < 768 });
  await send('Emulation.setTouchEmulationEnabled', { enabled: width < 768 });
}
async function reduce(value) { await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: value ? 'reduce' : 'no-preference' }] }); }
async function navigate(route = '/') {
  await send('Page.navigate', { url: origin + (route === '/' && entry ? entry : route) });
  await waitFor('document.readyState === "complete" && document.querySelector("h1")');
  await evaluate('document.fonts.ready.then(() => true)');
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(output, name + '.png'), Buffer.from(data, 'base64'));
}
async function fulfill(requestId, body, status = 200) {
  await send('Fetch.fulfillRequest', { requestId, responseCode: status,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
}
async function intercept({ requestId, request, resourceType }) {
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== origin) {
    const font = fonts[request.url];
    if (font) return send('Fetch.fulfillRequest', { requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: font.mime }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: font.body });
    return send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
  }
  if (resourceType === 'Image' && imageMode !== 'loaded') {
    if (imageMode === 'slow') await pause(1400);
    else return send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
  }
  if (!requestUrl.pathname.startsWith('/api/')) return send('Fetch.continueRequest', { requestId });
  if (request.method !== 'GET' && requestUrl.pathname !== '/api/checkout/quote') { blockedWrites++; return fulfill(requestId, { error: { code: 'TEST_WRITE_BLOCKED' } }, 403); }
  if (requestUrl.pathname === '/api/admin/me') return fulfill(requestId, { error: { code: 'UNAUTHORIZED' } }, 401);
  if (requestUrl.pathname === '/api/products' && requestUrl.searchParams.has('featured')) {
    if (catalogMode === 'slow') await pause(1600);
    if (catalogMode === 'error') return fulfill(requestId, { error: { code: 'INTERNAL' } }, 500);
    const data = structuredClone(snapshots['/api/products'].data);
    // Four cards are synthetic browser data only; never change the seeded D1 catalog.
    data.items = catalogMode === 'empty' ? [] : data.items.slice(0, 4).map(item => ({ ...item, is_featured: true }));
    data.total = data.items.length;
    return fulfill(requestId, { data });
  }
  if (snapshots[requestUrl.pathname + requestUrl.search]) return fulfill(requestId, snapshots[requestUrl.pathname + requestUrl.search]);
  const response = await fetch(apiOrigin + requestUrl.pathname + requestUrl.search, {
    method: request.method,
    ...(request.postData ? { headers: { 'Content-Type': 'application/json' }, body: request.postData } : {}),
  });
  return fulfill(requestId, await response.json(), response.status);
}
const targets = '[data-hero-copy] > *, [data-service-item], [data-featured-heading] > *, [data-product-appearance="featured"], [data-journey-heading] > *, [data-home-journey] li, [data-story-copy] > *, [data-story-photo]';
const visible = `Array.from(document.querySelectorAll(${JSON.stringify(targets)})).every(e => +getComputedStyle(e).opacity === 1)`;
const count = "window.__arrivals.filter(x => x.target === 'product').length";
async function scrollTo(selector) {
  await evaluate('document.querySelector(' + JSON.stringify(selector) + ').scrollIntoView({block:"center"})');
  await pause(100);
}
async function sweep() {
  for (const selector of ['[data-home-services]', '#featured', '[data-home-journey]', '[data-home-story]']) {
    await scrollTo(selector); await pause(950);
  }
  await evaluate('scrollTo(0,document.body.scrollHeight)'); await pause(1000);
  await check(visible, 'No hidden content after scroll');
}
try {
  for (const route of ['/api/products', '/api/categories']) {
    const response = await fetch(apiOrigin + route); assert.ok(response.ok, 'Local GET ' + route);
    snapshots[route] = await response.json();
  }
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
    if (message.method === 'Fetch.requestPaused') intercept(message.params).catch(error => {
      if (!error.message.includes('Invalid InterceptionId')) exceptions.push(error.message);
    });
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__arrivals = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function(keyframes, options) {
      if ((Array.isArray(keyframes) ? keyframes.some(f => 'opacity' in f) : 'opacity' in keyframes)) {
        window.__arrivals.push({target:this.matches('[data-product-id]')?'product':this.tagName, at:performance.now(), options});
      }
      return original.call(this,keyframes,options);
    };
  ` });
  await size(1440); await reduce(false); await navigate();
  if (process.argv.includes('--expect-strict')) await check('window.__strictSetups === 2 && window.__strictCleanups === 1', 'React development StrictMode double effects observed');
  await evaluate("localStorage.removeItem('lunara.cart.v1'); localStorage.setItem('lunara_language','en'); localStorage.setItem('lunara.theme.v1','monochrome')");
  if (!baseline) {
    await navigate(); await pause(100); await screenshot('hero-entrance-1');
    await pause(200); await screenshot('hero-entrance-2');
  }
  for (const width of process.argv.includes('--quick') ? [1440] : [1440, 1920, 768, 375, 390]) {
    await size(width); await navigate();
    await waitFor('document.querySelectorAll("#featured [data-product-id]").length === 4');
    await pause(1000);
    await screenshot(`${stage}-${width}-hero`);
    await sweep();
    await scrollTo('#featured'); await pause(950);
    await screenshot(`${stage}-${width}-featured`);
    layouts[width] = await evaluate(`Array.from(document.querySelectorAll('[data-home-layout] > section, #featured [data-product-id], [data-story-photo]')).map(e => {
      const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,x:Math.round(r.x),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height),background:s.backgroundColor,font:s.fontFamily};
    })`);
    await check(`document.documentElement.scrollWidth <= ${width}`, 'No overflow at ' + width);
    if (!baseline && existsSync(path.join(output, 'before-layouts.json'))) {
      const before = JSON.parse(readFileSync(path.join(output, 'before-layouts.json'), 'utf8'));
      assert.deepEqual(layouts[width], before[width], 'Layout/colors/type preserved at ' + width); checks.push('Baseline layout preserved ' + width);
    }
    if (!baseline) {
      const arrivalsBeforeLocale = await evaluate(count);
      await click('[data-language-switcher] button[lang=vi]');
      await check(`document.documentElement.lang === 'vi' && document.documentElement.scrollWidth <= ${width}`, 'Vietnamese fits at ' + width);
      await check(count + ' === ' + arrivalsBeforeLocale, 'Locale preserves entrances at ' + width);
      await screenshot('after-' + width + '-vi-featured');
      await click('[data-language-switcher] button[lang=en]');
      if (width === 390) {
        for (const selector of ['[data-product-favorite]', '[data-product-add]']) {
          await scrollTo(selector); await pause(250);
          const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
          await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
          await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(100);
        }
        await check("document.querySelector('[data-product-add]').dataset.added === 'true' && document.querySelector('[data-product-favorite]').getAttribute('aria-pressed') === 'true'", 'Mobile touch Add/wishlist');
      }
    }
  }
  writeFileSync(path.join(output, `${stage}-layouts.json`), JSON.stringify(layouts, null, 2));
  if (!baseline) {
    await size(1440); await navigate();
    await scrollTo('#featured'); await pause(1000);
    await check(count + ' === 4', 'Four native card entrances');
    const arrivals = await evaluate(count);
    const geometry = await evaluate("[...document.querySelectorAll('#featured [data-product-id]')].map(e=>e.getBoundingClientRect().y)");
    await click('[data-product-add]'); await click('[data-product-favorite]');
    await check("document.querySelector('[data-product-add]').dataset.added === 'true' && document.querySelector('[data-product-favorite]').getAttribute('aria-pressed') === 'true'", 'Add/wishlist feedback');
    await click('[data-language-switcher] button[lang=vi]'); await pause(900);
    await check(count + ' === ' + arrivals, 'Cart/wishlist/locale do not replay grid');
    assert.deepEqual(await evaluate("[...document.querySelectorAll('#featured [data-product-id]')].map(e=>e.getBoundingClientRect().y)"), geometry, 'Cart keeps card positions');
    await click('[data-language-switcher] button[lang=en]');
    const image = '[data-product-image-link] img';
    const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(image)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point }); await pause(450);
    await check(`Math.abs(parseFloat(getComputedStyle(document.querySelector(${JSON.stringify(image)})).scale) - 1.025) < .001`, 'Featured hover zoom 1.025');
    await check("getComputedStyle(document.querySelector('[data-product-detail-overlay]')).opacity === '1'", 'Detail overlay fades on hover');
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
    await evaluate("document.querySelector('[data-product-image-link]').focus()");
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' });
    await check("document.activeElement.matches('[data-product-name-link]') && document.activeElement.matches(':focus-visible') && getComputedStyle(document.activeElement).outlineStyle !== 'none'", 'Keyboard focus remains visible');
    await evaluate('scrollTo(0,document.body.scrollHeight); scrollTo(0,0)'); await pause(900);
    await sweep(); await check(count + ' === ' + arrivals, 'Fast scroll/back does not replay cards');
    for (const theme of themes) {
      await evaluate("document.querySelector('#header-theme').click()");
      await waitFor("document.querySelector('[role=option][data-value=" + JSON.stringify(theme.id) + "]')");
      await click('[role=option][data-value="' + theme.id + '"]');
      await check("document.documentElement.dataset.lunaraTheme === " + JSON.stringify(theme.id), 'Theme ' + theme.id);
    }
    await check(count + ' === ' + arrivals, 'Theme changes do not replay cards');
    await click('[data-hero-shop]'); await waitFor('document.querySelector("[data-shop-layout]")');
    await click('[data-storefront-logo-art]'); await waitFor('document.querySelector("[data-home-hero]")');
    await pause(1000); await sweep();
    await check(count + ' === ' + arrivals + ' + document.querySelectorAll("#featured [data-product-id]").length', 'SPA Home return replays once per current product on new mount');
    for (const route of ['/shop', '/shop/' + snapshots['/api/products'].data.items[0].slug, '/cart', '/checkout', '/orders/track', '/about', '/admin/login', '/admin']) {
      await navigate(route); await check('!document.querySelector("[data-home-layout]") && !document.querySelector("[data-featured-heading]")', 'No Home motion markers on ' + route);
    }
    await evaluate("localStorage.removeItem('lunara.cart.v1')");
    for (const mode of ['slow', 'error', 'empty']) {
      catalogMode = mode; await navigate();
      if (mode === 'slow') {
        await check('!!document.querySelector("#featured [role=status]") && !document.querySelector("#featured [data-product-id]")', 'Loading is visible');
        await scrollTo('#featured'); await waitFor('document.querySelectorAll("#featured [data-product-id]").length === 4'); await pause(950);
        await check(visible, 'Late cards remain visible');
      } else {
        await waitFor('document.querySelector("#featured [role=' + (mode === 'error' ? 'alert' : 'status') + ']")');
        await check('!document.querySelector("#featured [data-product-id]")', mode + ' has no stale cards');
        if (mode === 'error') { catalogMode = 'loaded'; await click('#featured [role=alert] button'); await waitFor('document.querySelectorAll("#featured [data-product-id]").length === 4'); await sweep(); }
      }
    }
    catalogMode = 'loaded';
    await reduce(true); await navigate(); await sweep();
    await check(`Array.from(document.querySelectorAll(${JSON.stringify(targets + ', [data-home-hero] picture')})).every(e => new DOMMatrixReadOnly(getComputedStyle(e).transform).isIdentity)`, 'Reduced motion has no entrance transforms');
    await check(count + ' === 0', 'Reduced motion has no card animation');
    await reduce(false); await navigate(); await scrollTo('#featured'); await pause(100); await reduce(true); await pause(100);
    await check(visible, 'Live reduce cancels entrances and restores visibility');
    await check(`Array.from(document.querySelectorAll(${JSON.stringify(targets + ', [data-home-hero] picture')})).every(e => new DOMMatrixReadOnly(getComputedStyle(e).transform).isIdentity)`, 'Live reduce clears spatial movement');
    await reduce(false);
    for (const mode of ['failed', 'slow']) {
      imageMode = mode; await send('Network.clearBrowserCache'); await navigate(); await sweep();
      await check(visible, mode + ' images do not hide copy/cards');
      if (mode === 'failed') await check("document.querySelectorAll('[data-story-photo][data-image-fallback]').length === 3", 'Failed Story images retain fallback');
    }
    imageMode = 'slow'; await send('Network.clearBrowserCache');
    await send('Page.navigate', { url: origin + (entry || '/') });
    await waitFor('document.querySelector("[data-hero-shop]")');
    await click('[data-hero-shop]'); await pause(1600);
    await check('!document.querySelector("[data-home-hero]")', 'Late image listener cleaned up on unmount');
    imageMode = 'loaded';
    const { identifier } = await send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.IntersectionObserver = undefined;' });
    await navigate(); await pause(1100); await sweep(); await check(visible, 'Missing observer keeps content visible');
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
    assert.equal(exceptions.length, 0, 'No runtime exceptions');
    assert.equal(blockedWrites, 0, 'No API write attempted');
  }
  writeFileSync(path.join(output, `${stage}-results.json`), JSON.stringify({ checks, exceptions, blockedWrites }, null, 2));
  console.log(JSON.stringify({ baseline, checks: checks.length, exceptions, blockedWrites, output }));
} catch (error) {
  try {
    await screenshot('failure');
    const state = await evaluate(`({reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,targets:Array.from(document.querySelectorAll(${JSON.stringify(targets)})).map(e=>({tag:e.tagName,product:e.dataset.productId,style:e.getAttribute('style'),opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform}))})`);
    writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: error.message, checks, exceptions, state }, null, 2));
  } catch {}
  throw error;
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  browser.kill();
}
