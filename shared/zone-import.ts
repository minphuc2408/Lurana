export const ZONE_IMPORT_COLUMNS = ['province_name', 'ward_name', 'fee', 'free_from_amount', 'eta_minutes', 'is_active'] as const;
export const ZONE_IMPORT_MAX_ROWS = 50;
export type ZoneImportResult = {
  validated: boolean; zone_count: number;
  zones: { province_name: string; ward_name: string; fee: number; free_from_amount: number | null; eta_minutes: number | null; is_active: boolean }[];
};
