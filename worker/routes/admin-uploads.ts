import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { WorkerEnv } from '../env.ts';
import { AppError } from '../lib/errors.ts';
import { validate } from '../lib/validate.ts';
import { adminImageUploadRequestSchema } from '../../shared/admin-upload-schemas.ts';
import { createImageUploadTicket } from '../services/cloudinary.ts';

export const adminUploadRoutes = new Hono<WorkerEnv>();
adminUploadRoutes.post('/uploads/sign', bodyLimit({ maxSize: 1024,
  onError: () => { throw new AppError('VALIDATION_ERROR', 400, 'Dữ liệu không hợp lệ.'); },
}), validate('json', adminImageUploadRequestSchema), async c =>
  c.json({ data: await createImageUploadTicket(c.env) }));
