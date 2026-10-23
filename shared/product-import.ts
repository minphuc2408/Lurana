import { z } from 'zod';

export const PRODUCT_IMPORT_MAX_BYTES = 1024 * 1024;
export const PRODUCT_IMPORT_MAX_PRODUCTS = 50;
export const PRODUCT_IMPORT_MAX_VARIANTS = 250;
export const PRODUCT_IMPORT_COLUMNS = [
  'category_id', 'slug', 'name_vi', 'name_en', 'description_vi', 'description_en',
  'badge_code', 'is_featured', 'status', 'sku', 'size_code', 'price',
  'compare_at_price', 'stock_quantity', 'low_stock_threshold', 'is_active',
] as const;
export const productImportRequestSchema = z.object({
  file_name: z.string().trim().min(1).max(200).regex(/\.xlsx$/i),
  content_base64: z.string().min(4).max(4 * Math.ceil(PRODUCT_IMPORT_MAX_BYTES / 3))
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
  validate_only: z.boolean().default(false),
}).strict();
export type ProductImportFile = { file_name: string; content_base64: string };
export type ProductImportResult = {
  validated: boolean;
  product_count: number;
  variant_count: number;
  products: { slug: string; name_vi: string; name_en: string; variant_count: number }[];
};
export type ProductImportIssue = { row?: number; path: string; message: string };
