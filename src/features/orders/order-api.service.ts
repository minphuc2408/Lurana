import { apiRequest } from '../../shared/api/client.ts';
import type { OrderInput, LookupOrderInput } from '../../../shared/schemas.ts';
import type { OrderDetail, OrderSummary } from './order-api.types.ts';

export const submitOrder = (payload: OrderInput, key: string) => apiRequest<OrderSummary>('/orders', {
  method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(payload),
});
export const lookupOrder = (payload: LookupOrderInput, signal?: AbortSignal) => apiRequest<OrderDetail>('/orders/lookup', {
  method: 'POST', signal, body: JSON.stringify(payload),
});
