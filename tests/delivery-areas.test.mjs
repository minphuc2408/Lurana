import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/worker.mjs';
import { listAdministrativeAreas } from '../worker/services/administrative-areas.ts';
import { getDeliveryOptions, resolveFee } from '../worker/services/delivery.ts';
import { createAdminDeliveryZone, putAdminDeliveryZone } from '../worker/services/admin-catalog.ts';

const city = 'Thành phố Hà Nội';
const zone = ward => ({ province_name: city, ward_name: ward, fee: 21000, free_from_amount: null, eta_minutes: null, is_active: true });
function fixture(t) { const h = createTestDb(); t.after(() => h.close()); return h; }

test('administrative migration imports exactly Hanoi and126unique wards with a province foreign key', async t => {
  const h = fixture(t); const areas = await listAdministrativeAreas(h.db);
  assert.equal(areas.length, 1); assert.equal(areas[0].code, '01'); assert.equal(areas[0].wards.length, 126);
  assert.equal(new Set(areas[0].wards.map(w => w.code)).size, 126);
  assert.ok(areas[0].wards.some(w => w.ward_name === 'Hoàn Kiếm'));
  assert.ok(areas[0].wards.some(w => w.ward_name === 'Cửa Nam'));
  assert.throws(() => h.exec("INSERT INTO administrative_wards VALUES ('99999','79','Demo')"), /FOREIGN KEY/);
  assert.deepEqual(h.sqlite.prepare('PRAGMA foreign_key_check').all(), []);
});

test('only configured imported wards appear; province defaults and legacy HCMC never widen coverage', async t => {
  const h = fixture(t); const options = await getDeliveryOptions(h.db);
  assert.deepEqual(options.provinces.map(p => [p.province_name, p.wards.map(w => w.ward_name)]), [[city, ['Hoàn Kiếm']]]);
  await assert.rejects(() => resolveFee(h.db, city, 'Cửa Nam', 500000, 'STANDARD'), e => e.code === 'NO_DELIVERY_ZONE');
  await assert.rejects(() => resolveFee(h.db, 'Thành phố Hồ Chí Minh', 'Bến Nghé', 500000, 'STANDARD'), e => e.code === 'NO_DELIVERY_ZONE');
});

test('creating/enabling/disabling a catalog ward changes public options and pricing together', async t => {
  const h = fixture(t); const saved = await createAdminDeliveryZone(h.db, zone('Cửa Nam'));
  assert.equal(await resolveFee(h.db, city, 'Cửa Nam', 500000, 'STANDARD'), 21000);
  assert.ok((await getDeliveryOptions(h.db)).provinces[0].wards.some(w => w.ward_name === 'Cửa Nam'));
  await putAdminDeliveryZone(h.db, saved.id, { ...zone('Cửa Nam'), is_active: false });
  assert.ok(!(await getDeliveryOptions(h.db)).provinces[0].wards.some(w => w.ward_name === 'Cửa Nam'));
  await assert.rejects(() => resolveFee(h.db, city, 'Cửa Nam', 500000, 'STANDARD'), e => e.code === 'NO_DELIVERY_ZONE');
  await putAdminDeliveryZone(h.db, saved.id, zone('Cửa Nam'));
  assert.equal(await resolveFee(h.db, city, 'Cửa Nam', 500000, 'STANDARD'), 21000);
});

test('catalog validation rejects undeclared areas and duplicate legacy ward aliases', async t => {
  const h = fixture(t);
  await assert.rejects(() => createAdminDeliveryZone(h.db, zone('Hoàn Kiếm')), e => e.code === 'CONFLICT');
  for (const input of [zone(''), zone("' OR1=1"), { ...zone('Cửa Nam'), province_name: 'Thành phố Hồ Chí Minh' }]) {
    await assert.rejects(() => createAdminDeliveryZone(h.db, input), e => e.code === 'VALIDATION_ERROR');
  }
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n, 4);
});

test('legacy rows can be disabled, while a province default cannot be enabled as blanket coverage', async t => {
  const h = fixture(t);
  const row = h.sqlite.prepare("SELECT * FROM delivery_zones WHERE province_name=? AND ward_name='' ").get(city);
  await putAdminDeliveryZone(h.db, row.id, { ...row, is_active: false });
  await assert.rejects(() => putAdminDeliveryZone(h.db, row.id, { ...row, is_active: true }), e => e.code === 'VALIDATION_ERROR');
  assert.equal(await resolveFee(h.db, city, 'Phường Hoàn Kiếm', 500000, 'STANDARD'), 20000);
});
