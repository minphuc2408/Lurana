import writeXlsxFile from 'write-excel-file/universal';
import { ZONE_IMPORT_COLUMNS, ZONE_IMPORT_MAX_ROWS, type ZoneImportResult } from '../../shared/zone-import.ts';
import { adminDeliveryZoneSchema } from '../../shared/admin-catalog-schemas.ts';
import { canonicalWardName } from '../../shared/delivery-areas.ts';
import type { ProductImportIssue } from '../../shared/product-import.ts';
import { listAdministrativeAreas } from './administrative-areas.ts';
import { readAdminWorkbook, workbookError } from './product-workbook.ts';
import { AppError } from '../lib/errors.ts';

export async function createZoneWorkbook(db: D1Database) {
  const provinces = await listAdministrativeAreas(db);
  const cell = (value: string | number | boolean) => ({ value, type: typeof value === 'number' ? Number : typeof value === 'boolean' ? Boolean : String });
  const heading = ZONE_IMPORT_COLUMNS.map(value => ({ ...cell(value), fontWeight: 'bold' as const }));
  const areas = provinces.flatMap(province => province.wards.map(ward => [province.province_name, ward.ward_name]));
  const blob = await writeXlsxFile([
    { sheet: 'DeliveryZones', data: [heading], columns: ZONE_IMPORT_COLUMNS.map(() => ({ width: 32 })), stickyRowsCount: 1 },
    { sheet: 'Instructions', data: [
      ['Hướng dẫn / Instructions', 'Quy tắc / Rules'],
      ['DeliveryZones', 'Mỗi dòng một khu vực mới; giữ header. / One new delivery zone per row; keep headers.'],
      ['province_name, ward_name', 'Bắt buộc, chọn tên từ Areas. / Required; choose names from Areas.'],
      ['fee', 'Bắt buộc; VND nguyên không âm, không dấu phân cách. / Required nonnegative integer VND, no separators.'],
      ['free_from_amount', 'Tùy chọn, VND nguyên không âm. / Optional nonnegative integer VND.'],
      ['eta_minutes', 'Tùy chọn, số phút nguyên dương. / Optional positive integer minutes.'],
      ['is_active', 'TRUE/FALSE hoặc 1/0; trống = TRUE. / TRUE/FALSE or 1/0; blank = TRUE.'],
      ['Giới hạn / Limits', '50 dòng, 1 MB .xlsx; không công thức. / 50 rows, 1 MB .xlsx; no formulas.'],
      ['Tạo mới / Create only', 'Khu vực đã có hoặc bị lặp sẽ bị từ chối. File lỗi không ghi dữ liệu. / Existing or duplicate areas are rejected; invalid file writes nothing.'],
      ['Examples', 'Chỉ minh họa; chép sang DeliveryZones và sửa trước khi dùng. / Examples only; copy into DeliveryZones and replace before use.'],
    ].map(row => row.map(cell)), columns: [{ width: 32 }, { width: 115 }] },
    { sheet: 'Areas', data: [['province_name', 'ward_name'], ...areas].map(row => row.map(cell)), columns: [{ width: 36 }, { width: 36 }] },
    { sheet: 'Examples', data: [heading, [areas[0]?.[0] ?? '', areas[0]?.[1] ?? '', 20000, 500000, 120, true].map(cell)] },
  ]).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}

