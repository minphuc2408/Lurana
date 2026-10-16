import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { getPlatformProxy, unstable_splitSqlQuery as splitSqlQuery } from 'wrangler';

// All writes in this browser acceptance runner use an ephemeral workerd D1.
// The bridge shares one origin with the built frontend, so browser cookies and
// Origin checks are exercised without importing ambient .dev.vars credentials.
const root = fileURLToPath(new URL('../', import.meta.url));
const clientRoot = path.join(root, 'dist/client');
const evidenceRoot = path.join(root, '.security-review');
const demoPassword = 'isolated-phase5-admin-password-24-characters';
const demoJwtSecret = 'isolated-phase5-jwt-secret-32-characters-distinct';
const results = [];
const exceptions = [];
const requests = [];
const orderRequests = [];
const faults = [];
const turnstileTest = process.argv.includes('--turnstile-test');
const skipResponsive = process.argv.includes('--skip-responsive');
const verifiedActions = new Set();
const usedTokens = new Set();
if (turnstileTest) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url) !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') return originalFetch(url, init);
    const token = JSON.parse(init.body).response;
    const action = token?.split(':')[1];
    if (!action || usedTokens.has(token)) return Response.json({ success: false });
    usedTokens.add(token); verifiedActions.add(action);
    return Response.json({ success: true, action, hostname: '127.0.0.1' });
  };
}
let browser;
let server;
let platform;
let ws;
let origin;
let routeName = '';
let nextId = 0;
let activeScenario = '';
const pending = new Map();
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const staticHeaders = Object.fromEntries(readFileSync(path.join(clientRoot, '_headers'), 'utf8')
  .split(/\r?\n\r?\n/)[0].split(/\r?\n/).slice(1).filter(line => line.trim())
  .map(line => { const colon = line.indexOf(':'); return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()]; }));
const activeRuntimeFiles = [
  'src/pages/HomePage.tsx', 'src/pages/ShopPage.tsx', 'src/pages/CartPage.tsx', 'src/pages/TrackOrderPage.tsx', 'src/pages/LoginPage.tsx',
  'src/pages/admin/AdminDashboardPage.tsx', 'src/pages/admin/AdminOrdersPage.tsx', 'src/pages/admin/AdminStockPage.tsx', 'src/pages/admin/AdminDeliveryZonesPage.tsx',
  'src/shared/api/client.ts', 'src/shared/lib/format.ts',
  'src/features/cart/CartContext.tsx', 'src/features/cart/cart.context.ts', 'src/features/cart/cart.service.ts', 'src/features/cart/checkout-intent.ts', 'src/features/cart/quote.service.ts',
  'src/features/cart/hooks/useCart.ts', 'src/features/cart/hooks/useCartState.ts', 'src/features/cart/hooks/useQuoteCart.ts', 'src/features/cart/hooks/useCodCheckout.ts',
  'src/features/cart/components/CartView.tsx', 'src/features/cart/components/CartItemList.tsx', 'src/features/cart/components/CartSummary.tsx', 'src/features/cart/components/DeliveryOptions.tsx',
  'src/features/cart/components/CodCheckoutForm.tsx', 'src/features/cart/components/CodOrderReview.tsx', 'src/features/cart/components/CodConfirmation.tsx',
  'src/features/orders/order-api.service.ts', 'src/features/orders/order-api.types.ts', 'src/features/orders/hooks/useOrderLookup.ts', 'src/features/orders/components/OrderLookupView.tsx', 'src/features/orders/components/OrderDetailView.tsx',
  'src/features/auth/admin-auth.service.ts', 'src/features/auth/AuthContext.tsx', 'src/features/auth/hooks/useAuthState.ts', 'src/features/auth/hooks/useAdminLogin.ts', 'src/features/auth/components/AdminLoginView.tsx', 'src/features/auth/components/AdminRoute.tsx',
  ...['service', 'adapters', 'types'].map(part => `src/features/admin/admin-api.${part}.ts`),
  ...['Orders', 'Products', 'Dashboard'].map(part => `src/features/admin/hooks/useAdminApi${part}.ts`),
  'src/features/admin/hooks/useAdminDeliveryZones.ts',
  ...['State', 'OrdersView', 'ProductsView', 'DashboardView'].map(part => `src/features/admin/components/AdminApi${part}.tsx`),
  'src/features/admin/components/AdminProductForm.tsx', 'src/features/admin/components/AdminDeliveryZonesView.tsx',
];

function scanActiveRuntime() {
  const active = new Set(activeRuntimeFiles.filter(file => existsSync(path.join(root, file))));
  for (const relativeDirectory of ['src/app', 'src/features/shop']) {
    const visit = directory => { for (const entry of readdirSync(directory, { withFileTypes: true })) { const absolute = path.join(directory, entry.name); if (entry.isDirectory() && entry.name !== 'data') visit(absolute); else if (entry.isFile() && /\.[jt]sx?$/.test(entry.name)) active.add(path.relative(root, absolute).replaceAll('\\', '/')); } };
    visit(path.join(root, relativeDirectory));
  }
  const pattern = /₱|\bPHP\b|Asia\/Manila/g;
  const activeHits = [...active].flatMap(file => readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).flatMap((line, index) => {
    const terms = [...line.matchAll(pattern)].map(match => match[0]); return terms.length ? [{ file, line: index + 1, terms: [...new Set(terms)] }] : [];
  }));
  const scanned = spawnSync('rg', ['-n', '-e', '₱', '-e', 'PHP', '-e', 'Asia/Manila', 'src'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (scanned.error) throw scanned.error;
  assert.ok([0, 1].includes(scanned.status), 'Source scan must complete');
  const retainedLegacyHits = scanned.stdout.split(/\r?\n/).filter(Boolean).map(line => {
    const match = line.match(/^(.*?):(\d+):(.*)$/); assert.ok(match);
    return { file: match[1].replaceAll('\\', '/'), line: Number(match[2]), terms: [...new Set([...match[3].matchAll(pattern)].map(term => term[0]))] };
  }).filter(hit => !active.has(hit.file));
  assert.deepEqual(activeHits, [], 'Active MVP runtime must contain no legacy currency/timezone literals');
  return { activeSourceFiles: [...active].sort(), retainedLegacyHits };
}

function persistedSnapshot(directory = path.join(root, '.wrangler/state')) {
  const files = {};
  const visit = current => {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && /^[a-f0-9]{64}\.sqlite$/.test(entry.name) && absolute.replaceAll('\\', '/').includes('/d1/')) {
        // WAL/checkpoint bytes can change during concurrent read-only preview or
        // smoke requests. Compare committed logical D1 data through read-only
        // SQLite handles, with no customer values written to evidence or logs.
        const db = new DatabaseSync(absolute, { readOnly: true });
        try {
          const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all().map(row => row.name);
          const content = { schema: db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all(), tables: {} };
          for (const table of tables) content.tables[table] = db.prepare(`SELECT * FROM "${table.replaceAll('"', '""')}" ORDER BY rowid`).all();
          files[path.relative(directory, absolute).replaceAll('\\', '/')] = createHash('sha256').update(JSON.stringify(content)).digest('hex');
        } finally { db.close(); }
      }
    }
  };
  visit(directory);
  return files;
}

