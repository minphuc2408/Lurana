# Phase 4 — Đăng nhập và API quản trị

Hồ sơ dành cho backend/QA: **DONE local, 9/9 tiêu chí, 14/10/2026**. Phạm vi auth cookie, summary/orders/products/variants/delivery; chưa gồm gallery nhiều ảnh, danh mục hành chính và hardening bổ sung sau đó. [API_CONTRACT](../reference/API_CONTRACT.md#admin-cookie-lunara_admin-httponly) sở hữu endpoint/DTO/validation/auth, [Architecture](../ARCHITECTURE.md#quyền-phiên-và-ranh-giới-provider) giữ rationale.

Admin routes tái dùng transitionOrder của Phase 3; projection admin tách public lookup. Không thêm bảng/dependency, không dùng users cho admin auth. Nghiệm thu UI thuộc [Phase 5](PHASE_5_FRONTEND.md); deployment/provider thuộc [PROJECT_STATUS](../PROJECT_STATUS.md).

## Tiêu chí nghiệm thu

- [x] Không cookie →401 mọi admin route trừ login; mật khẩu sai →INVALID_CREDENTIALS, đúng →HttpOnly/Strict cookie.
- [x] Write Origin khác →403; thiếu/sai JSON Content-Type bị từ chối.
- [x] Chuyển sai trạng thái →INVALID_TRANSITION.
- [x] DELIVERED →PAID/paid_at/delivered_at; hủy hoàn tồn một lần.
- [x] Stock delta hợp lệ cộng/trừ nguyên tử; tồn âm bị từ chối.
- [x] Product ACTIVE hiện public, HIDDEN/ARCHIVED chỉ còn admin.
- [x] Phí admin mới được dùng ở quote tiếp theo.
- [x] JSON không trả credentials/JWT/secret; JWT chỉ qua HttpOnly Set-Cookie.
- [x] Typecheck/tests/smoke PASS.

## Bằng chứng lệnh — 14/10/2026

Typecheck, architecture **178 source files**, **125/125 tests**, build và **40/40 smoke PASS** trên dev/build preview. Smoke gồm 16 catalog +10 order +1 đối soát order +12 admin +1 persisted snapshot. UI checker lúc đó: 15 routes, EN/VI, 320/390/768/1024 px, hidden routes 8, 0 exceptions.

| Nhóm | Bằng chứng tại mốc nghiệm thu |
| --- | --- |
| Auth/CSRF/JWT | Sai/thiếu/trống/ngắn/trùng secrets →401; hết hạn/sửa JWT/sai role →401; Origin sai →403; JSON sai →400; cookie Path=/, 12 h và Secure trên HTTPS. |
| Native workerd auth riêng | No-cookie/wrong password 401; login/me/logout 200; cross-origin 403; SHA-256/timingSafeEqual native, D1 writes=0. Chỉ đối chiếu env demo, không in cookie/JWT. |
| Summary/list/detail | Ba aggregate statements; ngày VN có ca UTC hôm qua; total/pagination/filter và LIKE literal %, _, backslash; note nội bộ không có trong lookup public. |
| Status/hủy | PENDING→DELIVERED bị 409; full flow PAID/UTC timestamps; actor_label ADMIN/actor_id NULL; hủy race 200/409, một lần hoàn/history. |
| Tồn | +5/−2 đúng, delta ưu tiên absolute; âm 400/compare-at<price400 không đổi tồn; delta+4/order−1 →+3; D1 thật 20−2+5=23. |
| Products | List ba statements; tạo một variant dùng batch ba statements (thiết kế ảnh đơn lúc đó N+2); slug/SKU conflict rollback, archive timestamp/primary image atomic, URL sai 400. |
| Delivery lịch sử | Phí 20000→23000 được quote dùng; default-zone 17000 từng được kiểm. Fallback tỉnh đã bỏ sau đó theo [DELIVERY_ADDRESS](../features/DELIVERY_ADDRESS.md). |
| Privacy/integrity | JSON quét secret/SQL/stack; FK sạch, không tồn âm, persisted snapshot không đổi. |

Node tests dùng shim extension timingSafeEqual; ca auth native workerd là bằng chứng riêng. Các ca ghi smoke dùng HTTP loopback + workerd D1 persist:false/remoteBindings:false, env example/synthetic secrets; không reset seed persisted hoặc ghi remote. Không đo CPU cloud.

## Điều kiện sử dụng thật

Owner đặt ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên và JWT_SECRET ≥32 ký tự khác biệt; không gửi secrets qua chat/Git. Cấu hình và rotate theo [OPERATIONS](../operations/OPERATIONS.md#6-secrets-mật-khẩu-và-phiên-admin), Turnstile theo [BOT_PROTECTION](../operations/BOT_PROTECTION.md). Raw logs cũ còn trong Git; checks mới không cộng vào nghiệm thu backend này.
