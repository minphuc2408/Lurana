import { z } from 'zod';
import { DELIVERY_METHOD_CODES, TIME_SLOTS } from '../../shared/constants.ts';
import { deliveryAddressSchema, methodCodeSchema } from '../../shared/schemas.ts';
import { DELIVERY_SURCHARGES, MAX_ADVANCE_DAYS, MAX_CART_LINES, MAX_QTY_PER_LINE } from '../config.ts';
import { AppError } from '../lib/errors.ts';
import { parseSchema } from '../lib/validate.ts';
import { canonicalWardName } from '../../shared/delivery-areas.ts';

interface DeliveryZoneRow {
  province_name: string;
  ward_name: string;
  fee: number;
  free_from_amount: number | null;
}

interface ProvinceOptions {
  province_name: string;
  default_fee: number | null;
  free_from_amount: number | null;
  wards: { ward_name: string; fee: number }[];
}

const subtotalSchema = z.number().int().nonnegative().safe();

/** A ward must be explicitly enabled and belong to the imported administrative catalog. */
export async function resolveFee(
  db: D1Database,
  province: string,
  ward: string,
  subtotal: number,
  methodCode: string,
): Promise<number> {
  const address = parseSchema(deliveryAddressSchema, { province_name: province, ward_name: ward });
  const method = parseSchema(methodCodeSchema, methodCode);
  const amount = parseSchema(subtotalSchema, subtotal);
  const zone = await db.prepare(`
    SELECT z.province_name, z.ward_name, z.fee, z.free_from_amount
    FROM delivery_zones z
    JOIN administrative_provinces p ON p.name = z.province_name
    JOIN administrative_wards w ON w.province_code = p.code
      AND z.ward_name IN (w.name, 'Phường ' || w.name, 'Xã ' || w.name, 'Đặc khu ' || w.name)
    WHERE z.is_active = 1 AND p.name = ? AND w.name = ?
    ORDER BY CASE WHEN z.ward_name = w.name THEN 0 ELSE 1 END, z.id
    LIMIT 1
  `).bind(address.province_name, canonicalWardName(address.ward_name)).first<DeliveryZoneRow>();

  if (!zone) throw new AppError('NO_DELIVERY_ZONE', 422, 'Khu vực này chưa được hỗ trợ giao hàng.');
  const base = zone.free_from_amount !== null && amount >= zone.free_from_amount ? 0 : zone.fee;
  return base + DELIVERY_SURCHARGES[method];
}

export async function getDeliveryOptions(db: D1Database) {
  const { results } = await db.prepare(`
    SELECT p.name AS province_name, w.name AS ward_name, z.fee, z.free_from_amount
    FROM delivery_zones z
    JOIN administrative_provinces p ON p.name = z.province_name
    JOIN administrative_wards w ON w.province_code = p.code
      AND z.ward_name IN (w.name, 'Phường ' || w.name, 'Xã ' || w.name, 'Đặc khu ' || w.name)
    WHERE z.is_active = 1
    ORDER BY p.name, w.name, z.id
  `).all<DeliveryZoneRow>();
  const provinces = new Map<string, ProvinceOptions>();
  for (const zone of results) {
    let province = provinces.get(zone.province_name);
    if (!province) {
      province = { province_name: zone.province_name, default_fee: null, free_from_amount: null, wards: [] };
      provinces.set(zone.province_name, province);
    }
    if (zone.ward_name === '') {
      province.default_fee = zone.fee;
      province.free_from_amount = zone.free_from_amount;
    } else {
      province.wards.push({ ward_name: zone.ward_name, fee: zone.fee });
    }
  }
  return {
    provinces: [...provinces.values()],
    methods: DELIVERY_METHOD_CODES.map(code => ({ code, surcharge: DELIVERY_SURCHARGES[code] })),
    time_slots: [...TIME_SLOTS],
    limits: {
      max_cart_lines: MAX_CART_LINES,
      max_quantity_per_line: MAX_QTY_PER_LINE,
      max_advance_days: MAX_ADVANCE_DAYS,
    },
  };
}