function assertNoSecrets(value) {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes(demoPassword) || serialized.includes(demoJwtSecret), false, 'Response leaked synthetic credentials');
  assert.doesNotMatch(serialized, /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/, 'Response JSON leaked a JWT');
}

async function createBridge() {
  if (!existsSync(path.join(clientRoot, 'index.html'))) throw new Error('Build the frontend before running Phase 5 UI acceptance.');
  if (!crypto.subtle.timingSafeEqual) crypto.subtle.timingSafeEqual = (left, right) => timingSafeEqual(Buffer.from(left), Buffer.from(right));
  const { default: app } = await import('../worker/index.ts');
  platform = await getPlatformProxy({ configPath: path.join(root, 'wrangler.jsonc'), persist: false, remoteBindings: false, envFiles: ['.dev.vars.example'] });
  const db = platform.env.DB;
  for (const file of ['migrations/0001_mvp.sql', 'docs/sql/MVP_SEED_DEV.sql']) {
    await db.batch(splitSqlQuery(readFileSync(path.join(root, file), 'utf8')).map(sql => db.prepare(sql)));
  }
  server = createServer(async (incoming, outgoing) => {
    try {
      const url = new URL(incoming.url || '/', origin);
      if (!url.pathname.startsWith('/api/')) {
        let target = path.resolve(clientRoot, `.${decodeURIComponent(url.pathname)}`);
        if (target !== clientRoot && !target.startsWith(`${clientRoot}${path.sep}`)) { outgoing.writeHead(403); outgoing.end(); return; }
        if (!existsSync(target) || !statSync(target).isFile()) target = path.join(clientRoot, 'index.html');
        outgoing.writeHead(200, { ...staticHeaders, 'content-type': mimeTypes[path.extname(target)] || 'application/octet-stream', 'cache-control': 'no-store' });
        outgoing.end(readFileSync(target));
        return;
      }
      const chunks = [];
      for await (const chunk of incoming) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const method = incoming.method || 'GET';
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      const key = headers.get('idempotency-key');
      const orderRequest = url.pathname === '/api/orders' && method === 'POST' ? { key, body: body.toString(), scenario: activeScenario } : null;
      if (orderRequest) orderRequests.push(orderRequest);
      const fault = faults.find(item => !item.used && item.path === url.pathname && (!item.method || item.method === method));
      if (fault) fault.used = true;
      if (fault?.delay) await pause(fault.delay);
      if (fault?.mode === 'before-500') {
        outgoing.writeHead(500, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        outgoing.end(JSON.stringify({ error: { code: 'INTERNAL', message: 'Synthetic local API failure.' } }));
        requests.push({ path: url.pathname, method, status: 500, fault: fault.mode, scenario: activeScenario });
        return;
      }
      const response = await app.fetch(new Request(url, { method, headers, ...(!['GET', 'HEAD'].includes(method) ? { body } : {}) }), { DB: db, ADMIN_PASSWORD: demoPassword, JWT_SECRET: demoJwtSecret, ...(turnstileTest ? { TURNSTILE_SECRET: 'isolated-widget-test-secret' } : {}) });
      const responseBody = Buffer.from(await response.arrayBuffer());
      if (response.headers.get('content-type')?.includes('application/json')) assertNoSecrets(JSON.parse(responseBody.toString()));
      requests.push({ path: url.pathname, method, status: response.status, ...(fault ? { fault: fault.mode || 'delay' } : {}), scenario: activeScenario });
      if (fault?.mode === 'after-commit-loss' && response.ok) {
        // Receiving headers plus a truncated body makes the loss observable to
        // fetch without Chromium silently retrying a closed keepalive socket.
        outgoing.writeHead(response.status, { ...Object.fromEntries(response.headers), 'content-length': String(responseBody.length) });
        outgoing.write(responseBody.subarray(0, Math.max(1, Math.floor(responseBody.length / 2))), () => outgoing.destroy());
        return;
      }
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(responseBody);
    } catch (error) {
      // Never print request bodies, cookies, credentials or the Worker stack.
      outgoing.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
      outgoing.end(JSON.stringify({ error: { code: 'INTERNAL', message: 'Local acceptance bridge failed.' } }));
      requests.push({ path: new URL(incoming.url || '/', origin).pathname, status: 500, bridgeError: error.name, scenario: activeScenario });
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  assert.equal(new URL(origin).hostname, '127.0.0.1');
  return db;
}

async function send(method, params = {}, sessionId) {
  const id = ++nextId;
  const response = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
  });
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return response;
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}

async function waitFor(expression, message = expression) {
  for (let i = 0; i < 160; i++) { if (await evaluate(expression)) return; await pause(50); }
  throw new Error(`Timeout on ${routeName}: ${message}`);
}

async function waitUntil(predicate, message) {
  for (let attempt = 0; attempt < 160; attempt++) { if (await predicate()) return; await pause(50); }
  throw new Error(message);
}

async function navigate(route) {
  routeName = route;
  await send('Page.navigate', { url: `${origin}${route}` });
  await waitFor('document.readyState === "complete" && document.querySelector("#root")?.innerText.length > 10');
}

async function reload(predicate) {
  await evaluate('window.__phase5Reload = true');
  await send('Page.reload');
  await waitFor(`window.__phase5Reload !== true && document.readyState === 'complete' && (${predicate})`);
}

async function click(selector) {
  await waitFor(`Boolean(document.querySelector(${JSON.stringify(selector)})) && !document.querySelector(${JSON.stringify(selector)}).disabled`, `Enabled control ${selector}`);
  const clicked = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element || element.disabled) return false; element.click(); return true; })()`);
  assert.equal(clicked, true, `Missing/enabled control ${selector} on ${routeName}`);
  await pause(80);
}

async function textClick(text, scope = 'document') {
  const clicked = await evaluate(`(() => { const el = [...${scope}.querySelectorAll('button,a')].find(e => e.textContent.trim() === ${JSON.stringify(text)} && !e.disabled && e.getBoundingClientRect().width > 0); if (!el) return false; el.click(); return true; })()`);
  assert.equal(clicked, true, `Missing visible text control ${text} on ${routeName}`);
  await pause(80);
}

async function input(selector, value) {
  const set = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el, ${JSON.stringify(String(value))}); el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })); return true; })()`);
  assert.equal(set, true, `Missing form field ${selector} on ${routeName}`);
  await pause(70);
}

