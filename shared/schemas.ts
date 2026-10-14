import { z } from 'zod';
import { DELIVERY_METHOD_CODES, MAX_CART_LINES, MAX_QTY_PER_LINE } from './constants.ts';

export const methodCodeSchema = z.enum(DELIVERY_METHOD_CODES, { error: 'Phương thức giao hàng không hợp lệ.' });
const areaName = z.string({ error: 'Vui lòng nhập khu vực giao hàng.' }).trim()
  .min(1, 'Vui lòng nhập khu vực giao hàng.').max(100, 'Tên khu vực tối đa 100 ký tự.');
export const deliveryAddressSchema = z.object({ province_name: areaName, ward_name: areaName });
export const cartItemSchema = z.object({
  variant_id: z.number({ error: 'Mã biến thể phải là số nguyên dương.' }).int('Mã biến thể phải là số nguyên dương.').positive('Mã biến thể phải là số nguyên dương.').max(Number.MAX_SAFE_INTEGER, 'Mã biến thể không hợp lệ.'),
  quantity: z.number({ error: 'Số lượng phải là số nguyên dương.' }).int('Số lượng phải là số nguyên dương.').positive('Số lượng phải lớn hơn 0.').max(Number.MAX_SAFE_INTEGER, 'Số lượng không hợp lệ.'),
});
export const cartItemsSchema = z.array(cartItemSchema, { error: 'Giỏ hàng không hợp lệ.' })
  .min(1, 'Giỏ hàng cần ít nhất một sản phẩm.').superRefine((items, ctx) => {
    if (items.length > MAX_CART_LINES) ctx.addIssue({ code: 'custom', message: 'Giỏ hàng tối đa 15 dòng.', params: { appCode: 'CART_LIMIT' } });
    items.forEach((item, index) => {
      if (item.quantity > MAX_QTY_PER_LINE) ctx.addIssue({ code: 'custom', path: [index, 'quantity'], message: 'Mỗi dòng tối đa 20 sản phẩm.', params: { appCode: 'CART_LIMIT' } });
    });
  });
// z.object strips extra fields, including client prices, totals and roles.
export const quoteSchema = deliveryAddressSchema.extend({ items: cartItemsSchema, delivery_method_code: methodCodeSchema });
export const quoteBodySchema = quoteSchema;
export const productsQuerySchema = z.object({
  category: z.string({ error: 'Danh mục không hợp lệ.' }).trim().min(1, 'Danh mục không hợp lệ.').max(100, 'Danh mục không hợp lệ.').optional(),
  featured: z.literal('1', { error: 'Bộ lọc featured phải bằng 1.' }).optional().transform(value => value === '1' ? true : undefined),
});
export const productSlugSchema = z.object({ slug: z.string().min(1, 'Đường dẫn sản phẩm không hợp lệ.').max(200, 'Đường dẫn sản phẩm không hợp lệ.') });

export function normalizePhone(value: string): string {
  const phone = value.replace(/[\s.]/g, '');
  return phone.startsWith('+84') ? `0${phone.slice(3)}` : phone;
}
export const phoneSchema = z.string({ error: 'Số điện thoại không hợp lệ.' }).transform(normalizePhone)
  .pipe(z.string().regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.'));
const personNameSchema = z.string({ error: 'Vui lòng nhập tên.' }).trim()
  .min(1, 'Vui lòng nhập tên.').max(100, 'Tên tối đa 100 ký tự.');
export const orderSchema = z.object({
  items: cartItemsSchema,
  sender: z.object({
    name: personNameSchema,
    phone: phoneSchema,
    email: z.string({ error: 'Email không hợp lệ.' }).trim().email('Email không hợp lệ.').max(254, 'Email tối đa 254 ký tự.').optional(),
    is_anonymous: z.boolean({ error: 'Lựa chọn ẩn danh không hợp lệ.' }),
  }),
  recipient: deliveryAddressSchema.extend({
    name: personNameSchema,
    phone: phoneSchema,
    address_line: z.string({ error: 'Vui lòng nhập địa chỉ.' }).trim()
      .min(5, 'Địa chỉ cần ít nhất 5 ký tự.').max(200, 'Địa chỉ tối đa 200 ký tự.'),
  }),
  delivery: z.object({
    method_code: methodCodeSchema,
    // Calendar, configured slots and VN cutoff are checked by validateDeliverySlot.
    date: z.string({ error: 'Ngày giao không hợp lệ.' }),
    time_slot: z.string({ error: 'Khung giờ giao không hợp lệ.' }),
  }),
  card: z.object({
    type: z.enum(['NONE', 'GREETING_CARD', 'BANNER'], { error: 'Loại thiệp không hợp lệ.' }),
    message: z.string({ error: 'Lời nhắn không hợp lệ.' }).max(200, 'Lời nhắn tối đa 200 ký tự.').optional(),
  }).superRefine((card, ctx) => {
    if (card.type !== 'NONE' && !card.message?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['message'], message: 'Vui lòng nhập lời nhắn trên thiệp.' });
    }
  }),
  customer_note: z.string({ error: 'Ghi chú không hợp lệ.' }).max(500, 'Ghi chú tối đa 500 ký tự.').optional(),
  // Presence/validity is conditional on TURNSTILE_SECRET, checked on the server.
  turnstile_token: z.string({ error: 'Mã xác minh không hợp lệ.' }).optional(),
});
export const orderBodySchema = orderSchema;
export const lookupOrderSchema = z.object({
  order_number: z.string({ error: 'Mã đơn không hợp lệ.' }).trim()
    .min(1, 'Vui lòng nhập mã đơn.').max(100, 'Mã đơn không hợp lệ.'),
  phone: phoneSchema,
});
export const orderLookupSchema = lookupOrderSchema;
export type CartItem = z.infer<typeof cartItemSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type DeliveryMethodCode = z.infer<typeof methodCodeSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type LookupOrderInput = z.infer<typeof lookupOrderSchema>;
