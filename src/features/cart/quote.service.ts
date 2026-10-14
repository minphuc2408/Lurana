import { apiRequest } from '../../shared/api/client.ts';
export type MethodCode = 'STANDARD'|'EXPRESS'|'SAME_DAY';
export interface DeliveryData {
  provinces: { province_name: string; default_fee: number|null; free_from_amount: number|null; wards: { ward_name: string; fee: number }[] }[];
  methods: { code: MethodCode; surcharge: number }[]; time_slots: string[];
  limits: { max_cart_lines: number; max_quantity_per_line: number; max_advance_days: number };
}
export interface CartQuote {
  lines: { variant_id: number; sku: string; name_vi: string; name_en: string; size_code: string; image_url: string|null; unit_price: number; quantity: number; line_total: number }[];
  subtotal: number; discount_total: number; delivery_fee: number; grand_total: number;
  issues: { variant_id: number; code: 'OUT_OF_STOCK'|'VARIANT_UNAVAILABLE'; available?: number }[];
}
export const getDeliveryOptions = (signal?: AbortSignal) => apiRequest<DeliveryData>('/delivery/options', { signal });
export function requestQuote(items: { variantId?: number; qty: number }[], province: string, ward: string, method: MethodCode, signal?: AbortSignal) {
  return apiRequest<CartQuote>('/checkout/quote', { method: 'POST', signal, body: JSON.stringify({
    items: items.map(item => ({ variant_id: item.variantId, quantity: item.qty })),
    province_name: province, ward_name: ward, delivery_method_code: method,
  }) });
}