async function checked(selector, value) {
  const set = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; if(el.checked !== ${Boolean(value)}) el.click(); return true; })()`);
  assert.equal(set, true, `Missing checkbox ${selector}`);
  await pause(70);
}

async function expect(expression, message) { assert.equal(Boolean(await evaluate(expression)), true, message); }
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(evidenceRoot, `phase5-${name}.png`), Buffer.from(data, 'base64'));
}
async function scenario(number, name, action) {
  activeScenario = String(number);
  const started = Date.now();
  try {
    const evidence = await action();
    results.push({ number, name, status: 'PASS', elapsedMs: Date.now() - started, ...evidence });
    console.log(`PASS Phase 5 ${number}: ${name}`);
  } catch (error) {
    results.push({ number, name, status: 'FAIL', elapsedMs: Date.now() - started, error: error.message });
    console.error(`FAIL Phase 5 ${number}: ${name}: ${error.message}`);
    await screenshot(`failure-${String(number).replaceAll('.', '-')}`).catch(() => {});
    throw error;
  }
}

async function startBrowser() {
  const profile = path.join(evidenceRoot, `phase5-edge-${Date.now()}`);
  mkdirSync(profile, { recursive: true });
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });
  let target;
  for (let i = 0; i < 160; i++) {
    try {
      const port = readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
      target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(item => item.type === 'page');
    } catch {}
    if (target) break;
    await pause(50);
  }
  if (!target) throw new Error('Edge CDP connection unavailable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    if (response.id) {
      const job = pending.get(response.id); pending.delete(response.id);
      if (response.error) job?.reject(new Error(JSON.stringify(response.error))); else job?.resolve(response.result);
    }
    if (response.method === 'Runtime.exceptionThrown') exceptions.push({ route: routeName, detail: response.params.exceptionDetails.exception?.description });
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  if (turnstileTest) await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__turnstileWidgets = new Map();
    window.turnstile = {
      render(element, options) {
        if (options.sitekey !== '1x00000000000000000000AA') throw new Error('Build with the official test site key for this harness');
        const id = crypto.randomUUID();
        element.textContent = 'Security verification (local mock)';
        window.__turnstileWidgets.set(id, options);
        setTimeout(() => { if (window.__turnstileWidgets.has(id)) options.callback('test:' + options.action + ':' + crypto.randomUUID()); }, 50);
        return id;
      },
      remove(id) { window.__turnstileWidgets.delete(id); }
    };` });
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
}

// The selector map is shared with the semantic data attributes on Phase 5 views.
const selectors = {
  checkout: '[data-checkout-form]', confirm: '[data-checkout-review]', place: '[data-checkout-submit]', success: '[data-order-confirmation]',
  lookup: '[data-order-lookup]', detail: '[data-order-detail]', login: '[data-testid="admin-login"]',
};

