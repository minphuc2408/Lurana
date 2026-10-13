import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = 'verification';
const i18nOnly = process.argv.includes('--i18n-only');
const checkFonts = process.argv.includes('--fonts');
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
if (new URL(baseUrl).hostname !== '127.0.0.1') throw new Error('UI checks require the local preview on 127.0.0.1');
const profile = path.join(root, '.security-review', `refactor-edge-${mode}-${Date.now()}`);
mkdirSync(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  `--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1${checkFonts ? ', EXCLUDE fonts.googleapis.com, EXCLUDE fonts.gstatic.com' : ''}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
const pending = new Map();
let nextId = 0;
const exceptions = [];
let routeName = '';
async function send(method, params = {}) {
  const id = ++nextId;
  const response = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params }));
  return response;
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text + ': ' + response.exceptionDetails.exception?.description);
  return response.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await delay(50);
  }
  throw new Error(`Timeout on ${routeName}: ${expression}`);
}
async function navigate(route) {
  routeName = route;
  await send('Page.navigate', { url: `${baseUrl}${route}` });
  await waitFor('document.readyState === "complete" && document.querySelector("#root")?.innerText.length > 20');
  await delay(200);
  if (checkFonts) await evaluate('document.fonts.ready.then(() => true)');
}
async function click(text) {
  const ok = await evaluate(`(() => { const scope = document.querySelector('[role="dialog"]') || document; const el = [...scope.querySelectorAll('button,a')].find(e => e.textContent.trim() === ${JSON.stringify(text)} && e.getBoundingClientRect().width > 0); if(!el) return false; el.click(); return true; })()`);
  if (!ok) throw new Error(`Missing visible control: ${text} on ${routeName}`);
  await delay(100);
}
async function input(selector, value) {
  const ok = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  if (!ok) throw new Error(`Missing input: ${selector}`);
  await delay(100);
}
async function assert(expression, message) {
  if (!await evaluate(expression)) throw new Error(message);
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(root, '.security-review', `${mode}-${name}.png`), Buffer.from(data, 'base64'));
}
try {
  let target;
  for (let i = 0; i < 100; i++) {
    try { const port = readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {}
    if (target) break;
    await delay(50);
  }
  if (!target) throw new Error('Edge debugging connection unavailable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  ws.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    if (response.id) {
      const job = pending.get(response.id);
      pending.delete(response.id);
      if (response.error) job?.reject(new Error(JSON.stringify(response.error)));
      else job?.resolve(response.result);
    }
    if (response.method === 'Runtime.exceptionThrown') exceptions.push({ route: routeName, detail: response.params.exceptionDetails.exception?.description });
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const seedScript = await send('Page.addScriptToEvaluateOnNewDocument', { source: `if(location.hostname === '127.0.0.1') sessionStorage.setItem('lunara_user', JSON.stringify({name:'Demo Administrator',email:'demo@example.test',role:'admin'}));` });
  const routes = ['/', '/shop', '/cart', '/request', '/orders', '/profile', '/login', '/signup', '/admin', '/admin/dashboard', '/admin/stock', '/admin/orders', '/admin/customers', '/admin/requests', '/admin/settings'];
  const results = [];
  for (const route of i18nOnly ? [] : routes) {
    await navigate(route);
    results.push({ route, ...await evaluate(`(() => { const h = document.querySelector('h1') || document.querySelector('h2'); const r = h?.getBoundingClientRect(); return {heading:h?.textContent.trim(),headingRect:r ? {x:r.x,y:r.y,width:r.width,height:r.height} : null,bodyWidth:document.body.scrollWidth,buttons:document.querySelectorAll('button').length}; })()`) });
    if (['/', '/shop', '/cart', '/admin/dashboard'].includes(route)) await screenshot(route.replaceAll('/', '-') || 'home');
  }
  let localeChecks;
  const typographyChecks = [];
  if (mode !== 'baseline') {
    if (!i18nOnly) await import('./check-ui-flows.mjs').then(module => module.verify({ navigate, click, input, assert, evaluate, waitFor, send, screenshot, delay, seedScriptIdentifier: seedScript.identifier }));
    else await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedScript.identifier });
    localeChecks = await import('./check-ui-i18n.mjs').then(module => module.verifyI18n({ navigate, click, input, assert, evaluate, send, delay, screenshot }));
  }
  if (checkFonts) {
    await send('DOM.enable');
    await send('CSS.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate('/shop');
    for (const [language, families] of [['en', ['Cormorant Garamond', 'Jost']], ['vi', ['Lora', 'Be Vietnam Pro']]]) {
      await evaluate(`document.querySelector('[data-language-switcher] button[lang="${language}"]').click()`);
      await waitFor(`document.documentElement.lang === '${language}'`);
      for (const [index, family] of families.entries()) {
        const sample = language === 'vi' ? 'Tiếng Việt: Đặng, Nguyễn, Bó mẫu đơn, Ắ ằ ễ ộ ự' : 'Lunara Flower Shop';
        const loaded = await evaluate(`document.fonts.load('400 20px "${family}"', ${JSON.stringify(sample)}).then(faces => faces.length > 0 && faces.every(face => face.status === 'loaded'))`);
        if (!loaded) throw new Error(`Font failed to load: ${family}`);
        await evaluate(`(() => { const el = document.createElement('span'); el.id = 'font-probe'; el.className = '${index === 0 ? 'font-display' : 'font-body'}'; el.style.fontWeight = '400'; el.style.fontSize = '20px'; el.textContent = ${JSON.stringify(sample)}; document.body.append(el); })()`);
        await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))');
        await assert(`getComputedStyle(document.querySelector('#font-probe')).fontFamily.startsWith('${family}') || getComputedStyle(document.querySelector('#font-probe')).fontFamily.startsWith('"${family}"')`, `Incorrect ${language} font token: ${family}`);
        const { root: domRoot } = await send('DOM.getDocument');
        const { nodeId } = await send('DOM.querySelector', { nodeId: domRoot.nodeId, selector: '#font-probe' });
        const { fonts } = await send('CSS.getPlatformFontsForNode', { nodeId });
        if (!fonts.length || fonts.some(font => !font.isCustomFont || !(font.familyName === family || font.familyName.startsWith(`${family} `)))) throw new Error(`Fallback glyphs in ${family}: ${JSON.stringify(fonts)}`);
        typographyChecks.push({ language, family, fonts });
        await evaluate("document.querySelector('#font-probe').remove()");
      }
    }
    await screenshot('i18n-fonts-mobile-shop');
    await navigate('/login');
    await assert(`getComputedStyle(document.querySelector('input')).fontFamily.includes('Be Vietnam Pro')`, 'Vietnamese form did not inherit the body font');
    await screenshot('i18n-fonts-mobile-login');
    await evaluate("document.querySelector('[data-language-switcher] button[lang=en]').click()");
    await waitFor(`getComputedStyle(document.querySelector('input')).fontFamily.includes('Jost')`);
    await evaluate("document.querySelector('[data-language-switcher] button[lang=vi]').click()");
    await send('Page.reload');
    await waitFor(`document.documentElement.lang === 'vi' && document.querySelector('input') && getComputedStyle(document.querySelector('input')).fontFamily.includes('Be Vietnam Pro')`);
  }
  writeFileSync(path.join(root, '.security-review', `${mode}-ui-results.json`), JSON.stringify({ results, localeChecks, typographyChecks, exceptions }, null, 2));
  if (exceptions.length) throw new Error(JSON.stringify(exceptions));
  console.log(JSON.stringify({ mode, routes: results.length, localeChecks, typographyChecks, exceptions: exceptions.length }));
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  browser.kill();
}
