import type { DeliveryData } from './quote.service.ts';
export { normalizeAddressSearch } from '../../../shared/delivery-areas.ts';

/** The public API exposes only imported wards explicitly enabled in delivery_zones. */
export function deliveryWardOptions(province: string, options: DeliveryData | null) {
  return (options?.provinces.find(city => city.province_name === province)?.wards || [])
    .map(ward => ({ value: ward.ward_name, label: ward.ward_name }));
}
