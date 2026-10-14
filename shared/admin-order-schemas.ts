import { z } from 'zod';
import { ORDER_STATUSES } from './constants.ts';

const deliveryDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày giao không hợp lệ.')
  .refine(value => {
    const timestamp = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
  }, 'Ngày giao không hợp lệ.');
const queryInteger = (minimum: number, maximum: number, message: string) =>
  z.string().regex(/^\d+$/, message).transform(Number)
    .pipe(z.number().int(message).min(minimum, message).max(maximum, message));

export const adminOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: 'Trạng thái đơn không hợp lệ.' }).optional(),
  date: deliveryDate.optional(),
  q: z.string().trim().max(100, 'Từ khóa tối đa 100 ký tự.').optional(),
  limit: queryInteger(1, 50, 'Giới hạn phải là số nguyên từ 1 đến 50.').optional().default(20),
  offset: queryInteger(0, Number.MAX_SAFE_INTEGER, 'Vị trí phải là số nguyên không âm.').optional().default(0),
});
export const adminOrderParamSchema = z.object({
  orderNumber: z.string().trim().min(1, 'Vui lòng nhập mã đơn.').max(100, 'Mã đơn không hợp lệ.'),
});
export const adminOrderStatusSchema = z.object({
  to_status: z.enum(ORDER_STATUSES, { error: 'Trạng thái đơn không hợp lệ.' }),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự.').optional(),
});
export const adminOrderNoteSchema = z.object({
  admin_note: z.string().max(500, 'Ghi chú tối đa 500 ký tự.').nullable(),
});
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
