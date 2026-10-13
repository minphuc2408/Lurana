import test from 'node:test';
import assert from 'node:assert/strict';
import { getProduct, getProducts, selectProducts } from '../src/features/shop/shop.service.ts';
import { cartReducer, calculateCart, validateCheckout } from '../src/features/cart/cart.service.ts';
import { formatMoney } from '../src/shared/lib/format.ts';

const deliveries = [{ id: 'standard', price: 150 }, { id: 'express', price: 300 }, { id: 'sameday', price: 500 }];
const item = (id, size = 'Medium', qty = 1) => ({ ...getProduct(id), id: `${id}:${size}`, productId: id, size, qty });

test('catalog identities are unique and reads do not expose mutable fixtures', () => {
  const products = getProducts();
  assert.equal(new Set(products.map(product => product.id)).size, products.length);
  products[0].price = 0;
  assert.equal(getProduct(1).price, 1200);
  assert.equal(getProduct(999), undefined);
});
test('search, category and price sorting compose without changing the catalog', () => {
  const products = getProducts();
  assert.deepEqual(selectProducts(products, { category: 'Bouquets', search: 'LILY', sort: 'low' }).map(product => product.id), [5]);
  const selected = selectProducts(products, { category: 'All', search: '', sort: 'low' });
  assert.equal(selected[0].price, 750);
  assert.equal(products[0].id, 1);
  assert.deepEqual(selectProducts(products, { category: 'All', search: 'missing flower', sort: 'featured' }), []);
});
test('adding the same variant increments quantity while different sizes stay separate', () => {
  let cart = cartReducer([], { type: 'add', item: item(1) });
  cart = cartReducer(cart, { type: 'add', item: item(1) });
  cart = cartReducer(cart, { type: 'add', item: item(1, 'Large') });
  assert.deepEqual(cart.map(line => [line.id, line.qty]), [['1:Medium', 2], ['1:Large', 1]]);
});
test('quantity bounds, removal and clear preserve other variants', () => {
  const initial = [item(1), item(1, 'Large')];
  assert.equal(cartReducer(initial, { type: 'quantity', id: '1:Medium', delta: -3 })[0].qty, 1);
  assert.equal(cartReducer(initial, { type: 'quantity', id: '1:Medium', delta: 200 })[0].qty, 99);
  assert.equal(cartReducer(initial, { type: 'quantity', id: '1:Medium', delta: Number.NaN }), initial);
  assert.deepEqual(cartReducer(initial, { type: 'remove', id: '1:Medium' }).map(line => line.id), ['1:Large']);
  assert.deepEqual(cartReducer(initial, { type: 'clear' }), []);
});
test('invalid additions do not corrupt totals', () => {
  const initial = [item(1)];
  assert.equal(cartReducer(initial, { type: 'add', item: { ...item(4), qty: -1 } }), initial);
  assert.equal(cartReducer(initial, { type: 'add', item: { ...item(4), price: Number.NaN } }), initial);
});
test('demo cart totals retain PHP pricing, delivery fees and floored ten percent discount', () => {
  const cart = [item(1), item(4, 'Large', 2), item(5, 'Small')];
  assert.deepEqual(calculateCart(cart, 'standard', false, deliveries), { subtotal: 4200, deliveryFee: 150, discount: 0, total: 4350 });
  assert.equal(calculateCart(cart, 'express', true, deliveries).total, 4080);
  assert.equal(calculateCart(cart, 'sameday', true, deliveries).total, 4280);
  assert.equal(calculateCart([{ ...item(1), price: 1001 }], 'standard', true, deliveries).discount, 100);
  assert.deepEqual(calculateCart([], 'sameday', true, deliveries), { subtotal: 0, deliveryFee: 0, discount: 0, total: 0 });
});
test('checkout cannot complete with missing fields or malformed email', () => {
  const form = { firstName: 'Demo', lastName: 'User', email: 'demo@example.test', phone: '+63 900 000 0000', address: 'Sample address', city: 'Manila' };
  assert.equal(validateCheckout(form), '');
  assert.match(validateCheckout({ ...form, address: ' ' }), /complete/);
  assert.match(validateCheckout({ ...form, email: 'invalid' }), /email/);
});
test('money remains PHP with numeric amounts at the display boundary', () => {
  assert.equal(formatMoney(1200), '₱1,200');
  assert.equal(formatMoney(1001.5), '₱1,001.5');
});
