import { ACCOUNTS } from '../src/features/auth/data/demo-accounts.ts';

export async function verify({ navigate, click, input, assert, evaluate, waitFor, send, screenshot, delay, seedScriptIdentifier }) {
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedScriptIdentifier });
  const control = async selector => {
    await assert(`Boolean(document.querySelector(${JSON.stringify(selector)}))`, `Missing control: ${selector}`);
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    await delay(100);
  };

  await navigate('/shop');
  await input('[aria-label="Search flowers"]', 'sunshine');
  await assert('document.querySelectorAll("article").length === 1', 'Product search failed');
  await control('[aria-label="Add Sunshine Daisy Mix to cart"]');
  await assert('document.querySelector("a[aria-label^=Cart]").getAttribute("aria-label").endsWith("5")', 'Navbar count is not shared with Shop');
  await click('View Cart (5 items)');
  await assert('document.body.innerText.includes("Sunshine Daisy Mix") && document.body.innerText.includes("₱5,200")', 'Shop item or cart total was lost during navigation');
  await control('[aria-label="Increase quantity"]');
  await assert('document.body.innerText.includes("₱6,400")', 'Quantity change did not update total');
  await control('[aria-label="Remove Sunshine Daisy Mix"]');
  await input('input[placeholder="Coupon code"]', 'lunara10');
  await click('Apply');
  await assert('document.body.innerText.includes("₱5,010")', 'Coupon total is wrong');
  await control('input[value="express"]');
  await assert('document.body.innerText.includes("₱5,160")', 'Delivery change is wrong');
  await evaluate('[...document.querySelectorAll("button[aria-label^=Remove]")].forEach(button => button.click())');
  await delay(100);
  await assert('document.body.innerText.includes("Your cart is empty.") && [...document.querySelectorAll("button")].find(button => button.textContent.includes("Proceed to Checkout")).disabled', 'Empty cart checkout should be disabled');
  await click('Browse flowers →');
  await control('[aria-label="Add Red Rose Romance to cart"]');
  await click('View Cart (1 item)');
  await click('Proceed to Checkout');
  await click('Place Order');
  await assert('document.querySelector("[role=alert]")?.textContent.includes("complete")', 'Missing delivery data was accepted');
  for (const [key, value] of Object.entries({ firstName: 'Demo', lastName: 'User', email: 'demo@example.test', phone: '+63 900 000 0000', address: 'Sample address', city: 'Manila' })) await input(`input[id*="${key}"]`, value);
  await click('Place Order');
  await assert('document.body.innerText.includes("Demo Checkout Complete") && document.body.innerText.includes("No order was placed")', 'Demo confirmation is incorrect');

  await navigate('/request');
  await click('Birthday');
  await click('Continue');
  await click('Blush & Ivory');
  await click('Peonies');
  await click('Continue');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Classic")).click()');
  await click('Continue');
  await click('Submit Request');
  await assert('document.body.innerText.includes("Demo Request Ready")', 'Custom order steps did not reach demo preview');
  await click('Submit Another Request');
  await assert('document.body.innerText.includes("What\u0027s the occasion?")', 'Custom order reset failed');

  await navigate('/orders');
  await input('input[placeholder="Search orders..."]', '1198');
  await assert('document.body.innerText.includes("LN-2026-1198") && !document.body.innerText.includes("LN-2026-1042")', 'Order search failed');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("LN-2026-1198")).click()');
  await delay(100);
  await assert('document.body.innerText.includes("123 Orchid Avenue")', 'Order expansion failed');

  await navigate('/profile');
  await click('Edit');
  const profileNameId = await evaluate('[...document.querySelectorAll("label")].find(label => label.textContent.trim() === "First Name").htmlFor');
  await input(`#${profileNameId}`, 'Preview');
  await click('Save');
  await assert('document.querySelector("h1").textContent.includes("Preview")', 'Profile edit/save failed');
  await click('Wishlist');
  await assert('document.body.innerText.includes("₱1,200")', 'Wishlist numeric prices were not formatted');

  await navigate('/admin/stock');
  await click('Add Product');
  await waitFor('Boolean(document.querySelector("[role=dialog]"))');
  await assert('document.querySelector("[role=dialog]").contains(document.activeElement)', 'Inventory dialog did not trap initial focus');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor('!document.querySelector("[role=dialog]")');
  await click('Add Product');
  await input('input[id*="-name"]', 'Demo Bouquet');
  await input('input[id*="-supplier"]', 'Demo Supplier');
  await input('input[id*="-price"]', '1250');
  await input('input[id*="-stock"]', '20');
  await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(button => button.textContent.includes("Add Product")).click()');
  await delay(100);
  await assert('document.body.innerText.includes("Demo Bouquet")', 'Inventory add failed');
  await evaluate('[...document.querySelectorAll("tr")].find(row => row.textContent.includes("Demo Bouquet")).querySelector("button").click()');
  await input('input[id*="-name"]', 'Edited Demo Bouquet');
  await click('Save Changes');
  await assert('document.body.innerText.includes("Edited Demo Bouquet")', 'Inventory edit failed');

  await navigate('/admin/orders');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.trim().startsWith("Pending")).click()');
  await delay(100);
  await control('button[title="Approve"]');
  await assert('!document.body.innerText.includes("Camille Tan")', 'Admin order status update did not affect filtering');
  await navigate('/admin/customers');
  const customerSearch = await evaluate('[...document.querySelectorAll("input")].find(input => input.placeholder.includes("Search"))?.getAttribute("aria-label")');
  await input(`input[aria-label="${customerSearch}"]`, 'Sofia');
  await assert('document.body.innerText.includes("Sofia Lim") && !document.body.innerText.includes("Maria Santos")', 'Customer search failed');
  await navigate('/admin/requests');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Maria Santos")).click()');
  await click('Start Review');
  await click('Approve');
  await click('Mark Completed');
  await assert('!document.body.innerText.includes("Mark Completed")', 'Approved request cannot be completed');

  await navigate('/admin/settings');
  const before = await evaluate('document.querySelector("[role=switch]").getAttribute("aria-checked")');
  await control('[role=switch]');
  await assert(`document.querySelector("[role=switch]").getAttribute("aria-checked") !== ${JSON.stringify(before)}`, 'Notification switch did not update');
  await click('Save All Settings');
  await assert('document.body.innerText.includes("Demo settings updated")', 'Settings save feedback failed');

  // Fixture credentials are read locally and never written to logs or screenshots.
  await navigate('/login');
  await input('input[type=email]', 'missing@example.test');
  await input('input[type=password]', 'invalid');
  await click('Sign In');
  await assert('document.body.innerText.includes("Invalid email or password.")', 'Invalid login did not show an error');
  for (const account of [ACCOUNTS.find(account => account.role === 'user'), ACCOUNTS.find(account => account.role === 'admin')]) {
    await navigate('/login');
    await input('input[type=email]', account.email);
    await input('input[type=password]', account.password);
    await click('Sign In');
    await waitFor(`location.pathname === ${JSON.stringify(account.role === 'admin' ? '/admin/dashboard' : '/')}`);
    await assert(`JSON.parse(sessionStorage.getItem('lunara_user')).role === ${JSON.stringify(account.role)}`, 'Login role is incorrect');
    if (account.role === 'user') { await navigate('/admin/orders'); await waitFor('location.pathname === "/"'); }
  }
  await evaluate('sessionStorage.removeItem("lunara_user")');
  await navigate('/profile');
  await waitFor('location.pathname === "/login"');
  await navigate('/admin');
  await waitFor('location.pathname === "/login"');
  await navigate('/signup');
  await control('input[type=checkbox]');
  await click('Create Account');
  await assert('document.body.innerText.includes("Account Preview Ready") && document.body.innerText.includes("No account was created")', 'Signup should describe a demo preview');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const route of ['/', '/shop', '/cart', '/request', '/orders', '/login', '/signup']) {
    await navigate(route);
    await assert('document.documentElement.scrollWidth <= innerWidth + 1', `Mobile page overflow: ${route}`);
  }
  await navigate('/shop');
  await evaluate('[...document.querySelectorAll("nav button")].find(button => button.getBoundingClientRect().width > 0).click()');
  await delay(100);
  await assert('[...document.querySelectorAll("a")].filter(a => a.textContent.trim() === "Custom Orders" && a.getBoundingClientRect().width > 0).length > 0', 'Mobile navigation failed');
  await screenshot('mobile-shop');
  await evaluate(`sessionStorage.setItem('lunara_user', JSON.stringify({ name: 'Demo Administrator', email: 'demo@example.test', role: 'admin' }))`);
  for (const route of ['/admin/dashboard', '/admin/stock', '/admin/orders', '/admin/customers', '/admin/requests', '/admin/settings']) {
    await navigate(route);
    await assert('document.documentElement.scrollWidth <= innerWidth + 1', `Mobile admin page overflow: ${route}`);
  }
  await navigate('/admin/stock');
  await control('button[aria-label="Open menu"]');
  await assert('[...document.querySelectorAll("a")].some(a => a.textContent.trim() === "Dashboard" && a.getBoundingClientRect().width > 0)', 'Mobile admin sidebar did not open');
  await screenshot('mobile-admin-stock');
  console.log('Verified Shop/Cart/Checkout, request wizard, profile/orders, admin actions, auth guards, and mobile navigation.');
}
