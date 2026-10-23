import { z } from 'zod';
const integer = (min: number, max: number) => z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(min).max(max));
const paging = z.object({ q: z.string().trim().max(100).optional().default(''), limit: integer(1, 50).optional().default(5), offset: integer(0, 10000).optional().default(0) });
export const adminProductsQuerySchema = paging.extend({ filter: z.enum(['all', 'low', 'hidden']).optional().default('all') });
export const adminZonesQuerySchema = paging.extend({ limit: integer(1, 50).optional().default(10), filter: z.enum(['all', 'active', 'inactive']).optional().default('all') });
export type AdminProductCounts = { all: number; low: number; hidden: number };
export type AdminZoneCounts = { all: number; active: number; inactive: number };
