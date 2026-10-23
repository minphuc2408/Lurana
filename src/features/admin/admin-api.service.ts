import type { AdministrativeProvince } from '../../../shared/delivery-areas';
import { z } from 'zod';
import { PRODUCT_IMPORT_MAX_BYTES, type ProductImportFile, type ProductImportResult } from '../../../shared/product-import';
import { ADMIN_UNAUTHORIZED_EVENT } from '@/features/auth';
import { ApiError, apiRequest } from '@/shared/api/client';
import { adminOrdersQuerySchema, adminOrderStatusSchema, adminOrderNoteSchema } from '../../../shared/admin-order-schemas';
import { adminProductCreateSchema, adminProductPatchSchema, adminVariantPatchSchema, adminDeliveryZoneSchema } from '../../../shared/admin-catalog-schemas';
import type { ApiOrderStatus } from '@/features/orders';
import type { AdminOrderDetail, AdminOrdersResult, AdminProductsResult, AdminZonesResult, AdminSummary, AdminVariant, DeliveryZone } from './admin-api.types';
import { adminProductsQuerySchema, adminZonesQuerySchema } from '../../../shared/admin-list-schemas';
import type { ZoneImportResult } from '../../../shared/zone-import';
import { adminImageUploadRequestSchema, adminImageUploadTicketSchema } from '../../../shared/admin-upload-schemas';

function validated<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError('VALIDATION_ERROR', 'Invalid input.', 400, result.error.issues);
  return result.data;
}
async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  try { return await apiRequest<T>(`/admin${path}`, options); }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
    throw error;
  }
}
export async function getAdminOrders(query: Record<string, string> = {}, signal?: AbortSignal) {
  const input = validated(adminOrdersQuerySchema, query);
  const params = new URLSearchParams(Object.entries(input).map(([key, value]) => [key, String(value)]));
  return adminRequest<AdminOrdersResult>(`/orders?${params}`, { signal });
}
export const getAdminOrder = (number: string, signal?: AbortSignal) => adminRequest<AdminOrderDetail>(`/orders/${encodeURIComponent(number)}`, { signal });
export const changeOrderStatus = (number: string, status: ApiOrderStatus, note: string, restock?: boolean) => adminRequest(`/orders/${encodeURIComponent(number)}/status`, {
  method: 'PATCH', body: JSON.stringify(validated(adminOrderStatusSchema, { to_status: status, ...(note ? { note } : {}), ...(restock === undefined ? {} : { restock }) })),
});
export const saveAdminOrderNote = (number: string, note: string) => adminRequest(`/orders/${encodeURIComponent(number)}/note`, {
  method: 'PATCH', body: JSON.stringify(validated(adminOrderNoteSchema, { admin_note: note || null })),
});
export const getAdminSummary = (signal?: AbortSignal) => adminRequest<AdminSummary>('/summary', { signal });
export async function requestImageUploadTicket(file: { type: string; size: number }, signal?: AbortSignal) {
  const body = validated(adminImageUploadRequestSchema, { mime: file.type, size: file.size });
  const response = await adminRequest<unknown>('/uploads/sign', { method: 'POST', body: JSON.stringify(body), signal });
  const result = adminImageUploadTicketSchema.safeParse(response);
  if (!result.success) throw new ApiError('BAD_RESPONSE', 'Invalid upload configuration.');
  return result.data;
}
export const getAdminProducts = (query: Record<string, string> = {}, signal?: AbortSignal) => {
  const input = validated(adminProductsQuerySchema, query);
  return adminRequest<AdminProductsResult>(`/products?${new URLSearchParams(Object.entries(input).map(([key, value]) => [key, String(value)]))}`, { signal });
};
export const getAdminVariant = (id: number) => adminRequest<AdminVariant>(`/variants/${id}`);
export const deleteAdminVariant = (id: number) => adminRequest<{ id: number }>(`/variants/${id}`, { method: 'DELETE', body: '{}' });
export const deleteAdminZone = (id: number) => adminRequest<{ id: number }>(`/delivery-zones/${id}`, { method: 'DELETE', body: '{}' });
export const getProductImportTemplate = () => adminRequest<ProductImportFile>('/products/import-template');
export const getZoneImportTemplate = () => adminRequest<ProductImportFile>('/delivery-zones/import-template');
export const importZoneFile = (file: ProductImportFile, validateOnly: boolean) => adminRequest<ZoneImportResult>('/delivery-zones/import', { method: 'POST', body: JSON.stringify({ ...file, validate_only: validateOnly }) });
export const importProductFile = (file: ProductImportFile, validateOnly: boolean) => adminRequest<ProductImportResult>('/products/import', {
  method: 'POST', body: JSON.stringify({ ...file, validate_only: validateOnly }),
});
export async function readProductImportFile(file: File): Promise<ProductImportFile> {
  if (!/\.xlsx$/i.test(file.name) || file.name.length > 200 || file.size === 0 || file.size > PRODUCT_IMPORT_MAX_BYTES) {
    throw new ApiError('INVALID_WORKBOOK', 'Choose an .xlsx file up to 1 MB.');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return { file_name: file.name, content_base64: btoa(binary) };
}
export function downloadProductTemplate(file: ProductImportFile) {
  const blob = new Blob([Uint8Array.from(atob(file.content_base64), char => char.charCodeAt(0))], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = file.file_name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const createAdminProduct = (body: unknown) => adminRequest<{ id: number }>('/products', { method: 'POST', body: JSON.stringify(validated(adminProductCreateSchema, body)) });
export const patchAdminProduct = (id: number, body: unknown) => adminRequest<{ id: number }>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(validated(adminProductPatchSchema, body)) });
export const patchAdminVariant = (id: number, body: unknown) => adminRequest<AdminVariant>(`/variants/${id}`, { method: 'PATCH', body: JSON.stringify(validated(adminVariantPatchSchema, body)) });
export const getDeliveryZones = (query: Record<string, string> = {}, signal?: AbortSignal) => {
  const input = validated(adminZonesQuerySchema, query);
  return adminRequest<AdminZonesResult>(`/delivery-zones?${new URLSearchParams(Object.entries(input).map(([key, value]) => [key, String(value)]))}`, { signal });
};
export const saveDeliveryZone = (id: number | null, body: unknown) => adminRequest<DeliveryZone>(`/delivery-zones${id == null ? '' : `/${id}`}`, { method: id == null ? 'POST' : 'PUT', body: JSON.stringify(validated(adminDeliveryZoneSchema, body)) });