async function locale(language) {
  const switcher = `[data-language-switcher] button[lang=${language}]`;
  if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(switcher)}))`)) await click(switcher);
  else { await evaluate(`localStorage.setItem('lunara_language', ${JSON.stringify(language)})`); await reload(`document.documentElement.lang === ${JSON.stringify(language)}`); }
  await waitFor(`document.documentElement.lang === ${JSON.stringify(language)}`);
}

async function addPeony(size = 'M') {
  await navigate('/shop');
  await waitFor("document.querySelectorAll('[data-product-id]').length >= 8");
  const variant = await evaluate(`fetch('/api/products', {cache:'no-store'}).then(r=>r.json()).then(b=>b.data.items.find(p=>p.slug==='blush-peony-bouquet').variants.find(v=>v.size_code===${JSON.stringify(size)}).id)`);
  await input('[data-product-id="1"] select', variant);
  await click('[data-product-id="1"] button');
  await waitFor("JSON.parse(localStorage.getItem('lunara.cart.v1') || '{}').lines?.length > 0");
  await navigate('/cart');
  await waitFor("Boolean(document.querySelector('[data-quote-amount=Total]'))");
  return variant;
}

async function fillCheckout(date) {
  await input('input[name=province_name]', 'Thành phố Hà Nội');
  await input('input[name=ward_name]', 'Phường Hoàn Kiếm');
  if (!await evaluate(`Boolean(document.querySelector(${JSON.stringify(selectors.checkout)}))`)) await click('[data-checkout-start]');
  await waitFor(`Boolean(document.querySelector(${JSON.stringify(selectors.checkout)}))`);
  for (const [name, value] of Object.entries({ senderName: 'Phase Five Sender', senderPhone: '0900000000', senderEmail: 'phase5@example.test', recipientName: 'Phase Five Recipient', recipientPhone: '0911111111', address: '12 Synthetic Flower Street', date, note: 'Only isolated acceptance data' })) await input(`[name="${name}"]`, value);
  await input('[name="cardType"]', 'GREETING_CARD');
  await input('[name="cardMessage"]', 'Synthetic acceptance flowers');
  await input('[name="slot"]', '08:00-10:00');
  await input('input[name=province_name]', 'Thành phố Hà Nội');
  await input('input[name=ward_name]', 'Phường Hoàn Kiếm');
  await waitFor("!document.querySelector('[data-quote-loading]') && Boolean(document.querySelector('[data-quote-amount=Total]'))");
}

async function reviewCheckout() { await click(selectors.confirm); await waitFor(`Boolean(document.querySelector(${JSON.stringify(selectors.place)}))`); }
async function confirmedNumber() {
  await waitFor(`Boolean(document.querySelector(${JSON.stringify(selectors.success)}))`);
  return evaluate("document.querySelector('[data-order-number]')?.textContent.trim()");
}

async function runAcceptance(db) {
  const first = (sql, values = []) => db.prepare(sql).bind(...values).first();
  const all = async (sql, values = []) => (await db.prepare(sql).bind(...values).all()).results;
  const stock = async variant => (await first('SELECT stock_quantity FROM product_variants WHERE id = ?', [variant])).stock_quantity;
  const count = async () => (await first('SELECT COUNT(*) AS n FROM orders')).n;
  const { todayInVN } = await import('../worker/lib/datetime.ts');
  const date = new Date(`${todayInVN()}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1);
  const tomorrow = date.toISOString().slice(0, 10);
  let variant;
  let firstOrder;
  let cancelOrder;

  await scenario(1, 'Home/shop API catalog, eight products and VND in English/Vietnamese', async () => {
    await navigate('/');
    await expect("document.documentElement.lang === 'en'", 'English must remain the default locale');
    await navigate('/shop'); await waitFor("document.querySelectorAll('[data-product-id]').length === 8");
    await expect("document.body.innerText.includes('450') && document.body.innerText.includes('₫') && !document.body.innerText.includes('₱')", 'Catalog must render server VND prices');
    await locale('vi'); await expect("document.body.innerText.includes('450.000') && document.body.innerText.includes('₫')", 'Vietnamese must preserve VND');
    await locale('en'); await screenshot('01-shop-en');
    return { products: 8, variants: 24, locales: ['en', 'vi'], currency: 'VND' };
  });
  await scenario(2, 'Variant M survives reload; corrupted versioned storage empties safely', async () => {
    variant = await addPeony();
    await reload("Boolean(document.querySelector('[data-quote-amount=Total]'))");
    const saved = await evaluate("JSON.parse(localStorage.getItem('lunara.cart.v1'))");
    assert.deepEqual(saved, { version: 1, lines: [{ variantId: variant, quantity: 1 }] });
    await evaluate("localStorage.setItem('lunara.cart.v1', '{broken')"); await reload("Boolean(document.querySelector('[data-empty-cart]'))");
    variant = await addPeony();
    return { variantIdentity: true, reload: true, corruptStorage: true };
  });
  await scenario(3, 'Delivery ward fee, province default and unsupported area handling', async () => {
    await input('input[name=province_name]', 'Thành phố Hà Nội');
    await input('input[name=ward_name]', 'Phường Hoàn Kiếm');
    await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('670')");
    await input('input[name=ward_name]', 'Phường chưa có phí riêng');
    await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('685')");
    await input('input[name=province_name]', 'Tỉnh chưa được giao');
    await waitFor("Boolean(document.querySelector('[role=alert]')) && document.querySelector('[data-checkout-start]').disabled");
    await input('input[name=province_name]', 'Thành phố Hà Nội');
    await input('input[name=ward_name]', 'Phường Hoàn Kiếm');
    await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('670')");
    return { wardFee: 20000, provinceDefaultFee: 35000, unsupportedProvinceBlocked: true };
  });
  await scenario(4, 'Rapid double submit creates exactly one order and deducts stock once', async () => {
    await fillCheckout(tomorrow); await reviewCheckout();
    await waitFor(`!document.querySelector(${JSON.stringify(selectors.place)}).disabled`);
    const beforeCount = await count(); const beforeStock = await stock(variant);
    faults.push({ path: '/api/orders', method: 'POST', delay: 300 });
    await evaluate(`(() => {const b=document.querySelector(${JSON.stringify(selectors.place)});b.click();b.click();return true;})()`);
    firstOrder = await confirmedNumber(); assert.ok(firstOrder);
    await waitUntil(async () => await count() === beforeCount + 1, 'Double submit must persist one order');
    assert.equal(await count(), beforeCount + 1); assert.equal(await stock(variant), beforeStock - 1);
    await expect("JSON.parse(localStorage.getItem('lunara.cart.v1')).lines.length === 0", 'Successful server response must clear cart');
    await screenshot('04-order-confirmation');
    return { oneOrder: true, oneStockDeduction: true, confirmation: true };
  });
  await scenario(5, '500 and lost response preserve form/cart; same intent replay creates no duplicate', async () => {
    variant = await addPeony(); await fillCheckout(tomorrow); await reviewCheckout();
    const beforeCount = await count(); const beforeStock = await stock(variant);
    faults.push({ path: '/api/orders', method: 'POST', mode: 'before-500' }); await click(selectors.place);
    await waitFor("Boolean(document.querySelector('[role=alert]'))");
    await expect("JSON.parse(localStorage.getItem('lunara.cart.v1')).lines.length === 1", '500 must preserve cart');
    await expect("document.querySelector('[data-checkout-confirm]').innerText.includes('Phase Five Recipient') && document.querySelector('[data-checkout-confirm]').innerText.includes('12 Synthetic Flower Street')", '500 must preserve entered contact/address data');
    assert.equal(await count(), beforeCount);
    faults.push({ path: '/api/orders', method: 'POST', mode: 'after-commit-loss' }); await click(selectors.place);
    await waitFor("Boolean(document.querySelector('[role=alert]')) && !document.querySelector('[data-checkout-submit]')?.disabled");
    await waitUntil(async () => await count() === beforeCount + 1, 'Lost response must follow an actual committed order');
    assert.equal(await count(), beforeCount + 1); assert.equal(await stock(variant), beforeStock - 1);
    await expect("JSON.parse(localStorage.getItem('lunara.cart.v1')).lines.length === 1", 'Lost response must preserve cart');
    await expect("document.querySelector('[data-checkout-confirm]').innerText.includes('Phase Five Recipient')", 'Lost response must preserve form data');
    await click(selectors.place); cancelOrder = await confirmedNumber();
    assert.equal(await count(), beforeCount + 1); assert.equal(await stock(variant), beforeStock - 1);
    const attempts = orderRequests.filter(item => item.scenario === '5');
    assert.ok(attempts.length >= 3); assert.equal(new Set(attempts.map(item => item.key)).size, 1);
    assert.equal(new Set(attempts.map(item => { const { turnstile_token, ...payload } = JSON.parse(item.body); return JSON.stringify(payload); })).size, 1);
    if (turnstileTest) assert.equal(new Set(attempts.map(item => JSON.parse(item.body).turnstile_token)).size, attempts.length);
    return { beforeCommit500: true, afterCommitNetworkLoss: true, attempts: attempts.length, stableKeyAndBody: true, duplicateOrders: 0 };
  });
  await scenario(6, 'Confirmation lookup matches items/totals/timeline; wrong phone hides order', async () => {
    await navigate('/orders/track'); await waitFor(`Boolean(document.querySelector(${JSON.stringify(selectors.lookup)}))`);
    await input('[name=orderNumber]', firstOrder); await input('[name=phone]', '0900000000'); await click('[data-lookup-submit]');
    await waitFor(`Boolean(document.querySelector(${JSON.stringify(selectors.detail)}))`);
    await expect(`document.body.innerText.includes(${JSON.stringify(firstOrder)}) && document.body.innerText.includes('650') && document.body.innerText.includes('670')`, 'Lookup must show order snapshot totals');
    await expect("Boolean(document.querySelector('[data-order-timeline]'))", 'Lookup must show API timeline');
    await screenshot('06-lookup');
    await input('[name=phone]', '0922222222'); await click('[data-lookup-submit]');
    await waitFor("Boolean(document.querySelector('[role=alert]')) && !document.querySelector('[data-order-detail]')");
    return { lookup: true, items: true, totals: true, timeline: true, wrongPhoneNotFound: true };
  });
  await scenario(7, 'Admin wrong/correct password, persistent cookie across tab and logout guard', async () => {
    await navigate('/admin'); await waitFor(`Boolean(document.querySelector(${JSON.stringify(selectors.login)}))`);
    await input('[name=password]', 'synthetic-wrong-password'); await click('[data-testid=admin-login-submit]');
    await waitFor("Boolean(document.querySelector('[role=alert]'))");
    await input('[name=password]', demoPassword); await click('[data-testid=admin-login-submit]');
    await waitFor("Boolean(document.querySelector('[data-testid=admin-dashboard]'))");
    await expect("!document.cookie.includes('lunara_admin') && !sessionStorage.getItem('lunara_user')", 'Admin auth must use HttpOnly cookie without demo session');
    const target = await send('Target.createTarget', { url: `${origin}/admin/dashboard` });
    const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    let tabAuthenticated = false;
    for (let attempt = 0; attempt < 160; attempt++) {
      const evaluated = await send('Runtime.evaluate', { expression: "Boolean(document.querySelector('[data-testid=admin-dashboard]'))", returnByValue: true }, attached.sessionId);
      if (evaluated.result?.value) { tabAuthenticated = true; break; }
      await pause(50);
    }
    assert.equal(tabAuthenticated, true, 'New tab must authenticate using the existing server cookie');
    await send('Target.closeTarget', { targetId: target.targetId });
    await reload("Boolean(document.querySelector('[data-testid=admin-dashboard]'))");
    await click('[data-testid=admin-logout]'); await navigate('/admin/orders'); await waitFor(`Boolean(document.querySelector(${JSON.stringify(selectors.login)}))`);
    await input('[name=password]', demoPassword); await click('[data-testid=admin-login-submit]'); await waitFor("Boolean(document.querySelector('[data-testid=admin-dashboard]'))");
    return { invalidPassword: true, serverLogin: true, httpOnly: true, newTab: true, reload: true, logoutGuard: true };
  });
  await scenario(8, 'Admin valid transitions mark delivered PAID; cancellation releases stock once', async () => {
    await navigate(`/admin/orders?order=${firstOrder}`); await waitFor("Boolean(document.querySelector('[data-testid=admin-order-detail]'))");
    for (const status of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']) {
      await click(`[data-testid="order-status-${status}"]`); await waitFor(`document.querySelector('[data-testid=admin-order-detail]')?.dataset.status === ${JSON.stringify(status)}`);
    }
    assert.equal((await first('SELECT payment_status FROM orders WHERE order_number = ?', [firstOrder])).payment_status, 'PAID');
    await navigate(`/admin/orders?order=${cancelOrder}`); await waitFor("Boolean(document.querySelector('[data-testid=admin-order-detail]'))");
    const before = await stock(variant); await click('[data-testid=order-status-CANCELLED]'); await click('[data-testid=confirm-cancel-order]');
    await waitFor("document.querySelector('[data-testid=admin-order-detail]')?.dataset.status === 'CANCELLED'");
    assert.equal(await stock(variant), before + 1);
    await reload("document.querySelector('[data-testid=admin-order-detail]')?.dataset.status === 'CANCELLED'");
    assert.equal(await stock(variant), before + 1);
    await expect("!document.querySelector('[data-testid^=order-status-]')", 'Terminal order must expose no invalid transitions');
    await screenshot('08-admin-cancelled');
    const { createOrder, transitionOrder } = await import('../worker/services/orders.ts');
    for (const restock of [false, true]) {
      const inputBody = JSON.parse(orderRequests[0].body);
      inputBody.sender.phone = '0900002222';
      const number = (await createOrder(db, inputBody, crypto.randomUUID())).data.order_number;
      for (const status of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT']) await transitionOrder(db, number, status);
      const beforeFailure = await stock(variant);
      await navigate(`/admin/orders?order=${number}`); await waitFor("document.querySelector('[data-testid=admin-order-detail]')?.dataset.status === 'IN_TRANSIT'");
      await click('[data-testid=order-status-CANCELLED]');
      await expect("document.querySelector('[data-testid=confirm-cancel-order]').disabled && !document.querySelector('[data-testid=cancel-order-dialog] input[type=checkbox]').checked", 'Failed delivery defaults to no restock and requires reason');
      await input('[data-testid=failed-delivery-reason]', 'SMOKE: recipient refused delivery');
      if (restock) await checked('[data-testid=cancel-order-dialog] input[type=checkbox]', true);
      if (!restock) {
        faults.push({ path: `/api/admin/orders/${number}/status`, method: 'PATCH', mode: 'before-500' });
        await click('[data-testid=confirm-cancel-order]');
        await waitFor("Boolean(document.querySelector('[data-testid=cancel-order-dialog] [role=alert]'))");
        assert.equal((await first('SELECT status_code FROM orders WHERE order_number = ?', [number])).status_code, 'IN_TRANSIT');
        assert.equal(await stock(variant), beforeFailure);
      }
      await click('[data-testid=confirm-cancel-order]');
      await waitFor("document.querySelector('[data-testid=admin-order-detail]')?.dataset.status === 'CANCELLED'");
      assert.equal(await stock(variant), beforeFailure + (restock ? 1 : 0));
      const closed = await first('SELECT stock_released, payment_status FROM orders WHERE order_number = ?', [number]);
      assert.equal(closed.stock_released, restock ? 1 : 0); assert.equal(closed.payment_status, 'UNPAID');
    }
    return { deliveredPaid: true, cancellationStockReleasedOnce: true, failedDeliveryReason: true, failedDeliveryDefaultNoRestock: true, explicitRestock: true };
  });
  await scenario(9, 'Admin stock_delta to zero disables selected shop variant', async () => {
    await navigate('/admin/stock'); await waitFor(`Boolean(document.querySelector('[data-variant-id="${variant}"]'))`);
    const current = await stock(variant);
    await input(`[data-variant-id="${variant}"] [name=stock_delta]`, -current);
    await click(`[data-testid="variant-save-${variant}"]`);
    await waitFor(`document.querySelector('[data-variant-id="${variant}"]')?.dataset.stock === '0'`);
    assert.equal(await stock(variant), 0);
    await navigate('/shop'); await waitFor("document.querySelectorAll('[data-product-id]').length === 8");
    await input('[data-product-id="1"] select', variant);
    await expect("document.querySelector('[data-product-id=\"1\"] button').disabled", 'Out of stock selected variant must block Add');
    return { atomicDelta: -current, stock: 0, shopAddDisabled: true };
  });
  await scenario(10, 'MVP source uses VND/Vietnam timezone and hidden legacy links stay absent', async () => {
    const scan = scanActiveRuntime();
    await navigate('/shop'); await waitFor("document.querySelectorAll('[data-product-id]').length === 8");
    await expect("!document.querySelector('a[href=\"/signup\"]') && !document.querySelector('a[href=\"/profile\"]') && !document.querySelector('a[href=\"/request\"]')", 'Deferred links must stay hidden');
    return { activeRuntimeCurrencyTimezoneScan: true, ...scan, retainedLegacySource: true, hiddenNavigation: true };
  });

  // Extended acceptance is kept separate from the ten contractual scenarios.
  await scenario('11', 'Admin product creation, variant edits, zones and dashboard use persisted API data', async () => {
    await navigate('/admin/orders'); await waitFor("Boolean(document.querySelector('[data-testid=admin-orders]'))");
    await input('[name=status]', 'DELIVERED'); await input('[name=date]', tomorrow); await input('[name=q]', firstOrder);
    await textClick('Apply filters');
    await waitFor(`Boolean(document.querySelector('[data-order-number="${firstOrder}"]')) && !document.querySelector('[data-order-number="${cancelOrder}"]')`);
    await expect(`!document.querySelector('[data-order-number="${cancelOrder}"]')`, 'Admin filters must exclude nonmatching orders');
    await verifyAdminCrud({ first, all, today: todayInVN() });
    return { products: true, variants: true, zones: true, dashboard: true, orderFilters: true, ambiguousStockDeltaCommittedOnce: true, stockRecheckResetsDelta: true };
  });
  if (!skipResponsive) await scenario('12', 'English/Vietnamese loading/error/retry/unauthorized and responsive layouts', async () => {
    await verifyStatesAndResponsive(tomorrow);
    assert.deepEqual(await all('PRAGMA foreign_key_check'), []);
    assert.equal((await first('SELECT COUNT(*) AS n FROM product_variants WHERE stock_quantity < 0')).n, 0);
    assert.deepEqual(exceptions, []);
    return { locales: ['en', 'vi'], widths: [320, 390, 768, 1024], states: ['loading', 'error', 'retry', 'unauthorized'], changedIntentCreatesNewKey: true, exceptions: 0 };
  });
}