export async function importZones(db: D1Database, base64: string, validateOnly: boolean): Promise<ZoneImportResult> {
  const rows = await readAdminWorkbook(base64, 'DeliveryZones');
  const header = rows[0]?.map(value => typeof value === 'string' ? value.trim() : value) ?? [];
  if (header.length !== ZONE_IMPORT_COLUMNS.length || ZONE_IMPORT_COLUMNS.some(column => header.filter(value => value === column).length !== 1)) workbookError('Các cột không khớp template phí giao hàng.');
  const issues: ProductImportIssue[] = [], zones: ZoneImportResult['zones'] = [];
  const seen = new Set<string>();
  const sourceRows: number[] = [];
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    if (row.every(value => value == null || value === '')) continue;
    if (sourceRows.length >= ZONE_IMPORT_MAX_ROWS) workbookError('Mỗi file chỉ được tối đa 50 khu vực giao hàng.');
    sourceRows.push(index + 1);
    const values = Object.fromEntries(ZONE_IMPORT_COLUMNS.map(column => [column, row[header.indexOf(column)]]));
    const amount = (key: string, optional = false) => {
      const value = values[key];
      if (optional && (value == null || value === '')) return null;
      return typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : NaN;
    };
    const active = values.is_active;
    const activeValue = active == null || active === '' || active === true || active === 1 || String(active).trim().toUpperCase() === 'TRUE' || active === '1' ? true
      : active === false || active === 0 || String(active).trim().toUpperCase() === 'FALSE' || active === '0' ? false : active;
    const parsed = adminDeliveryZoneSchema.safeParse({ province_name: values.province_name, ward_name: values.ward_name,
      fee: amount('fee'), free_from_amount: amount('free_from_amount', true), eta_minutes: amount('eta_minutes', true), is_active: activeValue });
    if (!parsed.success) { parsed.error.issues.forEach(issue => issues.push({ row: index + 1, path: issue.path.join('.'), message: issue.message })); continue; }
    const zone = { ...parsed.data, ward_name: canonicalWardName(parsed.data.ward_name) };
    const key = `${zone.province_name}\u001f${zone.ward_name}`;
    if (seen.has(key)) issues.push({ row: index + 1, path: 'ward_name', message: 'Khu vực bị lặp trong file.' });
    if (row.slice(header.length).some(value => value != null && value !== '')) issues.push({ row: index + 1, path: 'file', message: 'Có dữ liệu ngoài các cột template.' });
    seen.add(key); zones.push(zone);
  }
  if (!sourceRows.length) workbookError('Sheet DeliveryZones chưa có khu vực giao hàng.');
  if (issues.length) workbookError('File có lỗi. Chưa có khu vực nào được nhập.', issues);
  const provinces = await listAdministrativeAreas(db);
  const allowed = new Set(provinces.flatMap(province => province.wards.map(ward => `${province.province_name}\u001f${ward.ward_name}`)));
  const { results } = await db.prepare('SELECT province_name, ward_name FROM delivery_zones').all<{ province_name: string; ward_name: string }>();
  const existing = new Set(results.map(zone => `${zone.province_name}\u001f${canonicalWardName(zone.ward_name)}`));
  let duplicate = false;
  zones.forEach((zone, index) => {
    const key = `${zone.province_name}\u001f${zone.ward_name}`;
    if (!allowed.has(key)) issues.push({ row: sourceRows[index], path: 'ward_name', message: 'Khu vực không thuộc danh mục hành chính.' });
    if (existing.has(key)) { duplicate = true; issues.push({ row: sourceRows[index], path: 'ward_name', message: 'Khu vực giao hàng đã tồn tại.' }); }
  });
  if (issues.length) throw new AppError(duplicate ? 'CONFLICT' : 'VALIDATION_ERROR', duplicate ? 409 : 400, 'File có lỗi. Chưa có khu vực nào được nhập.', issues);
  const result: ZoneImportResult = { validated: validateOnly, zone_count: zones.length, zones };
  if (validateOnly) return result;
  const now = new Date().toISOString(), statements: D1PreparedStatement[] = [];
  for (let start = 0; start < zones.length; start += 12) {
    const group = zones.slice(start, start + 12);
    statements.push(db.prepare(`INSERT INTO delivery_zones(province_name,ward_name,fee,free_from_amount,eta_minutes,is_active,created_at,updated_at)
      VALUES ${group.map(() => '(?,?,?,?,?,?,?,?)').join(',')}`)
      .bind(...group.flatMap(zone => [zone.province_name, zone.ward_name, zone.fee, zone.free_from_amount, zone.eta_minutes, Number(zone.is_active), now, now])));
  }
  try { await db.batch(statements); }
  catch (error) {
    const message = error instanceof Error ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ''}` : '';
    if (/UNIQUE constraint failed/i.test(message)) throw new AppError('CONFLICT', 409, 'Khu vực vừa được tạo. Tải lại phí giao hàng trước khi thử lại.');
    throw error;
  }
  return result;
}
