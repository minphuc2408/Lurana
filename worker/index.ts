import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { requestId } from 'hono/request-id';
import type { WorkerEnv } from './env.ts';
import { handleError } from './lib/errors.ts';
import { publicRoutes } from './routes/public.ts';

const app = new Hono<WorkerEnv>();
app.use('/api/*', secureHeaders());
app.use('/api/*', requestId({ headerName: 'X-Request-Id' }));
app.use('/api/*', async (c, next) => {
  c.set('request_id', c.get('requestId'));
  c.header('Cache-Control', 'no-store');
  await next();
  // Drain ignored payloads (404/non-JSON validation) without buffering them. Local
  // workerd closes connections with unread bodies; its proxy may reuse that socket.
  if (c.req.raw.body && !c.req.raw.bodyUsed) {
    await c.req.raw.body.pipeTo(new WritableStream({ write() {} }));
  }
  c.header('Content-Type', 'application/json; charset=utf-8');
  const catalog = /^\/api\/(categories|products(?:\/[^/]+)?|delivery\/options)$/.test(c.req.path);
  if (c.req.method === 'GET' && catalog && c.res.status === 200) c.header('Cache-Control', 'public, max-age=30');
});
app.onError(handleError);

app.get('/api/health', c => c.json({
  data: { ok: true, time: new Date().toISOString() },
}));

app.route('/api', publicRoutes);

app.notFound(c => c.json({
  error: { code: 'NOT_FOUND', message: 'Không tìm thấy API.' },
}, 404));

export default app;
