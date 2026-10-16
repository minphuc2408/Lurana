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
  placed_from: deliveryDate.optional(),
  placed_to: deliveryDate.optional(),
  q: z.string().trim().max(100, 'Từ khóa tối đa 100 ký tự.').optional(),
  limit: queryInteger(1, 50, 'Giới hạn phải là số nguyên từ 1 đến 50.').optional().default(20),
  offset: queryInteger(0, 10000, 'Vị trí phải là số nguyên từ 0 đến 10000.').optional().default(0),
}).superRefine((input, ctx) => {
  if (Boolean(input.placed_from) !== Boolean(input.placed_to)) ctx.addIssue({ code: 'custom', path: ['placed_from'], message: 'Chọn cả ngày đặt bắt đầu và kết thúc.' });
  if (input.placed_from && input.placed_to) {
    const days = (Date.parse(input.placed_to) - Date.parse(input.placed_from)) / 86400000;
    if (days < 0 || days > 365) ctx.addIssue({ code: 'custom', path: ['placed_to'], message: 'Khoảng tìm kiếm tối đa 366 ngày.' });
  }
  if (input.q && input.q.length < 2) ctx.addIssue({ code: 'custom', path: ['q'], message: 'Từ khóa cần ít nhất 2 ký tự.' });
});
export const adminOrderParamSchema = z.object({
  orderNumber: z.string().trim().min(1, 'Vui lòng nhập mã đơn.').max(100, 'Mã đơn không hợp lệ.'),
});
export const adminOrderStatusSchema = z.object({
  to_status: z.enum(ORDER_STATUSES, { error: 'Trạng thái đơn không hợp lệ.' }),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.').optional(),
  restock: z.boolean().optional(),
}).refine(input => input.restock === undefined || input.to_status === 'CANCELLED', {
  path: ['restock'], message: 'Chỉ chọn hoàn tồn khi hủy đơn.',
});
export const adminOrderNoteSchema = z.object({
  admin_note: z.string().max(500, 'Ghi chú tối đa 500 ký tự.').nullable(),
});
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
