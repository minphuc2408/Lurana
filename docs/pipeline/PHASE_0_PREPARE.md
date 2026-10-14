# Phase 0 — Chuẩn bị repo và môi trường local

**Mục tiêu:** repo chạy được frontend và Worker (Hono) cùng lúc ở local, có D1 local. **Không cần tài khoản Cloudflare** ở phase này.

**Trạng thái:** DONE · 6/6 tiêu chí · lệnh thật + Edge headless. [Hiện trạng](../PROJECT_STATUS.md). Các bước dưới là checklist đã thực hiện, không yêu cầu cài lại hoặc tạo D1 remote.

Phiên bản được kiểm chứng trong repo: Node `24.11.1`, npm `11.6.3`, Vite `6.4.4`, React Router `7.18.4`; plugin `1.63.2`, Wrangler `4.150.0`, Hono `4.13.13`, Zod `4.6.7`, `@cloudflare/workers-types` `5.20261006.1`. Build/typecheck thực tế pass với Vite đã pin, không nâng frontend. Clone/cài lại bằng `npm ci` theo lockfile.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 0.1 | AGENT | Đọc `package.json`, `vite.config.ts`, `tsconfig*.json`, `src/features/*`; ghi lại phiên bản Node, Vite, React Router, scripts hiện có. **Không đổi phiên bản các gói đã pin** |
| 0.2 | AGENT | Cài thêm: `npm i hono zod` và `npm i -D wrangler @cloudflare/vite-plugin @cloudflare/workers-types`. Trước khi cài, kiểm tra tài liệu `@cloudflare/vite-plugin` xem có tương thích Vite 6 của repo không. Yêu cầu tối thiểu để dùng `run_worker_first` dạng mảng: **wrangler ≥ 4.20, plugin ≥ 1.7** |
| 0.3 | AGENT | Thêm `cloudflare({ remoteBindings: false })` vào `vite.config.ts`; giữ React/Tailwind plugins, aliases, `figma:asset/` resolver và host `127.0.0.1` |
| 0.4 | AGENT | Tạo/cập nhật `wrangler.jsonc` (mẫu dưới). Giữ `database_id` thật nếu chủ dự án đã tạo D1 và cung cấp; binding dùng local ở phase này, không tạo hoặc truy cập D1 remote |
| 0.5 | AGENT | Tạo `worker/index.ts` với Hono: `GET /api/health` → `{ data: { ok: true, time } }` và 404 JSON cho `/api/*` không khớp |
| 0.6 | AGENT | Tạo `worker/env.ts` kiểu `Bindings` (`DB: D1Database; ADMIN_PASSWORD: string; JWT_SECRET: string; TURNSTILE_SECRET?: string`). Chạy `npm run cf:typegen` (`wrangler types --include-runtime=false`) để sinh `worker-configuration.d.ts`; runtime types dùng gói `@cloudflare/workers-types` |
| 0.7 | AGENT | Tạo `tsconfig.worker.json` bao `worker/` và `shared/`, types `@cloudflare/workers-types`; không làm vỡ tsconfig của frontend |
| 0.8 | AGENT | Thêm scripts (xem dưới) và giữ `.wrangler/`, `.dev.vars`, `dist/` ngoài Git. Repo dùng default-deny allowlist: chỉ thêm exact path cho source/config/example đã review |
| 0.9 | AGENT | Tạo `.dev.vars.example` (commit) và `.dev.vars` (không commit) với `ADMIN_PASSWORD`, `JWT_SECRET` giá trị thử nghiệm |
| 0.10 | AGENT | Chạy `npm run dev`, mở `/` và `/api/health`; chạy `npm run build` |
| 0.11 | NGƯỜI (tùy chọn) | Chuẩn bị ~8 ảnh sản phẩm để upload Cloudinary sau; MVP có thể dùng ảnh placeholder trong seed |