async function verifyAdminCrud({ first, today }) {
  // Form field selectors are deliberately semantic and remain the same in EN/VI.
  await navigate('/admin/stock'); await waitFor("Boolean(document.querySelector('[data-testid=admin-products]'))");
  await click('[data-testid=product-create]');
  await evaluate("document.querySelector('[data-testid=product-form] details').open = true");
  assert.equal(await evaluate("Boolean(document.querySelector('[data-testid=product-form] [name=slug]'))"), false);
  for (const [name, value] of Object.entries({ name_en: 'Phase Five Test Bouquet', name_vi: 'Bó hoa kiểm Phase Five', image_url: 'https://res.cloudinary.com/demo/image/upload/phase5.jpg' })) await input(`[data-testid=product-form] [name="${name}"]`, value);
  await input('[data-testid=product-form] [name=category_id]', 1);
  for (const [index, size] of ['S', 'M', 'L'].entries()) {
    await input(`[data-testid=product-form] [name="sku-${size}"]`, `P5-TEST-${size}`);
    await input(`[data-testid=product-form] [name="price-${size}"]`, 100000 + index * 50000);
    await input(`[data-testid=product-form] [name="stock-${size}"]`, 5);
  }
  await click('[data-testid=product-form-save]');
  await waitFor("document.body.innerText.includes('Phase Five Test Bouquet')");
  const product = await first('SELECT id, slug FROM products WHERE name_en = ?', ['Phase Five Test Bouquet']); assert.ok(product);
  assert.match(product.slug, /^phase-five-test-bouquet-[a-f0-9-]{36}$/);
  assert.equal((await first('SELECT COUNT(*) AS n FROM product_variants WHERE product_id = ?', [product.id])).n, 3);
  const variant = await first('SELECT id FROM product_variants WHERE product_id = ? AND size_code = ?', [product.id, 'S']);
  await input(`[data-variant-id="${variant.id}"] [name=price]`, 110000);
  await input(`[data-variant-id="${variant.id}"] [name=low_stock_threshold]`, 3);
  await checked(`[data-variant-id="${variant.id}"] [name=is_active]`, false);
  await click(`[data-testid="variant-save-${variant.id}"]`);
  await waitUntil(async () => (await first('SELECT price FROM product_variants WHERE id = ?', [variant.id])).price === 110000, 'Variant price edit must persist');
  const updatedVariant = await first('SELECT price, low_stock_threshold, is_active, stock_quantity FROM product_variants WHERE id = ?', [variant.id]);
  assert.deepEqual(updatedVariant, { price: 110000, low_stock_threshold: 3, is_active: 0, stock_quantity: 5 });
  await waitFor(`!document.querySelector('[data-testid="variant-save-${variant.id}"]')?.disabled && document.querySelector('[data-variant-id="${variant.id}"] [name=price]')?.value === '110000'`);
  // A stock delta is not idempotent. Lose a successful write response, then fail
  // its automatic reconciliation read so the explicit recovery control is tested.
  const variantPath = `/api/admin/variants/${variant.id}`;
  const writesBefore = requests.filter(request => request.path === variantPath && request.method === 'PATCH').length;
  faults.push({ path: variantPath, method: 'PATCH', mode: 'after-commit-loss' }, { path: '/api/admin/products', method: 'GET', mode: 'before-500' });
  await input(`[data-variant-id="${variant.id}"] [name=stock_delta]`, 1); await click(`[data-testid="variant-save-${variant.id}"]`);
  await waitUntil(async () => (await first('SELECT stock_quantity FROM product_variants WHERE id = ?', [variant.id])).stock_quantity === 6, 'Stock delta must commit before its response is lost');
  await waitFor(`document.querySelector('[data-testid="variant-save-${variant.id}"]')?.disabled && Boolean(document.querySelector('[data-testid="variant-recheck-${variant.id}"]'))`);
  await expect(`document.querySelector('[data-variant-id="${variant.id}"] [name=stock_delta]').value === '0'`, 'Ambiguous stock adjustment must clear the submitted delta');
  await evaluate(`document.querySelector('[data-testid="variant-save-${variant.id}"]').click()`); await pause(150);
  assert.equal(requests.filter(request => request.path === variantPath && request.method === 'PATCH').length, writesBefore + 1, 'Blocked retry must not resend a committed stock delta');
  assert.equal((await first('SELECT stock_quantity FROM product_variants WHERE id = ?', [variant.id])).stock_quantity, 6);
  await click(`[data-testid="variant-recheck-${variant.id}"]`);
  await waitFor(`document.querySelector('[data-variant-id="${variant.id}"]')?.dataset.stock === '6' && !document.querySelector('[data-testid="variant-save-${variant.id}"]')?.disabled`);
  await expect(`document.querySelector('[data-variant-id="${variant.id}"] [name=stock_delta]').value === '0'`, 'Canonical recheck must require a new deliberate adjustment');
  await click(`[data-testid="variant-save-${variant.id}"]`); await pause(150);
  assert.equal(requests.filter(request => request.path === variantPath && request.method === 'PATCH').length, writesBefore + 1, 'Saving an unchanged reconciled row must not repeat the delta');
  assert.equal((await first('SELECT stock_quantity FROM product_variants WHERE id = ?', [variant.id])).stock_quantity, 6);
  await navigate('/admin/delivery-zones'); await waitFor("Boolean(document.querySelector('[data-testid=admin-delivery-zones]'))");
  await click('[data-testid=zone-create]');
  await input('[data-testid=zone-form] [name=province_name]', 'Tỉnh Phase Five'); await input('[data-testid=zone-form] [name=ward_name]', '');
  await input('[data-testid=zone-form] [name=fee]', 17000); await click('[data-testid=zone-form-save]');
  await waitFor("document.body.innerText.includes('Tỉnh Phase Five')");
  const zone = await first('SELECT id FROM delivery_zones WHERE province_name = ?', ['Tỉnh Phase Five']); assert.ok(zone);
  await click(`[data-testid="zone-edit-${zone.id}"]`); await input('[data-testid=zone-form] [name=fee]', 23000); await click('[data-testid=zone-form-save]');
  await waitFor(`document.querySelector('[data-zone-id="${zone.id}"]')?.innerText.includes('23')`);
  assert.equal((await first('SELECT fee FROM delivery_zones WHERE id = ?', [zone.id])).fee, 23000);
  await click(`[data-testid="zone-toggle-${zone.id}"]`);
  await waitFor(`document.querySelector('[data-zone-id="${zone.id}"]')?.dataset.active === 'false'`);
  assert.equal((await first('SELECT is_active FROM delivery_zones WHERE id = ?', [zone.id])).is_active, 0);
  await navigate('/admin/dashboard'); await waitFor("Boolean(document.querySelector('[data-testid=admin-dashboard]'))");
  await waitFor("Boolean(document.querySelector('[data-order-number]'))");
  await expect("!document.querySelector('svg.recharts-surface') && Boolean(document.querySelector('[data-order-number]'))", 'Dashboard must show server summary/recent orders without fixture chart');
  const statusCounts = {};
  for (const status of ['PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']) {
    statusCounts[status] = (await first('SELECT COUNT(*) AS n FROM orders WHERE status_code = ?', [status])).n;
    await expect(`document.querySelector('[data-status-count="${status}"]')?.innerText.includes(${JSON.stringify(String(statusCounts[status]))})`, `Dashboard ${status} count must match D1`);
  }
  const lowStock = (await first('SELECT COUNT(*) AS n FROM product_variants v JOIN products p ON p.id=v.product_id JOIN categories c ON c.id=p.category_id WHERE v.stock_quantity <= v.low_stock_threshold AND v.is_active=1 AND p.status="ACTIVE" AND c.is_active=1')).n;
  await expect(`document.querySelector('[data-testid=low-stock-count]')?.innerText.includes(${JSON.stringify(String(lowStock))})`, 'Dashboard low stock count must match D1');
  const todayOrders = (await first("SELECT COUNT(*) AS n FROM orders WHERE date(placed_at, '+7 hours') = ?", [today])).n;
  await expect(`document.querySelector('[data-testid=today-orders]')?.innerText.includes(${JSON.stringify(String(todayOrders))})`, 'Dashboard orders today must match Vietnam date in D1');
  await screenshot('11-admin-dashboard');
}

