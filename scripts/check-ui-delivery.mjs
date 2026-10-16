import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = 'delivery';
const i18nOnly = process.argv.includes('--i18n-only');
const checkFonts = process.argv.includes('--fonts');
const baseUrl = process.argv[2] || 'http://127.0.0.1:4184';
if (new URL(baseUrl).hostname !== '127.0.0.1') throw new Error('UI checks require the local preview on 127.0.0.1');
const profile = path.join(root, '.security-review', `refactor-edge-${mode}-${Date.now()}`);
mkdirSync(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank',
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
    if (response.method === 'Fetch.requestPaused') send('Fetch.failRequest', { requestId: response.params.requestId, errorReason: 'Failed' }).catch(() => {});
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  const quotes = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Network.requestWillBeSent' && new URL(message.params.request.url).pathname === '/api/checkout/quote') quotes.push(message.params.request.url);
  });
  await send('Network.enable');
  await navigate('/shop');
  await evaluate("localStorage.setItem('lunara_language','en'); localStorage.setItem('lunara.cart.v1',JSON.stringify({version:1,lines:[{variantId:1,quantity:1}]}))");
  await navigate('/cart');
  await waitFor("Boolean(document.querySelector('input[name=province_name]'))");
  await assert("document.querySelector('input[name=ward_name]').disabled", 'Ward must be disabled before city selection');
  const choose = async (name, text) => {
    await evaluate("document.querySelector('input[name=" + name + "]').focus()");
    await input('input[name=' + name + ']', text);
    await waitFor("document.querySelectorAll('[role=option]').length > 0");
    await evaluate("document.querySelector('[role=option]').click()");
    await waitFor("!document.querySelector('[role=listbox]') && !document.querySelector('input[name=ward_name]').disabled");
  };
  await choose('province_name', 'ha noi');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await waitFor("document.activeElement?.name === 'ward_name' && document.querySelector('input[name=ward_name]').getAttribute('aria-expanded') === 'true'");
  await evaluate("document.querySelector('input[name=ward_name]').focus(); document.querySelector('input[name=ward_name]').click()");
  await waitFor("document.querySelectorAll('[role=option]').length === 1");
  for (const value of ['h','ho','hoan','hoan kiem']) { await input('input[name=ward_name]', value); await delay(400); }
  if (quotes.length !== 0) throw new Error('Typing search must not request a quote');
  await evaluate("document.querySelector('[role=option]').click()");
  await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('470')");
  if (quotes.length !== 1) throw new Error('Selecting a ward must request exactly one quote');
  for (const value of ['Demo','Demo sender','Demo sender test']) await input('input[name=senderName]', value);
  await input('input[name=address]', 'Demo street 123');
  await delay(600);
  if (quotes.length !== 1) throw new Error('Contact/address typing must not refetch quote');
  await input('input[name=province_name]', 'ho chi minh');
  await assert("document.querySelectorAll('[role=option]').length === 0", 'Unimported city must not be offered');
  await assert("document.querySelector('input[name=ward_name]').value === '' && !document.querySelector('[data-quote-amount=Total]')?.innerText.includes('470')", 'Changing city must clear ward and old quote');
  await choose('province_name', 'ha noi');
  await evaluate("document.querySelector('input[name=ward_name]').focus(); document.querySelector('input[name=ward_name]').click()");
  await waitFor("document.querySelectorAll('[role=option]').length === 1");
  await input('input[name=ward_name]', 'cua nam');
  await assert("document.querySelectorAll('[role=option]').length === 0", 'Unconfigured ward must not be offered');
  await input('input[name=ward_name]', 'zzzz-no-such-ward');
  await assert("document.querySelectorAll('[role=option]').length === 0 && Boolean(document.querySelector('[role=status]'))", 'Empty search must show a useful message');
  await delay(500);
  if (quotes.length !== 1) throw new Error('Invalid search/city change must not request a quote');
  await input('input[name=ward_name]', 'hoan kiem');
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('470')");
  await delay(450);
  if (quotes.length !== 2) throw new Error('Keyboard selection must quote once');
  for(let i=0;i<3;i++) { await evaluate("document.querySelector('button[aria-label=\"Increase quantity\"]').click()"); await delay(60); }
  await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('1,800')");
  if (quotes.length !== 3) throw new Error('Rapid quantity changes must coalesce into one quote');
  await evaluate("document.querySelector('[data-language-switcher] button[lang=vi]').click()");
  await waitFor("document.documentElement.lang === 'vi' && document.body.innerText.includes('Phường / Xã')");
  for (const width of [320,390,768,1440]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
    await evaluate("document.querySelector('input[name=ward_name]').focus(); document.querySelector('input[name=ward_name]').click()");
    await assert('document.documentElement.scrollWidth <= ' + (width+1), 'Delivery search overflow at width ' + width);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  }
  await screenshot('cart-vi-mobile');
  if (exceptions.length) throw new Error(JSON.stringify(exceptions));
  const result = {groups:8, quotes:quotes.length, typingRequests:0, configuredCities:1, configuredWards:[1], unconfiguredWardHidden:true, unimportedCityHidden:true, locales:['en','vi'], widths:[320,390,768,1440], exceptions:exceptions.length};
  writeFileSync(path.join(root,'.security-review','delivery-ui-results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));

} catch (error) {
  try { await screenshot('failure'); console.error(JSON.stringify(await evaluate("({inputs:[...document.querySelectorAll('input[role=combobox]')].map(x=>({name:x.name,value:x.value,disabled:x.disabled,expanded:x.getAttribute('aria-expanded')})),active:document.activeElement?.outerHTML,options:document.querySelectorAll('[role=option]').length,exceptions:[]})"))); console.error(JSON.stringify(exceptions)); } catch {}
  throw error;
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  browser.kill();
}
