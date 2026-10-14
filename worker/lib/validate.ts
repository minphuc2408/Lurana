import { validator } from 'hono/validator';
import type { z } from 'zod';
import { AppError } from './errors.ts';

export function parseSchema<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const limited = result.error.issues.some(issue => issue.code === 'custom' && issue.params?.appCode === 'CART_LIMIT');
  throw new AppError(limited ? 'CART_LIMIT' : 'VALIDATION_ERROR', limited ? 422 : 400,
    limited ? 'Giỏ hàng vượt giới hạn cho phép.' : 'Dữ liệu không hợp lệ.',
    result.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })));
}

// Hono handles JSON/query/param extraction; Zod supplies shared validation and DTO stripping.
export function validate<S extends z.ZodType, T extends 'json' | 'query' | 'param'>(target: T, schema: S) {
  return validator(target, (value: unknown) => parseSchema(schema, value));
}