## `wrangler.jsonc` mẫu

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "lunara",
  "main": "./worker/index.ts",
  "compatibility_date": "2026-10-06",
  "assets": {
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "lunara-db",
      "database_id": "1796e7bf-d230-4bc1-a80a-f4be4d1eccc7",
      "migrations_dir": "migrations"
    }
  ]
}
```

Ghi chú: `@cloudflare/vite-plugin` quản lý `assets.directory`; bỏ trường này khỏi config nguồn. Build đã kiểm chứng sinh frontend `dist/client/`, Worker `dist/lunara/index.js` và `dist/lunara/wrangler.json`; `wrangler deploy` đọc config do plugin tạo. `compatibility_date` `2026-10-06` khớp workerd local được pin; không dùng ngày mới hơn runtime hỗ trợ. Trong Vite dùng `cloudflare({ remoteBindings: false })` để các bindings chạy local, dù source config chứa D1 ID thật đã được chủ dự án cung cấp. Không gọi login, create, migration hoặc seed remote trong Phase 0.

## Scripts `package.json`

```jsonc
{
  "dev": "vite",
  "build": "vite build",
  "typecheck": "tsc --noEmit && tsc -p tsconfig.worker.json --noEmit",
  "cf:typegen": "wrangler types --include-runtime=false",
  "db:migrate:local": "wrangler d1 migrations apply lunara-db --local",
  "db:seed:local": "wrangler d1 execute lunara-db --local --file=./docs/sql/MVP_SEED_DEV.sql",
  "db:reset:local": "node scripts/reset-d1-local.mjs && npm run db:migrate:local && npm run db:seed:local",
  "smoke": "node scripts/smoke.mjs",
  "deploy": "npm run build && wrangler deploy"
}
```

Giữ các script hiện có; chỉ thêm script cần thiết. `db:reset:local` dùng Node trên Windows và kiểm tra đường dẫn/symlink trước khi xóa `.wrangler/state`, rồi migrate/seed local. Script này dành cho Phase 1; Phase 0 không áp migration hoặc seed. `smoke` kiểm tra health + JSON 404, các phase sau mở rộng cùng script. `deploy` được chuẩn bị nhưng chỉ chạy khi được yêu cầu deploy.

PowerShell dùng `npm.cmd` khi cần chuyển đối số qua `--`, ví dụ `npm.cmd run dev -- --port 5173 --strictPort`; `curl.exe` gọi curl thật, tránh alias PowerShell.

## `.dev.vars.example`

```text
# Local demo values only. Replace before configuring production secrets.
ADMIN_PASSWORD=local-demo-admin-password-do-not-use-in-production
JWT_SECRET=local-demo-jwt-secret-at-least-32-characters
# TURNSTILE_SECRET=local-demo-turnstile-secret
```

## Tiêu chí nghiệm thu

- [x] `npm run dev` hiển thị frontend hiện có, không lỗi console mới.
- [x] `GET /api/health` trả `{ "data": { "ok": true, ... } }`; `GET /api/khong-co` trả JSON 404, không trả `index.html`.
- [x] Route SPA (ví dụ `/shop`) tải lại trang vẫn hiển thị app.
- [x] `npm run build` và `npm run typecheck` pass.
- [x] `.dev.vars`, `.wrangler/` không nằm trong git.
- [x] Không có thay đổi phiên bản gói frontend đã pin.

## Bằng chứng kiểm chứng — 14/10/2026

- `npm ci`, `npm run typecheck`, `npm run check:architecture`, `npm test`, `npm run build`, `npm audit` pass; 18/18 tests, audit 0 vulnerabilities. Đối chiếu 67 dependency frontend/tooling có sẵn trong manifest và lockfile: không đổi phiên bản.
- Dev chạy tại `http://127.0.0.1:5173`. `curl.exe` nhận health HTTP 200 JSON có `ok: true` và `time` ISO; `/api/khong-co` HTTP 404 JSON `NOT_FOUND`, kể cả request navigation chấp nhận HTML. `POST /api/health` cũng trả JSON 404.
- `npm.cmd run smoke -- http://127.0.0.1:5173` pass. `npx.cmd --no-install wrangler d1 execute lunara-db --local --command "SELECT 1 AS ok;"` trả `ok = 1`, resource location `local`; không tạo bảng, migration hoặc seed.
- `git check-ignore` xác nhận `.dev.vars` và `.wrangler/state` bị ignore; `git ls-files -- .dev.vars .wrangler` rỗng. `.dev.vars.example` được allowlist; build/cache/state giữ local.
- `npm run cf:typegen` pass; bindings sinh ra là `DB: D1Database`, `ADMIN_PASSWORD: string`, `JWT_SECRET: string`, không chứa giá trị secret.
- Edge headless kiểm tra dev `/` và `/shop`, reload `/shop` bằng `Page.reload(ignoreCache: true)`: frontend có nội dung, không Vite error overlay, không runtime/console errors; health trả 200. Bằng chứng local ở `.security-review/phase0-browser-dev.json` và screenshot, không vào Git.
- `npm.cmd run check:ui -- http://127.0.0.1:5173` pass trên dev: 15 routes và các flows, i18n 14 routes, responsive 320–1440px, 0 exceptions. Browser check chặn ảnh/font ngoài để ổn định; không chứng minh nội dung remote tải được. Bằng chứng nằm trong `.security-review/`, không vào Git.
- `npm run graph:sync` pass; graph status 188 files, up to date. Kiểm tra 55 liên kết Markdown local đều tồn tại.