async function verifyStatesAndResponsive(tomorrow) {
  await addPeony('S'); await fillCheckout(tomorrow); await reviewCheckout();
  faults.push({ path: '/api/orders', method: 'POST', mode: 'before-500' }); await click(selectors.place);
  await waitFor("Boolean(document.querySelector('[role=alert]'))");
  const initialIntent = orderRequests.at(-1);
  await click('[data-checkout-edit]'); await input('[name=note]', 'Changed synthetic order intent'); await reviewCheckout();
  faults.push({ path: '/api/orders', method: 'POST', mode: 'before-500' }); await click(selectors.place);
  await waitFor("Boolean(document.querySelector('[role=alert]'))");
  const changedIntent = orderRequests.at(-1);
  assert.notEqual(initialIntent.key, changedIntent.key, 'Changed order content must create a new UUID intent');
  assert.notEqual(initialIntent.body, changedIntent.body, 'New intent must contain the changed content');
  const translatedErrors = {};
  for (const language of ['en', 'vi']) {
    await navigate('/shop'); await locale(language);
    faults.push({ path: '/api/products', mode: 'before-500', delay: 350 });
    await reload("Boolean(document.querySelector('[role=status]')) || Boolean(document.querySelector('[role=alert]'))");
    await waitFor("Boolean(document.querySelector('[role=alert]'))");
    translatedErrors[language] = await evaluate("document.querySelector('[role=alert]').innerText");
    await expect("!document.querySelector('[data-product-id]') && !document.body.innerText.includes('Synthetic local API failure.')", 'API error must use localized copy without fixture fallback');
    await click('[role=alert] button'); await waitFor("document.querySelectorAll('[data-product-id]').length >= 8");
    for (const [route, endpoint, selector] of [
      ['/admin/dashboard', '/api/admin/summary', '[data-testid=admin-dashboard]'],
      ['/admin/orders', '/api/admin/orders', '[data-testid=admin-orders]'],
      ['/admin/stock', '/api/admin/products', '[data-testid=admin-products]'],
      ['/admin/delivery-zones', '/api/admin/delivery-zones', '[data-testid=admin-delivery-zones]'],
    ]) {
      faults.push({ path: endpoint, mode: 'before-500', delay: 350 });
      await navigate(route);
      await waitFor("Boolean(document.querySelector('[role=status]')) || Boolean(document.querySelector('[role=alert]'))");
      await waitFor("Boolean(document.querySelector('[role=alert]'))");
      await expect("!document.querySelector('[role=alert]').innerText.includes('Synthetic local API failure.')", 'Admin API errors must use localized copy');
      await click('[role=alert] button');
      await waitFor(`Boolean(document.querySelector(${JSON.stringify(selector)})) && !document.querySelector('[role=alert]')`);
    }
    for (const route of ['/shop', '/cart', '/orders/track', '/admin/dashboard', '/admin/stock', '/admin/orders', '/admin/delivery-zones']) {
      await navigate(route); await pause(150);
      for (const width of [320, 390, 768, 1024]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
        await expect(`document.documentElement.scrollWidth <= ${width} + 1`, `${language} ${route} overflows at ${width}px`);
      }
    }
    await screenshot(`12-admin-responsive-${language}`);
    await addPeony('S'); await fillCheckout(tomorrow);
    await locale(language === 'en' ? 'vi' : 'en');
    await expect("document.querySelector('[name=senderName]').value === 'Phase Five Sender' && document.querySelector('[name=address]').value === '12 Synthetic Flower Street'", 'Locale switching must preserve customer input');
    await locale(language);
    for (const width of [320, 390, 768, 1024]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
      await expect(`document.documentElement.scrollWidth <= ${width} + 1`, `${language} checkout form overflows at ${width}px`);
    }
    await screenshot(`12-checkout-responsive-${language}`);
  }
  assert.notEqual(translatedErrors.en, translatedErrors.vi, 'API error UI must translate between English and Vietnamese');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate('/admin/dashboard');
  await send('Network.clearBrowserCookies');
  await navigate('/admin/orders'); await waitFor(`Boolean(document.querySelector(${JSON.stringify(selectors.login)}))`);
  await screenshot('12-unauthorized-login-vi');
}

