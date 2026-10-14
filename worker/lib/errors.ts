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
  console.error('API INTERNAL', { request_id, error });
  return c.json({ error: { code: 'INTERNAL', message: 'Có lỗi xảy ra. Vui lòng thử lại.', details: { request_id } } }, 500);
};
