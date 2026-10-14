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
export type CartItem = z.infer<typeof cartItemSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type DeliveryMethodCode = z.infer<typeof methodCodeSchema>;
