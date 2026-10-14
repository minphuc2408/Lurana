# Lunara Flower Shop

Storefront + admin từ thiết kế Flower Shop Figma. **UI: Lunara · GitHub: Lurana**.

| Keyword | Hiện trạng |
| --- | --- |
| Frontend | React/React DOM 18.3.1 · React Router 7.18.4 · Vite 6.4.4 · Tailwind 4.1.12 |
| Worker | Hono + `@cloudflare/vite-plugin`; Phase 0 local |
| API | `GET /api/health` → `{ data: { ok: true, time } }`; `/api/*` chưa có → JSON 404 |
| D1 | Binding `DB` local; remote `lunara-db` đã tạo, trống theo thông tin chủ dự án |
| Commerce | Auth/cart/checkout/stock/orders/requests: frontend demo, chưa nối API |
| Locale | EN mặc định + VI; giữ PHP/₱ và Asia/Manila khi đổi ngôn ngữ |
| Build | Frontend `dist/client/` · Worker + Wrangler config `dist/lunara/` |
| Môi trường đã dùng | Node 24.11.1 · npm 11.6.3; Wrangler hiện yêu cầu Node ≥22 |

Health xác nhận Worker phản hồi, chưa kiểm tra DB. Reload khôi phục cart fixture; role/session trong trình duyệt chưa phải authorization production.

## Chạy local

```bash
npm ci
# Lần đầu: tạo .dev.vars từ .dev.vars.example, chỉ dùng giá trị demo.
npm run dev
# Terminal khác trên PowerShell:
curl.exe http://127.0.0.1:5173/api/health
npm run smoke
```

Dev: http://127.0.0.1:5173. Preview: http://127.0.0.1:4173. Port bận: dùng URL Vite in ra. `.npmrc`: npm registry HTTPS chính thức, `ignore-scripts=true`.

PowerShell: dùng `npm.cmd`/`npx.cmd` khi truyền đối số qua `--`; dùng `curl.exe` cho curl thật.

## Kiểm tra và build

```bash
npm run cf:typegen
npm run typecheck
npm run check:architecture
npm test
npm run build
npm audit
npm run preview
# Terminal khác khi preview đang chạy:
npm run check:ui -- http://127.0.0.1:4173
```

`cf:typegen`: bindings, `--include-runtime=false`; runtime types từ `@cloudflare/workers-types`. `check:ui`: Edge headless trên Windows, chặn ảnh/font ngoài ở chế độ mặc định; evidence local ở `.security-review/`. Chạy audit khi đổi dependency. Chưa có ESLint.

## Tài liệu và phần tiếp theo

| Cần tra | File |
| --- | --- |
| Hiện trạng, khoảng trống, đầu vào cần chủ dự án bổ sung | [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) |
| Routes, component, data ownership, giới hạn demo | [PROJECT_GUIDE.md](PROJECT_GUIDE.md) |
| Instructions + skill | [AGENTS.md](AGENTS.md) · [lunara-flower-shop](.agents/skills/lunara-flower-shop/SKILL.md) |
| Phase 0 → deploy | [Pipeline](docs/pipeline/README.md) · [Phase 0](docs/pipeline/PHASE_0_PREPARE.md) |
| Stack + entity map | [TECH_STACK.md](docs/TECH_STACK.md) · [FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md) |
| DB draft + đối chiếu schema | [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) · [SQL](docs/sql/MVP_SCHEMA.sql) |

MVP: **Hono/Workers · D1/SQLite · Cloudinary · Zod · COD khách vãng lai**. Phase 1 cần thống nhất draft SQL với đề xuất v2 của pipeline trước migration/seed. Cart/wishlist localStorage, API commerce, admin auth và chuyển frontend sang VND/múi giờ Việt Nam còn ở các phase tiếp theo. Database migrate/seed/reset scripts mới được chuẩn bị; chưa chạy trong Phase 0.

## Codex và CodeGraph

```bash
npm run assistant:setup
npm run graph:status -- --json
npm run graph:explore -- "useProducts useCartState useCheckout"
```

Setup: CodeGraph 1.5.0 local → `.codegraph/` + `.codex/config.toml` cho CodeGraph/OpenAI Docs MCP. Mở phiên trusted mới để nạp cấu hình. Wrapper tắt telemetry/fallback download; không đổi global settings.

Git: allowlist exact paths sau review; source/docs/skill được chia sẻ. `.dev.vars`, `.wrangler/`, `.codex/`, `.codegraph/`, build/dependencies/evidence ở local. `.dev.vars.example` chỉ chứa placeholder demo. Commit/push/deploy cần yêu cầu hiện tại hoặc standing authorization.

## Attribution

Figma gốc: [Flower Shop Website Design](https://www.figma.com/design/0YRitOqUypqP0K0esw8sXL/Flower-Shop-Website-Design--Copy---Community-). Attribution shadcn/ui và Unsplash: [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
