export interface AdministrativeProvince {
  code: string;
  province_name: string;
  wards: { code: string; ward_name: string }[];
}
export function canonicalWardName(value: string): string {
  return value.trim().replace(/^(?:Phường|Xã|Đặc khu)\s+/u, '');
}
export function normalizeAddressSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
}
