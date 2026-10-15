import { z } from 'zod';
import { ADMIN_UNAUTHORIZED_EVENT } from '@/features/auth';
import { ApiError, apiRequest } from '@/shared/api/client';
import { adminOrdersQuerySchema, adminOrderStatusSchema, adminOrderNoteSchema } from '../../../shared/admin-order-schemas';
import { adminProductCreateSchema, adminProductPatchSchema, adminVariantPatchSchema, adminDeliveryZoneSchema } from '../../../shared/admin-catalog-schemas';
import type { ApiOrderStatus } from '@/features/orders';
import type { AdminOrderDetail, AdminOrderRow, AdminProduct, AdminSummary, AdminVariant, DeliveryZone } from './admin-api.types';
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
  return adminRequest<{ items: AdminOrderRow[]; total: number }>(`/orders?${params}`, { signal });
}
export const getAdminOrder = (number: string, signal?: AbortSignal) => adminRequest<AdminOrderDetail>(`/orders/${encodeURIComponent(number)}`, { signal });
export const changeOrderStatus = (number: string, status: ApiOrderStatus, note: string) => adminRequest(`/orders/${encodeURIComponent(number)}/status`, {
  method: 'PATCH', body: JSON.stringify(validated(adminOrderStatusSchema, { to_status: status, ...(note ? { note } : {}) })),
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
export const getAdminProducts = (signal?: AbortSignal) => adminRequest<{ items: AdminProduct[] }>('/products', { signal });
export const createAdminProduct = (body: unknown) => adminRequest<{ id: number }>('/products', { method: 'POST', body: JSON.stringify(validated(adminProductCreateSchema, body)) });
export const patchAdminProduct = (id: number, body: unknown) => adminRequest<{ id: number }>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(validated(adminProductPatchSchema, body)) });
export const patchAdminVariant = (id: number, body: unknown) => adminRequest<AdminVariant>(`/variants/${id}`, { method: 'PATCH', body: JSON.stringify(validated(adminVariantPatchSchema, body)) });
export const getDeliveryZones = (signal?: AbortSignal) => adminRequest<{ items: DeliveryZone[] }>('/delivery-zones', { signal });
export const saveDeliveryZone = (id: number | null, body: unknown) => adminRequest<DeliveryZone>(`/delivery-zones${id == null ? '' : `/${id}`}`, { method: id == null ? 'POST' : 'PUT', body: JSON.stringify(validated(adminDeliveryZoneSchema, body)) });
