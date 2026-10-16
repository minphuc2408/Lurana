import type { AdministrativeProvince } from '../../shared/delivery-areas.ts';
import { canonicalWardName } from '../../shared/delivery-areas.ts';
import { AppError } from '../lib/errors.ts';

export async function listAdministrativeAreas(db: D1Database): Promise<AdministrativeProvince[]> {
  const { results } = await db.prepare(`SELECT p.code AS province_code, p.name AS province_name,
    w.code AS ward_code, w.name AS ward_name FROM administrative_provinces p
    JOIN administrative_wards w ON w.province_code = p.code ORDER BY p.name, w.name`).all<{
      province_code: string; province_name: string; ward_code: string; ward_name: string;
    }>();
  const provinces = new Map<string, AdministrativeProvince>();
  for (const row of results) {
    let province = provinces.get(row.province_code);
    if (!province) { province = { code: row.province_code, province_name: row.province_name, wards: [] }; provinces.set(row.province_code, province); }
    province.wards.push({ code: row.ward_code, ward_name: row.ward_name });
  }
  return [...provinces.values()];
}

export async function validateZoneAddress(db: D1Database, province: string, ward: string, exceptId = 0) {
  const name = canonicalWardName(ward);
  const area = await db.prepare(`SELECT w.name FROM administrative_wards w
    JOIN administrative_provinces p ON p.code = w.province_code
    WHERE p.name = ? AND w.name = ?`).bind(province, name).first();
  if (!area) throw new AppError('VALIDATION_ERROR', 400, 'Chọn tỉnh/thành và phường/xã trong danh mục.', [
    { path: 'ward_name', message: 'Khu vực không thuộc danh mục hành chính.' },
  ]);
  const duplicate = await db.prepare(`SELECT id FROM delivery_zones WHERE province_name = ? AND id != ?
    AND ward_name IN (?, 'Phường ' || ?, 'Xã ' || ?, 'Đặc khu ' || ?) LIMIT 1`)
    .bind(province, exceptId, name, name, name, name).first();
  if (duplicate) throw new AppError('CONFLICT', 409, 'Khu vực giao hàng đã tồn tại.');
  return name;
}
