import type { ApiOrderStatus } from '@/features/orders';
import type { AdminVariantPatchInput } from '../../../shared/admin-catalog-schemas';
import { ApiError } from '../../shared/api/client.ts';
import type { AdminVariant, VariantDraft } from './admin-api.types';

export function allowedAdminTransitions(status: ApiOrderStatus): ApiOrderStatus[] {
  const next: Record<ApiOrderStatus, ApiOrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['IN_TRANSIT', 'CANCELLED'], IN_TRANSIT: ['DELIVERED', 'CANCELLED'], DELIVERED: [], CANCELLED: [],
  };
  return next[status];
}
export function variantDraft(variant: AdminVariant): VariantDraft {
  return { price: String(variant.price), compare_at_price: variant.compare_at_price == null ? '' : String(variant.compare_at_price),
    low_stock_threshold: String(variant.low_stock_threshold), stock_delta: '0', is_active: variant.is_active };
}
export function rebaseVariantDraft(previous: AdminVariant, draft: VariantDraft, fresh: AdminVariant, resetStockDelta = false): VariantDraft {
  const baseline = variantDraft(previous);
  const next = variantDraft(fresh);
  for (const field of ['price', 'compare_at_price', 'low_stock_threshold'] as const) if (draft[field] !== baseline[field]) next[field] = draft[field];
  if (draft.is_active !== baseline.is_active) next.is_active = draft.is_active;
  next.stock_delta = resetStockDelta ? '0' : draft.stock_delta;
  return next;
}
export function inputInteger(value: string, negative = false): number {
  if (!(negative ? /^-?\d+$/ : /^\d+$/).test(value) || !Number.isSafeInteger(Number(value))) throw new ApiError('VALIDATION_ERROR', 'Invalid number.');
  return Number(value);
}
export function buildProductSlug(name: string, identity = crypto.randomUUID()): string {
  const base = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
  return `${base.slice(0, 163).replace(/-+$/g, '')}-${identity}`;
}
/** Never resend a stale stock count or unchanged price fields with a delta. */
export function buildVariantPatch(variant: AdminVariant, draft: VariantDraft): AdminVariantPatchInput {
  const patch: AdminVariantPatchInput = {};
  const price = inputInteger(draft.price);
  const compare = draft.compare_at_price === '' ? null : inputInteger(draft.compare_at_price);
  const threshold = inputInteger(draft.low_stock_threshold);
  const delta = inputInteger(draft.stock_delta || '0', true);
  if (price !== variant.price) patch.price = price;
  if (compare !== variant.compare_at_price) patch.compare_at_price = compare;
  if (threshold !== variant.low_stock_threshold) patch.low_stock_threshold = threshold;
  if (draft.is_active !== variant.is_active) patch.is_active = draft.is_active;
  if (delta !== 0) patch.stock_delta = delta;
  return patch;
}
