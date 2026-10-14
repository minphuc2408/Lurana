import { z } from 'zod';
import { DELIVERY_METHOD_CODES, TIME_SLOTS } from '../../shared/constants.ts';
import { deliveryAddressSchema, methodCodeSchema } from '../../shared/schemas.ts';
import { DELIVERY_SURCHARGES, MAX_ADVANCE_DAYS, MAX_CART_LINES, MAX_QTY_PER_LINE } from '../config.ts';
import { AppError } from '../lib/errors.ts';
import { parseSchema } from '../lib/validate.ts';

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

/** Exact active ward takes priority; inactive rows never override the province default. */
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
    SELECT province_name, ward_name, fee, free_from_amount
    FROM delivery_zones
    WHERE is_active = 1 AND province_name = ? AND ward_name IN (?, '')
    ORDER BY CASE WHEN ward_name = ? THEN 0 ELSE 1 END
    LIMIT 1
  `).bind(address.province_name, address.ward_name, address.ward_name).first<DeliveryZoneRow>();

  if (!zone) throw new AppError('NO_DELIVERY_ZONE', 422, 'Khu vực này chưa được hỗ trợ giao hàng.');
  const base = zone.free_from_amount !== null && amount >= zone.free_from_amount ? 0 : zone.fee;
  return base + DELIVERY_SURCHARGES[method];
}

export async function getDeliveryOptions(db: D1Database) {
  const { results } = await db.prepare(`
    SELECT province_name, ward_name, fee, free_from_amount
    FROM delivery_zones WHERE is_active = 1
    ORDER BY province_name, ward_name
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
