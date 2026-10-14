export async function verifyI18n({ navigate, click, input, assert, evaluate, waitFor, send, delay, screenshot }) {
  const switchTo = async language => {
    await evaluate(`document.querySelector('[data-language-switcher] button[lang="${language}"]').click()`);
    await delay(120);
    await assert(`document.documentElement.lang === '${language}'`, 'HTML language was not updated');
  };
  await navigate('/shop');
  await evaluate("sessionStorage.setItem('lunara_user', JSON.stringify({name:'Demo Administrator',email:'demo@example.test',role:'admin'}))");
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate('/shop');
  await switchTo('vi');
  await assert('document.body.innerText.includes("Cửa hàng Lunara") && document.body.innerText.includes("Bó mẫu đơn hồng phấn")', 'Vietnamese catalog missing');
  await assert(`(() => { const footer = document.querySelector('[data-storefront-footer]'); return footer.innerText.includes('CHĂM SÓC KHÁCH HÀNG') && footer.innerText.includes('THEO DÕI') && footer.innerText.includes('SHOP HOA FLOWERCORNER') && footer.innerText.includes('0319117387') && footer.querySelectorAll('a').length === 18 && [...footer.querySelectorAll('a')].every(link => link.href.startsWith('https://') && link.target === '_blank' && link.rel.includes('noopener')); })()`, 'Footer content or external destinations missing');
  await evaluate("document.querySelector('[data-zalo-contact] summary').click()");
  await assert(`document.querySelector('[data-zalo-contact]').open && document.querySelector('[data-zalo-contact]').innerText.includes('Thông tin liên hệ Zalo sẽ được cập nhật sớm.') && !document.querySelector('[data-zalo-contact] a')`, 'Unconfigured Zalo must show the pending message without a fake contact');
  await evaluate("document.querySelector('[data-zalo-contact] summary').click()");
  await evaluate("window.scrollTo(0, document.querySelector('[data-storefront-footer]').offsetTop - 90)");
  await screenshot('footer-desktop-vi');
  await evaluate('window.scrollTo(0, 0)');
  await input('[aria-label="Tìm hoa"]', 'mau don');
  await assert('document.querySelectorAll("article").length === 1', 'Unaccented Vietnamese search failed');
  await evaluate('document.querySelector("article button[aria-label^=Thêm]").click()');
  await delay(100);
  await evaluate(`document.querySelector('a[href="/cart"][aria-label]').click()`);
  await delay(150);
  await assert('document.body.innerText.includes("Bó mẫu đơn hồng phấn")', 'Vietnamese cart names missing');
  const count = await evaluate(`document.querySelector('a[href="/cart"][aria-label]').getAttribute('aria-label').split(' ').at(-1)`);
  await switchTo('en');
  await assert(`document.body.innerText.includes('Blush Peony Bouquet') && document.querySelector('a[href="/cart"][aria-label]').getAttribute('aria-label').endsWith('${count}')`, 'Language switching reset cart');
  await switchTo('vi');
  await send('Page.reload');
  await waitFor('document.readyState === "complete" && document.body.innerText.includes("Giỏ hàng của bạn")');
  await assert('document.documentElement.lang === "vi" && document.body.innerText.includes("Giỏ hàng của bạn")', 'Language preference did not survive reload');

  const routes = [
    ['/', 'Kể câu chuyện của bạn'], ['/shop', 'Cửa hàng Lunara'], ['/cart', 'Giỏ hàng của bạn'],
    ['/request', 'Yêu cầu hoa đặt riêng'], ['/orders', 'Lịch sử đơn hàng'], ['/profile', 'Thông tin cá nhân'],
    ['/login', 'Chào mừng bạn trở lại'], ['/signup', 'Tạo tài khoản'],
    ['/admin/dashboard', 'Tổng quan doanh thu'], ['/admin/stock', 'Quản lý tồn kho sản phẩm'],
    ['/admin/orders', 'Tìm thấy'], ['/admin/customers', 'Khách đang hoạt động'],
    ['/admin/requests', 'Tổng yêu cầu'], ['/admin/settings', 'Thông tin cửa hàng'],
  ];
  for (const [route, text] of routes) {
    await navigate(route);
    await waitFor(`document.body.innerText.includes(${JSON.stringify(text)})`);
    await assert(`document.body.innerText.includes(${JSON.stringify(text)})`, `Missing Vietnamese copy on ${route}`);
    await assert('document.querySelector("[data-language-switcher] button[lang=vi]").getAttribute("aria-pressed") === "true"', `Language button unavailable on ${route}`);
  }
  await navigate('/request');
  await click('Sinh nhật'); await click('Tiếp tục');
  await click('Hồng phấn và trắng ngà'); await click('Mẫu đơn'); await click('Tiếp tục');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Cổ điển")).click()');
  await click('Tiếp tục');
  await input('input[id$="name"]', 'Lan Nguyễn');
  await switchTo('en');
  await assert('document.querySelector("input[id$=name]").value === "Lan Nguyễn"', 'Language change altered typed customer text');
  await switchTo('vi');
  await assert('document.body.innerText.includes("Sinh nhật") && document.body.innerText.includes("Hồng phấn và trắng ngà") && document.body.innerText.includes("Mẫu đơn")', 'Request option codes were not rendered in Vietnamese');

  await navigate('/admin/stock');
  await click('Thêm sản phẩm');
  await input('input[id$="-name"]', 'Bilingual Demo Bouquet');
  await input('input[id$="-name_vi"]', 'Bó hoa demo song ngữ');
  await evaluate(`(() => { const select = document.querySelector('[role=dialog] select'); select.value = 'Gift Sets'; select.dispatchEvent(new Event('change', {bubbles:true})); })()`);
  await input('input[id$="-price"]', '750');
  await input('input[id$="-stock"]', '12');
  await click('Thêm sản phẩm');
  await click('Bộ quà tặng');
  await assert('document.body.innerText.includes("Bó hoa demo song ngữ")', 'Translated category changed the saved category code');
  await switchTo('en');
  await assert('document.body.innerText.includes("Bilingual Demo Bouquet")', 'English inventory name was lost');
  await switchTo('vi');

  const widths = [320, 390, 640, 768, 1024, 1280, 1440];
  for (const width of widths) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 768 });
    for (const [route, text] of routes) {
      await navigate(route);
      await waitFor(`document.body.innerText.includes(${JSON.stringify(text)})`);
      const overflow = await evaluate(`(() => [...document.querySelectorAll('body *')].filter(element => { const rect = element.getBoundingClientRect(); return rect.width && rect.right > ${width} + 1 && getComputedStyle(element).position !== 'absolute'; }).slice(-5).map(element => ({tag:element.tagName, class:element.className, text:element.textContent.slice(0,80)})))()`);
      await assert(`document.querySelector('#root').scrollWidth <= ${width}`, `Vietnamese overflow on ${route} at ${width}: ${JSON.stringify(overflow)}`);
      await assert(`(() => { const r = document.querySelector('[data-language-switcher]').getBoundingClientRect(); return r.right <= ${width} && r.left >= 0 && r.top < 100; })()`, `Language switch outside viewport on ${route}`);
      if (documentRoutesWithFooter(route)) {
        await assert(`(() => { const widget = document.querySelector('[data-zalo-contact]'); const r = widget.querySelector('summary').getBoundingClientRect(); return getComputedStyle(widget).position === 'fixed' && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[data-zalo-contact]') === widget; })()`, `Zalo is hidden or covered on ${route} at ${width}`);
        await assert(`getComputedStyle(document.querySelector('[data-footer-grid]')).gridTemplateColumns.split(' ').length === ${width >= 1024 ? 4 : 2}`, `Footer columns incorrect on ${route} at ${width}`);
        await assert(`(() => { const r = document.querySelector('[data-zalo-contact] summary').getBoundingClientRect(); const cart = document.querySelector('[class*="fixed bottom-8"]')?.getBoundingClientRect(); return r.left >= 0 && r.right <= ${width} && r.top >= 0 && r.bottom <= 844 && (!cart || r.right <= cart.left || r.bottom <= cart.top); })()`, `Zalo overlaps the cart or viewport on ${route}`);
      }
    }
    if (width === 390) {
      await navigate('/shop'); await screenshot('i18n-mobile-shop');
      await evaluate("window.scrollTo(0, document.querySelector('[data-storefront-footer]').offsetTop - 90)");
      await screenshot('footer-mobile-vi');
      await evaluate("document.querySelector('[data-zalo-contact] summary').click()");
      await screenshot('zalo-mobile-pending');
      await navigate('/admin/stock'); await screenshot('i18n-mobile-admin-stock');
    }
  }
  await navigate('/shop');
  await evaluate("window.scrollTo(0, document.querySelector('[data-storefront-footer]').offsetTop - 90)");
  await screenshot('footer-desktop-vi');
  await switchTo('en');
  await navigate('/shop');
  await assert(`document.querySelector('[data-storefront-footer]').textContent.includes('Customer Care') && document.querySelector('[data-zalo-contact] summary').getAttribute('aria-label') === 'Chat with Lunara on Zalo'`, 'Footer/Zalo English labels missing');
  console.log('Verified English/Vietnamese routes, footer columns, visible Zalo, shared cart, request state and responsive controls at 320–1440px.');
  return { routes: routes.length, widths, bilingualInventory: true, preferencePersistence: true, footerColumns: true, zaloVisible: true };
}

function documentRoutesWithFooter(route) {
  return !route.startsWith('/admin') && route !== '/login' && route !== '/signup';
}
