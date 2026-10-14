import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import i18next from 'i18next';
import ts from 'typescript';
import { getLocalizedName, normalizeLanguage, normalizeSearch, readLanguage, saveLanguage } from '../src/shared/i18n/language.ts';
import { getProducts, loadCatalog, normalizeProduct, selectProducts } from '../src/features/shop/shop.service.ts';
import app from '../worker/index.ts';
import { createTestDb } from './helpers/worker.mjs';
let fixture;
before(async () => { fixture = createTestDb(); const original = globalThis.fetch; globalThis.fetch = (url, options) => app.request(String(url), options, { DB: fixture.db }); try { await loadCatalog(); } finally { globalThis.fetch = original; } });
after(() => fixture.close());

const root = new URL('../src/shared/i18n/locales/', import.meta.url);
function resources(language) {
  return Object.fromEntries(fs.readdirSync(new URL(`${language}/`, root)).map(file => [file.replace('.json', ''), JSON.parse(fs.readFileSync(new URL(`${language}/${file}`, root), 'utf8'))]));
}

test('locales have matching keys and preserve interpolation variables', () => {
  const en = resources('en'), vi = resources('vi');
  assert.deepEqual(Object.keys(en), Object.keys(vi));
  for (const namespace of Object.keys(en)) {
    assert.deepEqual(Object.keys(en[namespace]).sort(), Object.keys(vi[namespace]).sort(), namespace);
    for (const [key, text] of Object.entries(en[namespace])) {
      assert.ok(vi[namespace][key].trim(), `${namespace}: ${key}`);
      const tokens = value => [...value.matchAll(/\{\{([^}]+)\}\}/g)].map(match => match[1]).sort();
      assert.deepEqual(tokens(text), tokens(vi[namespace][key]), `${namespace}: ${key}`);
    }
  }
});

test('static UI translation keys resolve through their namespace or common fallback', () => {
  const en = resources('en');
  function files(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(new URL(`${entry.name}/`, directory)) : [new URL(entry.name, directory)]); }
  for (const file of files(new URL('../src/', import.meta.url)).filter(file => file.pathname.endsWith('.tsx'))) {
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes('useLocale')) continue;
    const namespace = text.match(/useLocale\("([^"]+)"\)/)?.[1] ?? 'common';
    const source = ts.createSourceFile(file.pathname, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text;
        const found = [key, `${key}_one`, `${key}_other`].some(candidate => Object.hasOwn(en[namespace], candidate) || Object.hasOwn(en.common, candidate));
        assert.ok(found, `${file.pathname}: ${key}`);
      }
      if (ts.isJsxAttribute(node) && ['key', 'value'].includes(node.name.getText(source))) assert.ok(!/\bt\(/.test(node.getText(source)), `Translated canonical ${node.name.getText(source)} in ${file.pathname}`);
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'option' && /\bt\(/.test(node.getText(source))) assert.ok(node.openingElement.attributes.properties.some(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'value'), `Localized option needs an explicit value in ${file.pathname}`);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});

test('language preference defaults to English and tolerates blocked storage', () => {
  assert.equal(readLanguage(), 'en');
  assert.equal(normalizeLanguage('vi-VN'), 'vi');
  assert.equal(normalizeLanguage('fr'), 'en');
  assert.equal(readLanguage({ getItem: () => { throw new Error('blocked'); } }), 'en');
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  saveLanguage('vi', storage);
  assert.equal(readLanguage(storage), 'vi');
  assert.doesNotThrow(() => saveLanguage('vi', { setItem: () => { throw new Error('blocked'); } }));
});

test('product names honor Vietnamese fields, legacy aliases and English fallback', () => {
  const name = { name: 'Legacy', name_en: 'English', name_vi: 'Tiếng Việt', name_vn: 'Alias' };
  assert.equal(getLocalizedName(name, 'vi'), 'Tiếng Việt');
  assert.equal(getLocalizedName(name, 'en'), 'English');
  assert.equal(getLocalizedName({ name_en: 'English', name_vi: ' ', name_vn: 'Tên cũ' }, 'vi'), 'Tên cũ');
  assert.equal(getLocalizedName({ name: 'Legacy' }, 'vi'), 'Legacy');
  assert.equal(getLocalizedName({ name_vi: 'Tên Việt' }, 'en'), 'Tên Việt');
  assert.equal(getLocalizedName({ name_vi: null, name_en: 'English' }, 'vi'), 'English');
  const { name: _name, ...dto } = getProducts()[0];
  assert.equal(normalizeProduct(dto).name, dto.name_en);
});

test('catalog search accepts accented, unaccented and English names without mutating products', () => {
  const products = getProducts();
  const filter = search => selectProducts(products, { category: 'All', sort: 'featured', search }).map(product => product.id);
  assert.deepEqual(filter('mẫu đơn'), [1]);
  assert.deepEqual(filter('mau don'), [1]);
  assert.deepEqual(filter('peony'), [1]);
  assert.deepEqual(filter('OẢI HƯƠNG'), [7]);
  assert.equal(products[0].name, 'Blush Peony Bouquet');
  assert.equal(normalizeSearch('Đồng HOA'), 'dong hoa');
});

test('i18next handles counts, runtime switching and English fallback', async () => {
  const en = resources('en'), vi = resources('vi');
  const instance = i18next.createInstance();
  await instance.init({ resources: { en, vi }, lng: 'en', fallbackLng: 'en', fallbackNS: 'common', defaultNS: 'shop', keySeparator: false, nsSeparator: false });
  assert.equal(instance.t('viewCartCount', { count: 1 }), 'View Cart (1 item)');
  assert.equal(instance.t('viewCartCount', { count: 2 }), 'View Cart (2 items)');
  await instance.changeLanguage('vi');
  assert.equal(instance.t('viewCartCount', { count: 2 }), 'Xem giỏ hàng (2 sản phẩm)');
  assert.equal(instance.t('Search flowers'), 'Tìm hoa');
  instance.addResource('en', 'shop', 'Fallback example', 'English fallback');
  assert.equal(instance.t('Fallback example'), 'English fallback');
});
