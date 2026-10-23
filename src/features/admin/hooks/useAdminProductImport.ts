import { useAdminExcelImport } from './useAdminExcelImport';
import { getProductImportTemplate, importProductFile } from '../admin-api.service';
export function useAdminProductImport(onImported: () => Promise<void>) {
  return useAdminExcelImport(onImported, { template: getProductImportTemplate, request: importProductFile });
}
