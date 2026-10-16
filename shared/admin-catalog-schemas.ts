import { z } from 'zod';

const amount = z.number({ error: 'Giá trị phải là số nguyên không âm.' }).int().min(0)
  .max(Number.MAX_SAFE_INTEGER, 'Giá trị quá lớn.');
const name = z.string({ error: 'Vui lòng nhập tên.' }).trim().min(1).max(200);
const description = z.string().max(5000).nullable();
const badge = z.enum(['BEST_SELLER', 'HOT', 'NEW']).nullable();
const status = z.enum(['ACTIVE', 'HIDDEN', 'ARCHIVED']);
export const adminCatalogIdSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'Mã tài nguyên không hợp lệ.').transform(Number)
    .pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
});
export const adminProductImageSchema = z.object({
  url: z.string().trim().max(2048).url('URL ảnh không hợp lệ.').refine(value => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && ['res.cloudinary.com', 'images.unsplash.com'].includes(url.hostname)
        && !url.port && !url.username && !url.password;
    } catch { return false; }
  }, 'Ảnh phải dùng HTTPS từ Cloudinary hoặc Unsplash, không chứa thông tin đăng nhập.'),
  alt_vi: z.string().max(200).nullable().optional(),
  alt_en: z.string().max(200).nullable().optional(),
});
const variantCreate = z.object({
  sku: z.string().trim().min(1).max(100),
  size_code: z.enum(['S', 'M', 'L', 'STANDARD', 'DELUXE']),
  price: amount,
  compare_at_price: amount.nullable().optional(),
  stock_quantity: amount.optional().default(0),
  low_stock_threshold: amount.optional().default(5),
  is_active: z.boolean().optional().default(true),
}).superRefine((value, ctx) => {
  if (value.compare_at_price != null && value.compare_at_price < value.price) {
    ctx.addIssue({ code: 'custom', path: ['compare_at_price'], message: 'Giá so sánh phải lớn hơn hoặc bằng giá bán.' });
  }
});
export const adminProductCreateSchema = z.object({
  category_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  slug: z.string().trim().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Đường dẫn sản phẩm không hợp lệ.'),
  name_vi: name,
  name_en: name,
  description_vi: description.optional(),
  description_en: description.optional(),
  badge_code: badge.optional(),
  is_featured: z.boolean().optional().default(false),
  status: status.optional().default('ACTIVE'),
  image: adminProductImageSchema,
  variants: z.array(variantCreate).min(1).max(5).superRefine((variants, ctx) => {
    const sizes = new Set<string>();
    const skus = new Set<string>();
    variants.forEach((variant, index) => {
      if (sizes.has(variant.size_code)) ctx.addIssue({ code: 'custom', path: [index, 'size_code'], message: 'Kích thước không được trùng.' });
      if (skus.has(variant.sku)) ctx.addIssue({ code: 'custom', path: [index, 'sku'], message: 'SKU không được trùng.' });
      sizes.add(variant.size_code);
      skus.add(variant.sku);
    });
  }),
});
export const adminProductPatchSchema = z.object({
  name_vi: name.optional(),
  name_en: name.optional(),
  description_vi: description.optional(),
  description_en: description.optional(),
  badge_code: badge.optional(),
  is_featured: z.boolean().optional(),
  status: status.optional(),
  image: adminProductImageSchema.optional(),
}).refine(value => Object.keys(value).length > 0, 'Vui lòng chọn thông tin cần cập nhật.');
export const adminVariantPatchSchema = z.object({
  price: amount.optional(),
  compare_at_price: amount.nullable().optional(),
  low_stock_threshold: amount.optional(),
  is_active: z.boolean().optional(),
  stock_delta: z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER).optional(),
  stock_quantity: amount.optional(),
}).refine(value => Object.keys(value).length > 0, 'Vui lòng chọn thông tin cần cập nhật.');
export const adminDeliveryZoneSchema = z.object({
  province_name: z.string().trim().min(1).max(100),
  ward_name: z.string().trim().max(100).optional().default(''),
  fee: amount,
  free_from_amount: amount.nullable().optional().default(null),
  eta_minutes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().optional().default(null),
  is_active: z.boolean().optional().default(true),
});

export type AdminProductCreateInput = z.output<typeof adminProductCreateSchema>;
export type AdminProductPatchInput = z.output<typeof adminProductPatchSchema>;
export type AdminVariantPatchInput = z.output<typeof adminVariantPatchSchema>;
export type AdminDeliveryZoneInput = z.output<typeof adminDeliveryZoneSchema>;
