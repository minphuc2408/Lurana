// Shared API values; the existing demo UI is connected in Phase 5.
export const TIME_SLOTS = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'] as const;
export const DELIVERY_METHOD_CODES = ['STANDARD', 'EXPRESS', 'SAME_DAY'] as const;
export const SIZE_CODES = ['S', 'M', 'L', 'STANDARD', 'DELUXE'] as const;
export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const;
export const MAX_CART_LINES = 15;
export const MAX_QTY_PER_LINE = 20;
export const MAX_ADVANCE_DAYS = 30;
