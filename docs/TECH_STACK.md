# Tech stack Lunarra

Reference dành cho developer tra công nghệ, dependency và build/types. Phiên bản đối chiếu **19/10/2026** từ `package-lock.json`; dùng `npm ci` để tái lập cả các gói được manifest khai báo bằng dải `^`. Nghiệm thu/deployment thuộc [PROJECT_STATUS](PROJECT_STATUS.md).

## Công nghệ và phiên bản repository

| Tầng | Công nghệ / quyết định |
| --- | --- |
| Frontend | React/React DOM 18.3.1, React Router 7.18.4, TypeScript 5.7.3, Vite 6.4.4; giữ stack đã pin |
| Styling | Tailwind 4.1.12, React plugin 4.7.0; semantic brand tokens và 22 light themes theo [DESIGN_SYSTEM](ui-ux/DESIGN_SYSTEM.md) |
| Backend | Hono 4.13.13, Cloudflare Workers; @cloudflare/vite-plugin 1.63.2, Wrangler 4.150.0 |
| Validation | Zod 4.6.7; schemas chung ở root `shared/`, frontend khởi tạo jitless trước schema dưới CSP |
| Database | D1/SQLite, binding `DB`; canonical migrations và quyết định lưu trữ tại [DATABASE_DESIGN](reference/DATABASE_DESIGN.md) |
| i18n/UI | i18next/react-i18next; Radix wrappers, Lucide, `cn`; layout/typography/a11y tại design owner |
| Media | Signed direct Cloudinary upload; D1 lưu URL/public ID, browser truyền ảnh trực tiếp; [CLOUDINARY](operations/CLOUDINARY.md) |
| Excel admin (24/10/2026) | `read-excel-file`9.3.12 / `write-excel-file`4.1.1 universal ở Worker, `fflate`0.8.3 giới hạn ZIP trước parse; contract ở [API Excel](reference/API_CONTRACT.md#nhập-sản-phẩm-excel) |
| Auth/bot | Admin secret + HS256 cookie; Turnstile Siteverify và Worker RateLimit bindings; contract ở [API](reference/API_CONTRACT.md), policy tại [BOT_PROTECTION](operations/BOT_PROTECTION.md) |
| Local navigation | CodeGraph 1.5.0; index và cấu hình trợ lý local, không phải security scanner |
| Verification | Node tests, architecture/typecheck/build, smoke và Edge headless trên Windows; cách chạy ở [LOCAL_DEVELOPMENT](LOCAL_DEVELOPMENT.md) |

## Build, types và cấu hình

- Tại mốc tích hợp, run_worker_first dạng mảng cần Wrangler ≥4.20/plugin ≥1.7; repository pin cao hơn theo lockfile. compatibility_date nguồn 2026-10-06 khớp workerd đã pin, không tự nâng ngày vượt runtime.
- Vite tích hợp Worker và assets trong cùng source; output frontend `dist/client/`, Worker/generated Wrangler config `dist/lunara/`. Không sửa generated config; hai môi trường dùng chung dist nên build/deploy tuần tự.
- `tsconfig.worker.json` kiểm `worker/`, root `shared/` và Worker declarations riêng globals frontend. `cf:typegen` sinh `worker-configuration.d.ts` với `--include-runtime=false` và Workers types sau thay đổi binding.
- Vite/tsconfig giữ alias `@/` → `src/` và resolver `figma:asset/`. Vite giữ `remoteBindings:false`; dev/preview chỉ loopback. Layering/providers/data ownership thuộc [ARCHITECTURE](ARCHITECTURE.md), không duy trì bảng module thứ hai ở đây.
- Source dùng public frontend config theo mode; private secrets chỉ ở Worker/env local ignored. Target/UUID/build mode/secret setup của staging và production thuộc [STAGING](operations/STAGING.md), không suy trạng thái cloud từ config repo.

## Metadata và tài sản

SEO build tạo metadata HTML Home/Shop/About, robots/sitemap/OG; không prerender nội dung catalog. Client bổ sung metadata sản phẩm sau DTO; About/staging noindex theo [HARDENING](operations/HARDENING.md). Static `_headers` và API middleware có phạm vi riêng.

Hero hiện dùng JPEG responsive local từ `src/assets/home-reference/`; bộ WebP Hero trước đó được giữ như asset cũ. Category dùng public WebP có URL revisioned trong D1. Nguồn/giấy phép tại [ATTRIBUTIONS](../ATTRIBUTIONS.md); quy tắc gallery/URL ảnh ở Cloudinary và API contract.
