import { Hono } from 'hono';
import type { Bindings } from './env';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/api/health', c => c.json({
  data: { ok: true, time: new Date().toISOString() },
}));

app.notFound(c => c.json({
  error: { code: 'NOT_FOUND', message: 'Không tìm thấy API.' },
}, 404));

export default app;
