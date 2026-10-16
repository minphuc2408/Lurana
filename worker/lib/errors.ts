import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { WorkerEnv } from '../env.ts';

export class AppError extends Error {
  readonly code: string;
  readonly status: ContentfulStatusCode;
  readonly details?: unknown;

  constructor(code: string, status: ContentfulStatusCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Emit only recognized diagnostics, never a provider message, SQL, binds or stack. */
export function safeErrorDiagnostic(error: Error): Record<string, string> {
  const messages: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current instanceof Error; depth++, current = current.cause) messages.push(current.message.slice(0, 4096));
  const message = messages.join(' ');
  const knownCodes = ['SQLITE_CONSTRAINT', 'SQLITE_BUSY', 'SQLITE_FULL', 'SQLITE_TOOBIG', 'SQLITE_IOERR', 'SQLITE_ERROR', 'SQLITE_READONLY'];
  const code = knownCodes.find(value => new RegExp(`\\b${value}\\b`).test(message));
  const constraint = ['UNIQUE', 'CHECK', 'NOT NULL', 'FOREIGN KEY'].find(value => message.includes(`${value} constraint failed`));
  const targets = ['orders.idempotency_key', 'orders.order_number', 'orders.sender_phone', 'product_variants.sku', 'products.slug', 'stock_quantity', 'compare_at_price'];
  const target = targets.find(value => message.includes(value));
  if (code || constraint || message.includes('D1_ERROR')) return {
    error_family: 'D1', diagnostic_code: code ?? (constraint ? 'SQLITE_CONSTRAINT' : 'D1_ERROR'),
    ...(constraint ? { constraint } : {}), ...(constraint && target ? { constraint_target: target } : {}),
  };
  return {};
}

export const handleError: ErrorHandler<WorkerEnv> = (error, c) => {
  c.header('Cache-Control', 'no-store');
  if (error instanceof AppError) return c.json({ error: {
    code: error.code, message: error.message, ...(error.details === undefined ? {} : { details: error.details }),
  } }, error.status);
  // Hono's JSON parser throws before the Zod hook on malformed input.
  if (error instanceof HTTPException && error.status === 400) return c.json({ error: {
    code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ.',
    details: [{ path: '', message: 'Nội dung JSON không hợp lệ.' }],
  } }, 400);
  const request_id = c.get('request_id') || crypto.randomUUID();
  // Avoid dumping request/provider errors that could contain credentials or cookies.
  const error_name = ['Error', 'TypeError', 'RangeError', 'SyntaxError', 'AppError', 'HTTPException'].includes(error.name) ? error.name : 'Error';
  console.error('API INTERNAL', { request_id, error_name, ...safeErrorDiagnostic(error) });
  return c.json({ error: { code: 'INTERNAL', message: 'Có lỗi xảy ra. Vui lòng thử lại.', details: { request_id } } }, 500);
};