mkdirSync(evidenceRoot, { recursive: true });
const before = persistedSnapshot();
let fatal;
try {
  const db = await createBridge();
  console.log(`Phase 5 UI LOCAL ONLY at ${origin}; D1 persist:false; remoteBindings:false; synthetic auth; built frontend/current Worker.`);
  await startBrowser();
  await runAcceptance(db);
  if (turnstileTest) {
    assert.deepEqual([...verifiedActions].sort(), ['admin_login', 'checkout', 'lookup']);
    await send('Network.clearBrowserCookies');
    await navigate('/admin/login');
    await waitFor("Boolean(document.querySelector('[data-turnstile-challenge=admin_login]')) && !document.querySelector('[data-testid=admin-login-submit]').disabled");
    await evaluate("[...window.__turnstileWidgets.values()][0]['expired-callback']()");
    await waitFor("document.querySelector('[data-testid=admin-login-submit]').disabled");
    await evaluate("[...window.__turnstileWidgets.values()][0]['error-callback']()");
    await waitFor("Boolean(document.querySelector('[data-turnstile-challenge] [role=alert]'))");
    await click('[data-turnstile-challenge] button');
    await waitFor("!document.querySelector('[data-testid=admin-login-submit]').disabled && !document.querySelector('[data-turnstile-challenge] [role=alert]')");
    await locale('en'); await locale('vi');
    await waitFor("[...window.__turnstileWidgets.values()][0]?.language === 'vi'");
    for (const width of [320, 390, 768, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
      await waitFor("[...window.__turnstileWidgets.values()].every(widget => widget.size === (document.querySelector('[data-turnstile-challenge] > div').clientWidth < 300 ? 'compact' : 'flexible'))");
      await expect(`document.documentElement.scrollWidth <= ${width} + 1`, `Turnstile login overflows at ${width}px`);
    }
    console.log('PASS B2 Turnstile: all 3 actions, single-use tokens, fresh-token/same-order retry, expiry blocks submit, error/retry and EN/VI widget lifecycle (mock provider).');
  }
} catch (error) {
  fatal = error.message;
  process.exitCode = 1;
  console.error(`Phase 5 UI acceptance failed: ${error.message}`);
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  browser?.kill();
  if (server) await new Promise(resolve => server.close(resolve));
  await platform?.dispose();
  const persistedUnchanged = JSON.stringify(before) === JSON.stringify(persistedSnapshot());
  if (!persistedUnchanged) { process.exitCode = 1; fatal = [fatal, 'Persisted .wrangler/state changed during isolated acceptance'].filter(Boolean).join('; '); }
  const evidence = {
    checkedAt: new Date().toISOString(), runtime: 'Edge CDP; Node HTTP bridge/current Worker; real isolated workerd D1',
    limitations: ['Node bridge supplies timingSafeEqual; native workerd auth remains covered separately by Phase 4 evidence.', 'Local UI checks do not measure Cloudflare production CPU or production Turnstile.'],
    isolation: { persist: false, remoteBindings: false, envFile: '.dev.vars.example', syntheticCredentials: true, persistedSnapshot: 'Read-only logical D1 schema/table SHA-256; excludes mutable Wrangler cache/observability metadata', persistedUnchanged },
    scenarios: results, mandatoryPassed: results.filter(result => Number(result.number) <= 10 && result.status === 'PASS').length,
    extendedPassed: results.filter(result => Number(result.number) > 10 && result.status === 'PASS').length,
    requests, orderRetryEvidence: orderRequests.map(({ key, body, scenario }) => ({ scenario, keyHash: createHash('sha256').update(key || '').digest('hex'), bodyHash: createHash('sha256').update(body).digest('hex') })),
    exceptions, ...(fatal ? { fatal } : {}),
    turnstile: { mocked: turnstileTest, verifiedActions: [...verifiedActions], singleUseTokens: usedTokens.size }, skippedResponsive: skipResponsive,
  };
  writeFileSync(path.join(evidenceRoot, 'phase5-ui-results.json'), JSON.stringify(evidence, null, 2));
  console.log(`Phase 5 UI: ${evidence.mandatoryPassed}/10 scenarios; ${evidence.extendedPassed}/2 extended; responsive group skipped=${skipResponsive}; persisted D1 unchanged=${persistedUnchanged}; exceptions=${exceptions.length}.`);
}
