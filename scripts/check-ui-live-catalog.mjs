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
  await assert("!document.querySelector('a[href=\"/signup\"]') && !document.querySelector('a[href=\"/profile\"]') && !document.querySelector('a[href=\"/request\"]')", 'Unavailable feature remains in navigation');
  const prices = await evaluate("fetch('/api/products',{cache:'no-store'}).then(r=>r.json()).then(b=>b.data.items.map(p=>({id:p.id,slug:p.slug,price:p.variants.find(v=>v.size_code==='M').price,variant:p.variants.find(v=>v.size_code==='M').id})))");
  const peony = prices.find(item => item.id === 1);
  await navigate('/shop/' + peony.slug);
  await waitFor(`Boolean(document.querySelector('input[name=product-size][value="${peony.variant}"]'))`);
  await evaluate(`document.querySelector('input[name=product-size][value="${peony.variant}"]').click()`);
  await waitFor(`document.querySelector('[data-detail-price]')?.innerText.replace(/[^0-9]/g,'') === '${peony.price}'`);
  await evaluate("document.querySelector('[data-detail-add]').click()");
  await waitFor("JSON.parse(localStorage.getItem('lunara.cart.v1')).lines.length === 1");
  await assert(`JSON.parse(localStorage.getItem('lunara.cart.v1')).lines[0].variantId === ${peony.variant}`, 'Selected size was not stored by variant ID');
  await assert("!localStorage.getItem('lunara.cart.v1').includes('price')", 'Storage contains client prices');
  await evaluate("document.querySelector('a[href=\"/cart\"]').click()");
  await waitFor(`document.querySelector('[data-cart-total]')?.innerText.replace(/[^0-9]/g,'') === '${peony.price}'`);
  await assert("!document.querySelector('[data-cart-delivery-fee]') && !document.querySelector('[data-checkout-form]')", 'Cart must show a provisional subtotal before choosing delivery');
  await assert("!document.querySelector('input[aria-label=\"Coupon code\"]')", 'Unsupported coupon control visible');
  await reload(`document.querySelector('[data-cart-total]')?.innerText.replace(/[^0-9]/g,'') === '${peony.price}'`);
  await evaluate("document.querySelector('[data-proceed-checkout]').click()");
  await waitFor("Boolean(document.querySelector('[data-checkout-form] input[name=province_name]'))");
  await assert("!document.querySelector('[data-checkout-delivery-fee]')", 'Checkout must not invent a fee before an explicit ward selection');
  const options = await evaluate("fetch('/api/delivery/options').then(r=>r.json()).then(b=>b.data)");
  const province = options.provinces.find(item => item.wards.length > 0);
  if (!province) throw new Error('Local UI checks require one explicitly configured delivery ward');
  const ward = province.wards[0];
  const baseFee = province.free_from_amount != null && peony.price >= province.free_from_amount ? 0 : ward.fee;
  await input('input[name=province_name]', province.province_name);
  await waitFor("Boolean(document.querySelector('[role=listbox] [role=option]'))");
  await evaluate("document.querySelector('[role=listbox] [role=option]').click()");
  await input('input[name=ward_name]', ward.ward_name);
  await waitFor("Boolean(document.querySelector('[role=listbox] [role=option]'))");
  await evaluate("document.querySelector('[role=listbox] [role=option]').click()");
  await waitFor(`document.querySelector('[data-quote-amount=Total]')?.innerText.replace(/[^0-9]/g,'') === '${peony.price + baseFee}'`);
  await evaluate("document.querySelector('input[value=EXPRESS]').click()");
  const expressTotal = peony.price + baseFee + options.methods.find(item => item.code === 'EXPRESS').surcharge;
  await waitFor(`document.querySelector('[data-quote-amount=Total]')?.innerText.replace(/[^0-9]/g,'') === '${expressTotal}'`);
  await evaluate("document.querySelector('[data-language-switcher] button[lang=vi]').click()");
  await waitFor(`document.documentElement.lang === 'vi' && document.querySelector('[data-quote-amount=Total]')?.innerText.replace(/[^0-9]/g,'') === '${expressTotal}'`);
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
  for (const route of ['/request','/orders','/profile','/signup']) {
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
  return { mode: 'D1 catalog/quote', products: 8, variants: 24, cartPersistence: true, splitCheckout: true, explicitWardZone: true, wardFallback: false, surcharge: true, locales: ['en','vi'], widths: [320,390,768,1024], hiddenRoutes: 4, apiFailureRetry: true };
}
