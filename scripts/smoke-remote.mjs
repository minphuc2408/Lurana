import { canonicalWardName } from '../shared/delivery-areas.ts';
import { randomUUID } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';
import { isIP } from 'node:net';

const ensure = (condition, message) => { if (!condition) throw new Error(message); };
const confidential = new Set(['password', 'password_hash', 'admin_password', 'jwt_secret', 'secret', 'jwt', 'token', 'cookie', 'stack', 'stack_trace', 'sql']);

export function parseRemoteArgs(args) {
  const values = {};
  const switches = new Set(['--allow-remote-writes', '--exclusive-test-window']);
  const valued = new Set(['--base-url', '--confirm-origin', '--variant-id']);
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    ensure(!Object.hasOwn(values, key), 'Duplicate smoke option.');
    ensure(switches.has(key) || valued.has(key), 'Unknown smoke option; credentials must never be passed as arguments.');
    if (switches.has(key)) values[key] = true;
    else {
      ensure(typeof args[index + 1] === 'string' && !args[index + 1].startsWith('--'), 'Smoke option needs a value.');
      values[key] = args[++index];
    }
  }
  ensure(values['--base-url'], 'Deployment smoke requires explicit --base-url.');
  let url;
  try { url = new URL(values['--base-url']); } catch { throw new Error('Invalid smoke origin.'); }
  ensure(url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash,
    'Deployment smoke requires an HTTPS origin without credentials, path, query or fragment.');
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '');
  ensure(!isIP(hostname) && hostname.includes('.') && !/(?:^|\.)(?:localhost|local|localdomain)$/.test(hostname) && !url.port,
    'Deployment smoke requires a public hostname on HTTPS port 443; use the existing positional 127.0.0.1 mode for local smoke.');
  const writes = values['--allow-remote-writes'] === true;
  const variantId = Number(values['--variant-id']);
  if (writes) {
    ensure(values['--confirm-origin'] === url.origin, 'Writes require --confirm-origin matching the exact HTTPS origin.');
    ensure(values['--exclusive-test-window'] === true, 'Writes require an exclusive test window without customers or inventory edits.');
    ensure(/^[1-9]\d*$/.test(values['--variant-id'] || '') && Number.isSafeInteger(variantId), 'Writes require an explicit positive --variant-id.');
  } else ensure(!values['--confirm-origin'] && !values['--variant-id'] && !values['--exclusive-test-window'], 'Write options require --allow-remote-writes.');
  return Object.freeze({ origin: url.origin, writes, ...(writes ? { variantId } : {}) });
}

export function assertSafePayload(value, sensitiveValues = [], isPublic = false) {
  if (typeof value === 'string') {
    ensure(!/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/.test(value), 'Response leaked a JWT.');
    ensure(!sensitiveValues.some(secret => secret && value.includes(secret)), 'Response leaked a credential.');
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    ensure(!confidential.has(key.toLowerCase()), 'Response contains a confidential field.');
    if (isPublic) ensure(!['stock_quantity', 'archived_at', 'cloudinary_public_id', 'admin_note', 'stock_released', 'idempotency_key'].includes(key), 'Public response contains a private field.');
    assertSafePayload(child, sensitiveValues, isPublic);
  }
}

export function parseCredentials(input) {
  let result;
  try { result = JSON.parse(input); } catch { throw new Error('Credential stdin must contain JSON with admin_password and optional turnstile_tokens.'); }
  ensure(result && typeof result === 'object' && !Array.isArray(result), 'Invalid credential input.');
  ensure(Object.keys(result).every(key => ['admin_password', 'turnstile_tokens'].includes(key)), 'Unexpected credential input field.');
  ensure(typeof result.admin_password === 'string' && result.admin_password.length >= 24 && result.admin_password.length <= 1024,
    'Provide an admin password of at least 24 characters through hidden stdin.');
  const tokens = result.turnstile_tokens ?? [];
  ensure(Array.isArray(tokens) && tokens.length <= 16 && tokens.every(token => typeof token === 'string' && token.length > 0 && token.length <= 2048), 'Invalid Turnstile token input.');
  return { password: result.admin_password, tokens: [...tokens] };
}

