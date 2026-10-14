// Called by the existing Edge/CDP runner when the D1 storefront is active.
export async function verifyLiveCatalog({ navigate, input, assert, evaluate, waitFor, send, screenshot, delay }) {
  const reload = async predicate => {
    await evaluate('window.__liveReload = true');
    await send('Page.reload');
    await delay(200);
    await waitFor("Boolean(window.__liveReload !== true && document.readyState === 'complete' && (" + predicate + "))");
  };
  await navigate('/shop');
  await evaluate("localStorage.removeItem('lunara.cart.v1'); localStorage.setItem('lunara_language','en')");
  await reload("document.querySelectorAll('[data-product-id]').length === 8");
  await assert("!document.body.innerText.includes('₱') && !document.body.innerText.includes('Red Rose Romance')", 'Legacy catalog/currency is visible');
  await assert("!document.querySelector('a[href=\"/login\"]') && !document.querySelector('a[href=\"/profile\"]') && !document.querySelector('a[href=\"/request\"]')", 'Unavailable feature remains in navigation');
  const prices = await evaluate("fetch('/api/products',{cache:'no-store'}).then(r=>r.json()).then(b=>b.data.items.map(p=>({id:p.id,price:p.variants.find(v=>v.size_code==='M').price,variant:p.variants.find(v=>v.size_code==='M').id})))");
  const peony = prices.find(item => item.id === 1);
  await evaluate(`(() => { const select=document.querySelector('[data-product-id="1"] select');select.value='${peony.variant}';select.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await waitFor("document.querySelector('[data-product-id=\"1\"] [data-product-price]').innerText.includes('650')");
  await evaluate("document.querySelector('[data-product-id=\"1\"] button').click()");
  await waitFor("JSON.parse(localStorage.getItem('lunara.cart.v1')).lines.length === 1");
  await assert(`JSON.parse(localStorage.getItem('lunara.cart.v1')).lines[0].variantId === ${peony.variant}`, 'Selected size was not stored by variant ID');
  await assert("!localStorage.getItem('lunara.cart.v1').includes('price')", 'Storage contains client prices');
  await evaluate("document.querySelector('a[href=\"/cart\"]').click()");
  await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('670')");
  await assert("!document.querySelector('input[aria-label=\"Coupon code\"]') && !document.body.innerText.includes('Place Order')", 'Unsupported checkout controls visible');
  await reload("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('670') && document.querySelector('input[list=\"delivery-wards\"]')");
  await input('input[list="delivery-wards"]', 'Phường thử chưa có dòng riêng');
  await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('685')");
  await evaluate("document.querySelector('input[value=EXPRESS]').click()");
  await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('715')");
  await evaluate("document.querySelector('[data-language-switcher] button[lang=vi]').click()");
  await waitFor("document.documentElement.lang === 'vi' && document.querySelector('[data-quote-amount=Total]').innerText.includes('715.000')");
  await assert("!document.body.innerText.includes('₱') && document.body.innerText.includes('Bó mẫu đơn')", 'Locale changes currency or loses DB product name');
  await screenshot('d1-cart-vi');
  await evaluate("localStorage.setItem('lunara.cart.v1','broken')");
  await reload("Boolean(document.querySelector('[data-empty-cart]'))");
  await navigate('/shop');
  await waitFor("document.querySelectorAll('[data-product-id]').length === 8");
  await screenshot('d1-shop-desktop');
  for (const width of [320, 390, 768, 1024]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await assert(`document.documentElement.scrollWidth <= ${width} + 1`, 'Shop overflow at width ' + width);
  }
  await screenshot('d1-shop-responsive');
  for (const route of ['/request','/orders','/profile','/login','/signup','/admin','/admin/stock','/admin/orders']) {
    await navigate(route); await assert("Boolean(document.querySelector('[data-feature-unavailable]'))", 'Fixture route still active: ' + route);
  }
  // A failed API must show retry/error UI rather than falling back to fixtures.
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/products', requestStage: 'Request' }] });
  // The runner forwards paused requests to its failure hook (see check-ui.mjs).
  await navigate('/shop');
  await waitFor("document.querySelector('[role=alert]') && !document.querySelector('[data-product-id]')");
  await send('Fetch.disable');
  await evaluate("document.querySelector('[role=alert] button').click()");
  await waitFor("document.querySelectorAll('[data-product-id]').length === 8");
  await assert("!document.body.innerText.includes('Red Rose Romance')", 'Retry falls back to old demo');
  await evaluate("document.querySelector('[data-language-switcher] button[lang=en]').click()");
  await evaluate("localStorage.removeItem('lunara.cart.v1')");
  return { mode: 'D1 catalog/quote', products: 8, variants: 24, cartPersistence: true, wardFallback: true, surcharge: true, locales: ['en','vi'], widths: [320,390,768,1024], hiddenRoutes: 8, apiFailureRetry: true };
}
