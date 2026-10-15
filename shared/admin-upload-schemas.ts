import { z } from 'zod';

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const adminImageUploadRequestSchema = z.object({
  mime: z.enum(PRODUCT_IMAGE_TYPES),
  size: z.number().int().positive().max(MAX_PRODUCT_IMAGE_BYTES),
}).strict();
export const adminImageUploadTicketSchema = z.object({
  cloud_name: z.string().regex(/^[a-z0-9_-]+$/),
  api_key: z.string().regex(/^\d+$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/),
  params: z.object({
    timestamp: z.string().regex(/^\d+$/),
    public_id: z.string().regex(/^lunara\/(local|staging|prod)\/products\/[a-f0-9-]{36}$/),
    asset_folder: z.enum(['lunara/local/products', 'lunara/staging/products', 'lunara/prod/products']),
    upload_preset: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    overwrite: z.literal('false'),
    allowed_formats: z.literal('jpg,png,webp'),
  }),
});
export type AdminImageUploadTicket = z.output<typeof adminImageUploadTicketSchema>;