async function hiddenPassword() {
  process.stderr.write('Admin password (hidden, memory only): ');
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  try {
    return await new Promise((resolve, reject) => {
      let password = '';
      const keypress = (text, key = {}) => {
        if (key.ctrl && key.name === 'c') finish(new Error('Credential input cancelled.'));
        else if (key.name === 'return' || key.name === 'enter') finish(null, password);
        else if (key.name === 'backspace') password = password.slice(0, -1);
        else if (!key.ctrl && !key.meta && text && !/[\r\n]/.test(text)) {
          password += text;
          if (password.length > 1024) finish(new Error('Credential input is too long.'));
        }
      };
      function finish(error, value) {
        process.stdin.off('keypress', keypress);
        process.stderr.write('\n');
        if (error) reject(error); else resolve(value);
      }
      process.stdin.on('keypress', keypress);
    });
  } finally {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
}

async function readCredentials() {
  if (process.stdin.isTTY) return parseCredentials(JSON.stringify({ admin_password: await hiddenPassword() }));
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    ensure(input.length <= 40_000, 'Credential stdin is too long.');
  }
  return parseCredentials(input);
}

/** No D1/CLI access: all writes use the selected deployment's documented APIs. */
export async function runRemoteSmoke(config, { fetchImpl = fetch, log = console.log, credentials, signal } = {}) {
  // Validate even callers that bypass the CLI parser (tests may inject an HTTPS fetch bridge).
  const checked = parseRemoteArgs(['--base-url', config.origin, ...(config.writes ? [
    '--allow-remote-writes', '--confirm-origin', config.origin, '--variant-id', String(config.variantId), '--exclusive-test-window',
  ] : [])]);
  const origin = checked.origin;
  const runId = randomUUID();
  let passed = 0;
  let stage = 'read-only setup';
  let cookie;
  let password;
  let tokens = [];
  let sensitiveTokens = [];
  let uncertain = false;
  let baseline;
  let expectedStock;
  let deliveredDebt = 0;
  let stockOffset = 0;
  let writesStarted = false;
  const created = new Set();
  const done = label => { passed++; log(`PASS ${label}`); };
  const api = async (route, { method = 'GET', body, admin = false, status = 200, key, errorCode } = {}) => {
    if (method === 'POST' && ['/api/admin/login', '/api/orders', '/api/orders/lookup'].includes(route)) {
      const token = tokens.shift();
      if (token) body = { ...body, turnstile_token: token };
    }
    const mutates = method !== 'GET' && route !== '/api/checkout/quote' && route !== '/api/orders/lookup' && route !== '/api/admin/login' && route !== '/api/admin/logout';
    ensure(!mutates || config.writes, 'Read-only smoke refused a write.');
    const headers = { ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(admin ? { origin, ...(cookie ? { cookie } : {}) } : {}), ...(key ? { 'Idempotency-Key': key } : {}) };
    let response;
    let payload;
    try {
      response = await fetchImpl(new URL(route, origin), { method, headers, redirect: 'error', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      payload = await response.json();
      if (mutates && response.status >= 500) uncertain = true;
    } catch {
      if (mutates) uncertain = true;
      throw new Error('Request failed or returned unreadable data; a write may already have applied.');
    }
    try {
      ensure(/^application\/json(?:;|$)/i.test(response.headers.get('content-type') || ''), 'API response must be JSON.');
      ensure(response.headers.get('x-request-id'), 'API response needs a request ID.');
      ensure(response.headers.get('x-content-type-options') === 'nosniff', 'API response needs nosniff.');
      assertSafePayload(payload, [password, ...sensitiveTokens], !route.startsWith('/api/admin/'));
      ensure((Array.isArray(status) ? status : [status]).includes(response.status), `Unexpected HTTP status at ${route.replace(/LNR-[\w-]+/g, '<smoke-order>')}.`);
      if (errorCode) ensure(payload.error?.code === errorCode, 'Unexpected API error code.');
      if (payload.error?.message) ensure(!/(?:SELECT|INSERT|UPDATE|DELETE)\s|(?:TypeError|SyntaxError|Error):|\n\s*at\s/i.test(payload.error.message), 'API error contains internal details.');
    } catch (cause) {
      if (mutates && response.ok) uncertain = true;
      throw cause;
    }
    return { data: payload.data, payload, response };
  };
  const stock = async () => {
    const data = (await api('/api/admin/products', { admin: true })).data;
    const variant = data.items.flatMap(product => product.variants).find(item => item.id === config.variantId);
    ensure(variant && Number.isSafeInteger(variant.stock_quantity), 'Selected variant is unavailable in admin catalog.');
    return variant.stock_quantity;
  };
  const verifyStock = async () => ensure(await stock() === expectedStock, 'Stock differs from expected test activity; stop and reconcile before cleanup.');
  const delta = async (amount, kind) => {
    if (amount === 0) return;
    await verifyStock();
    await api(`/api/admin/variants/${config.variantId}`, { method: 'PATCH', admin: true, body: { stock_delta: amount } });
    expectedStock += amount;
    if (kind === 'delivered') deliveredDebt = 0;
    if (kind === 'offset') stockOffset += amount;
    await verifyStock();
  };
  const transition = async (number, to_status, status = 200) => {
    const detail = (await api(`/api/admin/orders/${number}`, { admin: true })).data;
    ensure(detail.customer_note === `SMOKE ${runId}`, 'Refusing to change an order outside this smoke run.');
    const result = await api(`/api/admin/orders/${number}/status`, { method: 'PATCH', admin: true,
      body: { to_status, note: `SMOKE ${runId}` }, status, ...(status === 409 ? { errorCode: 'INVALID_TRANSITION' } : {}) });
    if (status === 200) ensure(result.data.status_code === to_status, 'Order transition was not confirmed.');
    return result.data;
  };
  try {
    stage = 'health, SPA and public catalog';
    ensure((await api('/api/health')).data.ok === true, 'Health did not report liveness.');
    for (const route of ['/', '/shop', '/orders/track']) {
      const request = target => fetchImpl(target, { headers: { accept: 'text/html', 'sec-fetch-mode': 'navigate' }, redirect: 'manual', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000) });
      const url = new URL(route, origin);
      let response = await request(url);
      if ([301, 302, 307, 308].includes(response.status)) {
        const destination = new URL(response.headers.get('location') || '', url);
        ensure(destination.href === origin + route + '/', 'Unexpected SPA redirect.');
        await response.body?.cancel();
        response = await request(destination);
      }
      ensure(response.status === 200 && /text\/html/i.test(response.headers.get('content-type') || ''), 'SPA fallback failed.');
      const html = await response.text();
      ensure(/id="root"/.test(html), 'SPA root is missing.');
      ensure(!html.includes('₱'), 'SPA HTML contains a legacy currency symbol.');
    }
    done('health + SPA reload /shop and /orders/track');
    const categories = (await api('/api/categories')).data;
    const products = (await api('/api/products')).data.items;
    ensure(Array.isArray(categories) && categories.length && Array.isArray(products) && products.length, 'Catalog must contain active categories and products.');
    for (const product of products) {
      ensure(product.name_en && product.name_vi && product.variants?.length, 'Catalog lacks localized names or variants.');
      ensure(product.variants.every(variant => Number.isSafeInteger(variant.price) && variant.price >= 0), 'Catalog prices must be integer VND.');
    }
    const selectedProduct = config.writes ? products.find(product => product.variants.some(variant => variant.id === config.variantId)) : products[0];
    ensure(selectedProduct, 'Explicit variant must belong to an active public product.');
    const publicVariant = config.writes ? selectedProduct.variants.find(item => item.id === config.variantId) : selectedProduct.variants[0];
    const detail = (await api(`/api/products/${encodeURIComponent(selectedProduct.slug)}`)).data;
    ensure(detail.id === selectedProduct.id && detail.variants.some(variant => variant.id === publicVariant.id && variant.price === publicVariant.price), 'Product detail differs from list.');
    done('catalog list/detail, integer VND amounts and public DTO privacy');
    const options = (await api('/api/delivery/options')).data;
    ensure(options.methods.some(method => method.code === 'STANDARD') && options.time_slots.length > 0, 'STANDARD delivery and a time slot are required.');
    await api('/api/admin/me', { status: 401, errorCode: 'UNAUTHORIZED' });
    await api('/api/admin/unknown', { status: 401, errorCode: 'UNAUTHORIZED' });
    await api('/api/unknown', { status: 404, errorCode: 'NOT_FOUND' });
    done('anonymous admin boundary + JSON API 404');
    if (!config.writes) {
      log(`Deployment read-only smoke: ${passed}/${passed} PASS. No order, login or inventory writes. API checks do not replace deployed browser/cart/locale acceptance.`);
      return { passed, runId, writes: false };
    }

    stage = 'admin login and existing delivery configuration';
    const supplied = credentials || await readCredentials();
    password = supplied.password;
    tokens = [...supplied.tokens];
    sensitiveTokens = [...tokens];
    ensure(typeof password === 'string' && password.length >= 24, 'Missing in-memory admin credential.');
    const login = await api('/api/admin/login', { method: 'POST', admin: true, body: { password } });
    const setCookie = login.response.headers.get('set-cookie') || '';
    ensure(/^lunara_admin=/.test(setCookie) && /; HttpOnly(?:;|$)/i.test(setCookie) && /; Secure(?:;|$)/i.test(setCookie)
      && /; SameSite=Strict(?:;|$)/i.test(setCookie) && /; Path=\/(?:;|$)/i.test(setCookie), 'Admin HTTPS cookie security attributes failed.');
    cookie = setCookie.split(';', 1)[0];
    ensure((await api('/api/admin/me', { admin: true })).data.role === 'ADMIN', 'Admin session not confirmed.');
    const zones = (await api('/api/admin/delivery-zones', { admin: true })).data.items.filter(zone => zone.is_active);
    const wardZone = zones.find(zone => zone.ward_name && options.provinces.some(p => p.province_name === zone.province_name && p.wards.some(w => w.ward_name === canonicalWardName(zone.ward_name))));
    ensure(wardZone, 'An imported active ward is required; configure it through the approved owner workflow.');
    baseline = await stock();
    expectedStock = baseline;
    ensure(baseline >= 1, 'Selected test variant needs at least one unit of stock.');
    const price = publicVariant.price;
    const surcharge = options.methods.find(method => method.code === 'STANDARD').surcharge;
    const quote = async (province_name, ward_name) => (await api('/api/checkout/quote', { method: 'POST', body: {
      items: [{ variant_id: config.variantId, quantity: 1 }], province_name, ward_name, delivery_method_code: 'STANDARD',
    } })).data;
    const fee = zone => (zone.free_from_amount !== null && price >= zone.free_from_amount ? 0 : zone.fee) + surcharge;
    const wardQuote = await quote(wardZone.province_name, wardZone.ward_name);
    ensure(wardQuote.delivery_fee === fee(wardZone) && wardQuote.subtotal === price, 'Ward quote must use DB price and ward fee.');
    const fallbackWard = `SMOKE ${runId}`;
    await api('/api/checkout/quote', { method: 'POST', status: 422, errorCode: 'NO_DELIVERY_ZONE', body: { items: [{ variant_id: config.variantId, quantity: 1 }], province_name: wardZone.province_name, ward_name: fallbackWard, delivery_method_code: 'STANDARD' } });
    const missingProvince = `SMOKE ${runId}`;
    ensure(!zones.some(zone => zone.province_name === missingProvince), 'Synthetic unsupported province unexpectedly exists.');
    await api('/api/checkout/quote', { method: 'POST', status: 422, errorCode: 'NO_DELIVERY_ZONE', body: {
      items: [{ variant_id: config.variantId, quantity: 1 }], province_name: missingProvince, ward_name: fallbackWard, delivery_method_code: 'STANDARD',
    } });
    done('admin HTTPS login; configured ward/unconfigured/no-delivery-zone fee rules');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    const body = () => ({
      items: [{ variant_id: config.variantId, quantity: 1 }],
      sender: { name: `SMOKE ${runId}`, phone: '0900000000', is_anonymous: false },
      recipient: { name: 'SMOKE recipient', phone: '0911111111', province_name: wardZone.province_name, ward_name: wardZone.ward_name, address_line: 'SMOKE synthetic address; do not deliver' },
      delivery: { method_code: 'STANDARD', date: date.toISOString().slice(0, 10), time_slot: options.time_slots[0] },
      card: { type: 'NONE' }, customer_note: `SMOKE ${runId}`,
    });
    const create = async (input = body(), key = randomUUID(), status = 201) => {
      writesStarted = true;
      const result = await api('/api/orders', { method: 'POST', body: input, key, status });
      if (result.response.ok) {
        if (!/^LNR-\d{6}-[A-HJ-KM-NP-Z2-9]{6}$/.test(result.data?.order_number || '')) {
          uncertain = true;
          throw new Error('Order confirmation is unreadable; reconcile this run before retrying.');
        }
        created.add(result.data.order_number);
      }
      return result;
    };
    log(`SMOKE run=${runId}; variant=${config.variantId}; baseline_stock=${baseline}. Exclusive test window required; keep this non-secret recovery record.`);
    stage = 'COD, idempotency, lookup and delivered/paid transitions';
    const firstKey = randomUUID();
    const firstInput = body();
    const first = (await create(firstInput, firstKey)).data;
    expectedStock--;
    deliveredDebt = 1;
    await verifyStock();
    ensure(first.payment_method === 'COD' && first.payment_status === 'UNPAID' && first.subtotal === price
      && first.delivery_fee === wardQuote.delivery_fee && first.grand_total === price + first.delivery_fee, 'COD totals/payment must be server-confirmed.');
    const replay = (await create(firstInput, firstKey, 200)).data;
    ensure(replay.replayed === true && replay.order_number === first.order_number, 'Idempotency replay must return the same order.');
    const runOrders = async () => (await api(`/api/admin/orders?q=${encodeURIComponent(`SMOKE ${runId}`)}&limit=50`, { admin: true })).data;
    ensure((await runOrders()).total === 1, 'Idempotency replay created another order.');
    await verifyStock();
    const lookup = async phone => (await api('/api/orders/lookup', { method: 'POST', body: { order_number: first.order_number, phone } })).data;
    ensure((await lookup('0900000000')).order_number === first.order_number && (await lookup('0911111111')).order_number === first.order_number, 'Sender and recipient lookup must match.');
    await api('/api/orders/lookup', { method: 'POST', body: { order_number: first.order_number, phone: '0999999999' }, status: 404, errorCode: 'NOT_FOUND' });
    await transition(first.order_number, 'DELIVERED', 409);
    for (const status of ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED']) await transition(first.order_number, status);
    const delivered = await lookup('0900000000');
    ensure(delivered.payment_status === 'PAID' && delivered.status_code === 'DELIVERED', 'Delivered order must be PAID.');
    ensure(delivered.timeline.map(event => event.to_status).join(',') === 'PENDING,CONFIRMED,PREPARING,IN_TRANSIT,DELIVERED', 'Order history must follow allowed transitions.');
    await delta(1, 'delivered');
    done('COD stock decrement, exact idempotency replay, private lookup and DELIVERED -> PAID');

    stage = 'price tampering and exactly-once cancellation';
    const tampered = body();
    Object.assign(tampered, { subtotal: 1, delivery_fee: 1, grand_total: 1, role: 'ADMIN' });
    Object.assign(tampered.items[0], { price: 1, unit_price: 1, line_total: 1 });
    const forged = (await create(tampered)).data;
    expectedStock--;
    await verifyStock();
    ensure(forged.subtotal === price && forged.delivery_fee === wardQuote.delivery_fee && forged.grand_total === price + forged.delivery_fee, 'Forged client prices must be ignored.');
    const forgedDetail = (await api('/api/orders/lookup', { method: 'POST', body: { order_number: forged.order_number, phone: '0900000000' } })).data;
    ensure(forgedDetail.items[0].unit_price === price, 'Order snapshot must use DB price.');
    await transition(forged.order_number, 'CANCELLED');
    expectedStock++;
    await transition(forged.order_number, 'CANCELLED', 409);
    await verifyStock();
    done('tampered prices ignored; cancellation restores one unit exactly once');

    stage = 'parallel last-item purchase and inventory restoration';
    await delta(1 - baseline, 'offset');
    const outcomes = await Promise.allSettled([create(body(), randomUUID(), [201, 409]), create(body(), randomUUID(), [201, 409])]);
    const winners = outcomes.filter(result => result.status === 'fulfilled' && result.value.response.status === 201);
    const losers = outcomes.filter(result => result.status === 'fulfilled' && result.value.response.status === 409);
    expectedStock -= winners.length;
    ensure(winners.length === 1 && losers.length === 1 && losers[0].value.payload.error?.code === 'OUT_OF_STOCK', 'Last-item race needs exactly HTTP 201 and HTTP 409 OUT_OF_STOCK.');
    await verifyStock();
    const all = await runOrders();
    ensure(all.total === 3, 'Race must create exactly one extra order.');
    const winner = winners[0].value.data;
    await transition(winner.order_number, 'CANCELLED');
    expectedStock++;
    await verifyStock();
    await delta(-stockOffset, 'offset');
    ensure(expectedStock === baseline, 'Inventory was not restored to the baseline.');
    done('parallel last-item: one order, one rejection; test inventory restored');
    await api('/api/admin/logout', { method: 'POST', admin: true, body: {} });
    cookie = undefined;
    log(`Deployment API smoke: ${passed}/${passed} PASS; ${created.size} SMOKE orders require the documented SQL cleanup. Browser cart/reload, rendered VND/locale and fixture absence still require deployed UI acceptance.`);
    return { passed, writes: true, runId, variantId: config.variantId, baseline, cleanupRequired: true };
  } catch {
    // Intentionally omit exception/response text: either may contain credentials or PII.
    log(`FAIL deployment smoke at ${stage}.`);
    if (writesStarted) log(`CLEANUP REQUIRED: SMOKE run=${runId}; variant=${config.variantId}; baseline_stock=${baseline}; known_orders=${created.size}; ambiguous_write=${uncertain}. Do not delete orders before reconciling inventory.`);
    if (cookie && writesStarted && !uncertain) {
      try {
        for (const number of created) {
          const detail = (await api(`/api/admin/orders/${number}`, { admin: true })).data;
          ensure(detail.customer_note === `SMOKE ${runId}`, 'Smoke ownership check failed.');
          if (['PENDING', 'CONFIRMED', 'PREPARING'].includes(detail.status_code)) {
            await transition(number, 'CANCELLED');
            expectedStock++;
            if (number === [...created][0]) deliveredDebt = 0;
          } else ensure(['CANCELLED', 'DELIVERED'].includes(detail.status_code), 'An in-transit order needs operator reconciliation.');
        }
        await verifyStock();
        const adjustment = deliveredDebt - stockOffset;
        if (adjustment) await delta(adjustment);
        ensure(await stock() === baseline, 'Inventory needs operator reconciliation.');
        log('Known SMOKE orders cancelled where allowed; inventory baseline restored. Documented SQL order cleanup remains required.');
      } catch { log('Automatic recovery stopped. GET current inventory and reconcile this run before any new stock_delta; never blindly retry an ambiguous write.'); }
    }
    throw new Error('Deployment smoke failed; review the non-secret stage and cleanup record above.');
  } finally {
    if (cookie) {
      try { await api('/api/admin/logout', { method: 'POST', admin: true, body: {} }); } catch { log('Admin logout was not confirmed; session remains server-side until expiry or JWT rotation.'); }
    }
    password = undefined;
    tokens = [];
    sensitiveTokens = [];
    cookie = undefined;
  }
}

export async function runRemoteCli(args) {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once('SIGINT', interrupt);
  try {
    const config = parseRemoteArgs(args);
    await runRemoteSmoke(config, { signal: controller.signal });
  } catch (cause) {
    // Our public error messages are fixed, never include raw response/credential data.
    console.error(cause instanceof Error && /^(?:Duplicate smoke|Unknown smoke|Smoke option|Deployment smoke requires|Invalid smoke origin|Deployment smoke requires|Use the existing|Writes require|Write options|Deployment smoke failed)/.test(cause.message)
      ? cause.message : 'Deployment smoke failed. No raw error or credentials were logged.');
    process.exitCode = 1;
  } finally {
    process.off('SIGINT', interrupt);
  }
}
