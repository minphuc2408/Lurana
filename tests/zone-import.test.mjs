import test from 'node:test';
import assert from 'node:assert/strict';
import writeXlsxFile from 'write-excel-file/universal';
import { readSheet } from 'read-excel-file/universal';
import { createTestDb } from './helpers/worker.mjs';
import { listAdministrativeAreas } from '../worker/services/administrative-areas.ts';
import { createZoneWorkbook, importZones } from '../worker/services/zone-import.ts';
import { encodeWorkbook } from '../worker/services/product-workbook.ts';
import { ZONE_IMPORT_COLUMNS } from '../shared/zone-import.ts';
function fixture(t) { const value = createTestDb(); t.after(() => value.close()); return value; }
async function workbook(zones, columns = ZONE_IMPORT_COLUMNS) {
  const cell = value => value == null ? null : { value, type: typeof value === 'number' ? Number : typeof value === 'boolean' ? Boolean : String };
  const blob = await writeXlsxFile([columns.map(cell), ...zones.map(zone => columns.map(key => cell(zone[key])))], { sheet: 'DeliveryZones' }).toBlob();
  return encodeWorkbook(new Uint8Array(await blob.arrayBuffer()));
}
async function newZones(db, count) {
  const areas = await listAdministrativeAreas(db);
  const { results } = await db.prepare('SELECT ward_name FROM delivery_zones').all();
  return areas.flatMap(province => province.wards.filter(ward => !results.some(row => row.ward_name.endsWith(ward.ward_name))).map(ward => ({ province_name: province.province_name, ward_name: ward.ward_name, fee: 22000, free_from_amount: null, eta_minutes: 120, is_active: true }))).slice(0, count);
}
test('delivery Excel template has empty input, six form columns, bilingual guidance and legal areas', async t => {
  const { db } = fixture(t); const bytes = await createZoneWorkbook(db);
  assert.deepEqual((await readSheet(bytes.buffer, 'DeliveryZones'))[0], [...ZONE_IMPORT_COLUMNS]);
  assert.equal((await readSheet(bytes.buffer, 'Areas')).length, 127);
  assert.equal((await readSheet(bytes.buffer, 'Examples')).length, 2);
  await assert.rejects(() => importZones(db, encodeWorkbook(bytes), false), error => error.code === 'VALIDATION_ERROR');
});
test('delivery Excel validates read-only, then atomically creates 50 rows in seven statements without changing existing zones', async t => {
  const { db, sqlite, queries } = fixture(t);
  const zones = await newZones(db, 50), input = await workbook(zones);
  const before = sqlite.prepare('SELECT * FROM delivery_zones ORDER BY id').all();
  assert.equal((await importZones(db, input, true)).zone_count, 50);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n, before.length);
  queries.length = 0;
  assert.equal((await importZones(db, input, false)).validated, false);
  assert.equal(queries.length, 7); assert.ok(queries.every(query => query.values.length <= 100));
  assert.deepEqual(sqlite.prepare('SELECT * FROM delivery_zones WHERE id<=? ORDER BY id').all(before.at(-1).id), before);
  await assert.rejects(() => importZones(db, input, false), error => error.code === 'CONFLICT' && error.details[0].row === 2);
});
test('delivery Excel rejects missing fields/headers, negative/fractional amounts, boolean typos, illegal and duplicate aliases before writing', async t => {
  const { db, sqlite } = fixture(t); const [zone] = await newZones(db, 1);
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n;
  for (const rows of [[{ ...zone, fee: '' }], [{ ...zone, fee: -1 }], [{ ...zone, fee: 1.5 }], [{ ...zone, fee: '22,000' }], [{ ...zone, is_active: 'yes' }], [{ ...zone, eta_minutes: 0 }], [{ ...zone, ward_name: 'Imaginary ward' }], [zone, { ...zone, ward_name: 'Phường ' + zone.ward_name }]]) {
    await assert.rejects(async () => importZones(db, await workbook(rows), false), error => error.code === 'VALIDATION_ERROR' && error.details.some(issue => issue.row >= 2));
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n, count);
  }
  await assert.rejects(async () => importZones(db, await workbook([zone], ZONE_IMPORT_COLUMNS.slice(1)), false), error => error.code === 'VALIDATION_ERROR');
  await assert.rejects(async () => importZones(db, await workbook(await newZones(db, 51)), false), error => error.code === 'VALIDATION_ERROR');
});
test('delivery Excel late failure rolls back earlier statement chunks with no retry', async t => {
  const { db, sqlite } = fixture(t); const zones = await newZones(db, 14);
  const before = sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n;
  sqlite.exec("CREATE TRIGGER fail_zone_import BEFORE INSERT ON delivery_zones WHEN NEW.fee=99999 BEGIN SELECT RAISE(ABORT,'synthetic late failure'); END");
  zones[13].fee = 99999; let batches = 0;
  const counted = { ...db, async batch(statements) { batches++; return db.batch(statements); } };
  await assert.rejects(async () => importZones(counted, await workbook(zones), false));
  assert.equal(batches, 1); assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_zones').get().n, before);
});
