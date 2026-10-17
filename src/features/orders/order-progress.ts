import type { OrderDetail } from './order-api.types';

export const orderMilestones = ['PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'] as const;
export function orderProgress(order: Pick<OrderDetail, 'status_code' | 'timeline'>) {
  const current = orderMilestones.findIndex(code => code === order.status_code);
  const visited = new Set(order.timeline.map(event => event.to_status));
  return orderMilestones.map((code, index) => ({
    code,
    current: code === order.status_code,
    reached: order.status_code === 'CANCELLED' ? visited.has(code) : index <= current,
  }));
}
