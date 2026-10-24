import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { homeFaqs } from '../src/features/landing/home-faq.ts';
import { themes } from '../src/shared/theme/themes.ts';

const origin = new URL(process.argv[2] || 'http://127.0.0.1:4173').origin;
const apiOrigin = new URL(process.argv.find(value => value.startsWith('--api-origin='))?.slice(13) || origin).origin;
for (const value of [origin, apiOrigin]) if (new URL(value).hostname !== '127.0.0.1') throw new Error('Loopback only');
const fontFile = process.argv.find(value => value.startsWith('--font-cache='))?.slice(13);
const fonts = fontFile ? JSON.parse(readFileSync(fontFile, 'utf8')) : {};
const locales = Object.fromEntries(['en', 'vi'].map(language => [language, JSON.parse(readFileSync('src/shared/i18n/locales/' + language + '/landing.json', 'utf8'))]));
const output = path.resolve('.security-review/home-faq');
const profile = path.join(output, 'edge-' + Date.now());
mkdirSync(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-sync', '--no-first-run', '--disable-background-networking',
  '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const pending = new Map(), checks = [], exceptions = [], snapshots = {};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, nextId = 0, catalogMode = 'loaded', blockedWrites = 0;
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
  for (let i = 0; i < 250; i++) { if (await evaluate('Boolean(' + expression + ')')) return; await pause(40); }
  throw new Error('Timeout: ' + expression);
}
async function check(expression, label) { assert.ok(await evaluate(expression), label); checks.push(label); }
async function click(selector) { await evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()'); await pause(40); }
async function key(value) {
  const virtualKey = { Tab: 9, Enter: 13, ' ': 32, ArrowDown: 40, Home: 36, End: 35 }[value];
  const parameters = { key: value, code: value === ' ' ? 'Space' : value, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...parameters, text: value === 'Enter' ? '\r' : value === ' ' ? ' ' : undefined });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...parameters });
  await pause(40);
}
async function size(width) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: width < 768 ? 844 : 1000, deviceScaleFactor: 1, mobile: width < 768 });
  await send('Emulation.setTouchEmulationEnabled', { enabled: width < 768 });
}
async function reduce(value) { await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: value ? 'reduce' : 'no-preference' }] }); }
async function navigate(route) {
  await send('Page.navigate', { url: origin + route });
  await waitFor('document.readyState === "complete" && document.querySelector("h1")');
  await evaluate('document.fonts.ready.then(() => true)');
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(output, name + '.png'), Buffer.from(data, 'base64'));
}
async function fulfill(requestId, body, status = 200) {
  return send('Fetch.fulfillRequest', { requestId, responseCode: status,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
}
async function intercept({ requestId, request }) {
  const url = new URL(request.url);
  if (url.origin !== origin) {
    const font = fonts[request.url];
    if (font) return send('Fetch.fulfillRequest', { requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: font.mime }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: font.body });
    return send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
  }
  if (!url.pathname.startsWith('/api/')) return send('Fetch.continueRequest', { requestId });
  if (request.method !== 'GET') { blockedWrites++; return fulfill(requestId, { error: { code: 'TEST_WRITE_BLOCKED' } }, 403); }
  if (url.pathname === '/api/admin/me') return fulfill(requestId, { error: { code: 'UNAUTHORIZED' } }, 401);
  const snapshot = snapshots[url.pathname + url.search];
  if (url.pathname === '/api/products' && url.searchParams.has('featured')) {
    if (catalogMode === 'slow') await pause(1600);
    if (catalogMode === 'error') return fulfill(requestId, { error: { code: 'INTERNAL' } }, 500);
    if (catalogMode === 'empty') return fulfill(requestId, { data: { ...snapshot.data, items: [], total: 0 } });
  }
  if (snapshot) return fulfill(requestId, snapshot);
  const response = await fetch(apiOrigin + url.pathname + url.search);
  return fulfill(requestId, await response.json(), response.status);
}
const item = id => '#faq [data-faq-item="' + id + '"]';
const opened = '#faq [data-faq-question][aria-expanded=true]';
const faqContrast = `(() => {
  const canvas=document.createElement('canvas'), context=canvas.getContext('2d');
  const color=value=>{context.clearRect(0,0,1,1);context.fillStyle=value;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data];};
  const background=element=>{if(!element)return [255,255,255,255];const c=color(getComputedStyle(element).backgroundColor),a=c[3]/255,p=background(element.parentElement);return c.slice(0,3).map((v,i)=>v*a+p[i]*(1-a)).concat(255);};
  const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  return [...document.querySelectorAll('#faq h2, #faq p, #faq [data-faq-question]')].every(element=>{
    const a=luminance(color(getComputedStyle(element).color)),b=luminance(background(element));
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05) >= (element.tagName==='H2'?3:4.5);
  });
})()`;
const anchorVisible = `(() => {
  const section=document.querySelector('#faq').getBoundingClientRect(), heading=document.querySelector('#home-faq-title').getBoundingClientRect();
  const header=document.querySelector('[data-storefront-header]').getBoundingClientRect();
  return section.top >= header.bottom + 20 && section.top <= header.bottom + 28 && heading.top >= header.bottom && heading.bottom < innerHeight;
})()`;
async function chooseTheme(id) {
  await click('#header-theme');
  await waitFor("document.querySelector('[role=option][data-value=" + JSON.stringify(id) + "]')");
  await click('[role=option][data-value="' + id + '"]');
  await check('document.documentElement.dataset.lunaraTheme === ' + JSON.stringify(id), 'Theme selected ' + id);
}
try {
  for (const route of ['/api/products?featured=1', '/api/products', '/api/categories']) {
    const response = await fetch(apiOrigin + route); assert.ok(response.ok, 'Local GET snapshot ' + route);
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
    window.__faqScrollCalls=0;
    const scroll=window.scrollTo;
    window.scrollTo=function(...args){ window.__faqScrollCalls++; return scroll.apply(this,args); };
  ` });
  await size(1440); await reduce(false); await navigate('/');
  await evaluate("localStorage.removeItem('lunara.cart.v1'); localStorage.setItem('lunara_language','en'); localStorage.setItem('lunara.theme.v1','monochrome')");
  for (const width of process.argv.includes('--quick') ? [1440] : [1440, 768, 390, 375]) {
    await size(width);
    for (const language of process.argv.includes('--quick') ? ['en'] : ['en', 'vi']) {
      await navigate('/'); await click('[data-language-switcher] button[lang=' + language + ']');
      await waitFor('document.querySelectorAll("#featured [data-product-id]").length > 0');
      await evaluate("scrollTo(0,scrollY+document.querySelector('#faq').getBoundingClientRect().top-document.querySelector('[data-storefront-header]').getBoundingClientRect().height-24)"); await pause(850);
      await check('document.querySelectorAll("#faq [data-faq-question]").length === 8 && !document.querySelector("' + opened + '")', 'Eight closed questions ' + width + '/' + language);
      await check("document.querySelector('[data-home-story]').nextElementSibling.matches('#faq') && document.querySelector('[data-home-layout]').lastElementChild.matches('#faq')", 'FAQ follows Story ' + width + '/' + language);
      await check(`(()=>{const a=document.querySelector('[data-faq-intro]').getBoundingClientRect(), b=document.querySelector('[data-faq-list]').getBoundingClientRect();return ${width >= 1024 ? 'b.left > a.left && Math.abs(b.top-a.top)<2' : 'b.top > a.bottom && Math.abs(a.left-b.left)<2'};})()`, 'Responsive columns ' + width + '/' + language);
      await check(`document.documentElement.scrollWidth <= ${width} && [...document.querySelectorAll('#faq [data-faq-question]')].every(e => e.getBoundingClientRect().height >= 44)`, 'No overflow/touch targets ' + width + '/' + language);
      const ids = await evaluate("[...document.querySelectorAll('#faq [id]')].map(e=>e.id)");
      assert.equal(new Set(ids).size, ids.length, 'Unique disclosure IDs');
      await check("[...document.querySelectorAll('#faq [data-faq-question]')].every(e=>e.tagName==='BUTTON' && e.parentElement.tagName==='H3' && document.getElementById(e.getAttribute('aria-controls'))?.getAttribute('aria-labelledby')===e.id)", 'Accessible control/panel relationships ' + width + '/' + language);
      await evaluate('window.__faqScrollCalls=0');
      for (const faq of homeFaqs) {
        assert.ok(locales[language][faq.question] && locales[language][faq.answer], 'Translated FAQ keys');
        await click(item(faq.id) + ' [data-faq-question]'); await pause(250);
        await check(`document.querySelectorAll(${JSON.stringify(opened)}).length === 1 && document.querySelector(${JSON.stringify(item(faq.id) + ' [data-faq-panel]')}).textContent.trim() === ${JSON.stringify(locales[language][faq.answer])} && document.querySelector(${JSON.stringify(item(faq.id) + ' [data-faq-question]')}).textContent.trim() === ${JSON.stringify(locales[language][faq.question])}`, 'Translated answer ' + faq.id + ' ' + width + '/' + language);
      }
      await check('window.__faqScrollCalls === 0', 'Disclosure does not call scrollTo ' + width + '/' + language);
      await click(item('order-tracking') + ' [data-faq-question]'); await pause(250);
      await check('!document.querySelector(' + JSON.stringify(opened) + ') && [...document.querySelectorAll("#faq [data-faq-panel]")].every(e=>e.hidden)', 'Click again collapses ' + width + '/' + language);
      await click(item('delivery-area') + ' [data-faq-question]'); await pause(250);
      await evaluate("scrollTo(0,scrollY+document.querySelector('#faq').getBoundingClientRect().top-document.querySelector('[data-storefront-header]').getBoundingClientRect().height-24)");
      await screenshot(width + '-' + language);
      if (width === 390) {
        await evaluate("document.querySelector('[data-faq-item=payment] button').scrollIntoView({block:'center'})");
        const point = await evaluate("(()=>{const r=document.querySelector('[data-faq-item=payment] button').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(300);
        await check("document.querySelector('[data-faq-item=payment] button').getAttribute('aria-expanded')==='true'", 'Touch disclosure ' + language);
      }
    }
  }
  await size(1440); await navigate('/#faq'); await pause(1000);
  await check(anchorVisible, 'Direct hash keeps heading below header');
  await check("document.activeElement.id==='faq'", 'Hash focuses FAQ region');
  await key('Tab');
  await check("document.activeElement.matches('[data-faq-item=guest-checkout] button') && document.activeElement.matches(':focus-visible') && getComputedStyle(document.activeElement).outlineStyle !== 'none'", 'Tab and visible keyboard focus');
  await key('Enter'); await pause(250);
  await check("document.activeElement.getAttribute('aria-expanded')==='true'", 'Enter opens');
  await key(' '); await pause(250);
  await check("document.activeElement.getAttribute('aria-expanded')==='false'", 'Space closes');
  await key('ArrowDown'); await check("document.activeElement.closest('[data-faq-item]').dataset.faqItem==='gifting'", 'Arrow navigation');
  await key('End'); await check("document.activeElement.closest('[data-faq-item]').dataset.faqItem==='order-tracking'", 'End moves to last');
  await key('Home'); await check("document.activeElement.closest('[data-faq-item]').dataset.faqItem==='guest-checkout'", 'Home moves to first');
  await evaluate("for(let i=0;i<24;i++)document.querySelectorAll('#faq [data-faq-question]')[i%8].click()"); await pause(300);
  await check('document.querySelectorAll(' + JSON.stringify(opened) + ').length <= 1', 'Rapid toggles keep single open state');
  await click(item('payment') + ' [data-faq-question]'); await pause(250);
  if (await evaluate("document.querySelector('[data-faq-item=payment] button').getAttribute('aria-expanded')!=='true'")) await click(item('payment') + ' [data-faq-question]');
  await click('[data-language-switcher] button[lang=vi]');
  await check("document.querySelector('[data-faq-item=payment] button').getAttribute('aria-expanded')==='true' && document.querySelector('[data-faq-item=payment] [data-faq-panel]').textContent.trim()===" + JSON.stringify(locales.vi['FAQ payment answer']), 'Language preserves open ID and translates answer');
  for (const width of [1440, 390]) {
    await size(width);
    for (const theme of themes) {
      await chooseTheme(theme.id);
      await check(`document.documentElement.scrollWidth <= ${width} && document.querySelector('[data-faq-item=payment] button').getAttribute('aria-expanded')==='true'`, 'Theme preserves disclosure/width ' + width + '/' + theme.id);
      await check(faqContrast, 'FAQ text contrast AA ' + width + '/' + theme.id);
    }
  }
  await size(1440); await click('[data-language-switcher] button[lang=en]');
  const ax = await send('Accessibility.getFullAXTree');
  for (const faq of homeFaqs) assert.ok(ax.nodes.some(node => node.role?.value === 'button' && node.name?.value === locales.en[faq.question]), 'AX button ' + faq.id);
  checks.push('Accessibility tree exposes all eight named buttons');
  for (const width of [1440, 768, 390, 375]) {
    await size(width); await navigate('/shop');
    await check("document.querySelector('[data-storefront-footer] a[href=\"/#faq\"]') && !document.querySelector('#faq')", 'Footer FAQ link on Shop ' + width);
    await click('[data-storefront-footer] a[href="/#faq"]'); await waitFor('document.querySelector("#faq")'); await pause(1000);
    await check(anchorVisible + ' && !document.querySelector("[role=dialog]")', 'Shop to FAQ anchor ' + width);
    await evaluate('scrollTo(0,0)'); await click('[data-storefront-footer] a[href="/#faq"]'); await pause(850);
    await check(anchorVisible, 'Repeated Home hash link ' + width);
  }
  for (const mode of ['slow', 'error', 'empty']) {
    catalogMode = mode; await navigate('/#faq'); await pause(2200);
    await check('document.querySelectorAll("#faq [data-faq-question]").length === 8 && getComputedStyle(document.querySelector("[data-faq-intro]")).opacity === "1"', 'FAQ independent of catalog ' + mode);
    await check(anchorVisible, 'Hash survives catalog ' + mode);
  }
  catalogMode = 'loaded';
  await reduce(true); await navigate('/#faq'); await pause(400);
  await click(item('guest-checkout') + ' [data-faq-question]');
  await check("getComputedStyle(document.querySelector('[data-faq-item=guest-checkout] [data-faq-panel]')).animationName==='none' && getComputedStyle(document.querySelector('[data-faq-intro]')).transform==='none'", 'Reduced motion disables entrance/disclosure movement');
  await reduce(false); await click(item('gifting') + ' [data-faq-question]'); await pause(70); await reduce(true); await pause(150);
  await check("document.querySelector('[data-faq-item=gifting] button').getAttribute('aria-expanded')==='true' && !document.querySelector('[data-faq-item=gifting] [data-faq-panel]').hidden", 'Live reduce keeps answer accessible');
  await reduce(false);
  for (const route of ['/shop', '/about', '/cart', '/checkout', '/orders/track', '/admin/login', '/admin']) {
    await navigate(route); await check('!document.querySelector("[data-home-faq]")', 'FAQ section scoped away from ' + route);
  }
  await navigate('/');
  await check("[...document.querySelectorAll('[data-storefront-footer] [data-footer-coming-soon]')].some(e=>e.textContent.trim()==='Payment Methods')", 'Other footer destinations retain coming-soon behavior');
  assert.equal(exceptions.length, 0, 'No runtime exceptions'); assert.equal(blockedWrites, 0, 'No API write attempted');
  writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, exceptions, blockedWrites }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, exceptions, blockedWrites, output }));
} catch (error) {
  try { await screenshot('failure'); writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: error.message, checks, exceptions, state: await evaluate('({url:location.href,scrollY,header:document.querySelector("[data-storefront-header]")?.getBoundingClientRect().bottom,faqTop:document.querySelector("#faq")?.getBoundingClientRect().top,scrollMargin:document.querySelector("#faq")&&getComputedStyle(document.querySelector("#faq")).scrollMarginTop,focus:document.activeElement?.outerHTML,faq:document.querySelector("#faq")?.outerHTML})') }, null, 2)); } catch {}
  throw error;
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  browser.kill();
}
