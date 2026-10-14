import { MAX_ADVANCE_DAYS, MAX_CART_LINES, MAX_QTY_PER_LINE, TIME_SLOTS } from '../shared/constants.ts';

export { MAX_ADVANCE_DAYS, MAX_CART_LINES, MAX_QTY_PER_LINE, TIME_SLOTS };
export const TIME_ZONE = 'Asia/Ho_Chi_Minh';

// Giả định ban đầu, chủ shop cần chỉnh trước khi mở bán; không phải chính sách đã chốt.
export const DELIVERY_SURCHARGES = { STANDARD: 0, EXPRESS: 30000, SAME_DAY: 50000 } as const;
export const SAME_DAY_CUTOFF = '16:00';
export const MIN_PREPARATION_MINUTES = 120;
