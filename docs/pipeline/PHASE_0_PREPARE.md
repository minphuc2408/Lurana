# Phase 0 — Chuẩn bị repo và môi trường local

Hồ sơ nghiệm thu dành cho maintainer/QA: **DONE local, 6/6 tiêu chí, 14/10/2026**. Phạm vi là frontend + Hono Worker + kết nối D1 local; chưa migrate/seed hay tạo tài nguyên remote. Đây là bằng chứng lịch sử, không phải hướng dẫn cài lại.

Setup/lệnh hiện hành ở [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md), phiên bản/build/types ở [TECH_STACK](../TECH_STACK.md), trạng thái từng môi trường ở [PROJECT_STATUS](../PROJECT_STATUS.md).

## Tiêu chí nghiệm thu

- [x] Dev hiển thị frontend, không có lỗi console mới.
- [x] GET health trả JSON có `ok/time`; API lạ trả JSON 404, kể cả navigation chấp nhận HTML.
- [x] Reload route SPA như `/shop` vẫn hiển thị app.
- [x] Build và typecheck PASS.
- [x] `.dev.vars`/`.wrangler/` không vào Git; env example chỉ là demo.
- [x] Không đổi phiên bản frontend đã pin.

## Bằng chứng kiểm chứng — 14/10/2026

| Phạm vi | Kết quả tại mốc nghiệm thu |
| --- | --- |
| Toolchain | Node 24.11.1/npm 11.6.3; typecheck, architecture, 18/18 tests, build và audit 0 vulnerabilities PASS. 67 dependency có sẵn giữ nguyên; phiên bản khóa ở Git/lockfile. |
| HTTP/DB | Health 200/ISO time; API lạ và POST health trả 404 NOT_FOUND. Smoke PASS; D1 `SELECT 1` trả 1 trên local, chưa tạo bảng. |
| Browser | Edge dev Home/Shop/reload không overlay/runtime errors. UI checker: 15 routes, i18n 14 routes, responsive 320–1440 px, 0 exceptions; font/ảnh ngoài bị chặn. |
| Secrets/types | Git kiểm ignore/inclusion PASS; typegen sinh DB/admin bindings không có giá trị secret. |

Plugin quản lý assets output và generated Wrangler config; Vite giữ `remoteBindings:false`, loopback, React/Tailwind và aliases. Config/scripts mẫu cũ đã rút vì source hiện hành là nguồn thao tác. Không lấy health làm bằng chứng D1 readiness hay browser offline làm bằng chứng font/ảnh/provider thật.
