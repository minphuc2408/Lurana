# Lunarra — trạng thái hiện tại

Cập nhật tài liệu **17/10/2026**, giờ Việt Nam. Đây là nơi tổng hợp nghiệm thu và các mốc triển khai đã ghi nhận. Các kết quả giữ đúng ngày và phạm vi của từng lượt kiểm; thay đổi local chưa deploy không thay mốc staging bên dưới.

## Code và kiểm chứng local

**Phase 0–5 DONE local; Phase 6 IN PROGRESS, 5/7 tiêu chí.** Hai việc còn thiếu là dữ liệu mở bán thật và xác nhận bàn giao cách theo dõi quota. Source có storefront/catalog, giỏ hàng → checkout COD, tra đơn và quản trị API; các feature khách hàng ngoài MVP vẫn deferred. Chi tiết hành vi xem [sổ tay](../PROJECT_GUIDE.md), [Checkout UI](CHECKOUT_UI.md), [Tra đơn](ORDER_TRACKING.md) và [hợp đồng API](pipeline/API_CONTRACT.md).

| Mốc kiểm local đã ghi nhận | Kết quả và giới hạn |
| --- | --- |
| 16 light themes,17/10 — **local, chưa deploy** | Typecheck, architecture **237 source files**, **194/194 tests**, build PASS; CodeGraph sync. Edge trên build: **256** Header cases(16themes ×EN/VI ×8widths320–1440), **112** route cases(16×Home/Shop/detail/Cart/Checkout/Tra đơn/Story), đối chiếu màu Original với computed styles đã có trong baseline7routes PASS.4font thật từ cache local; kiểm keyboard/focus/check/cuộn/Escape/click ngoài, popup/modal, search mở, boot trước render, persistence/fallback/storage bị chặn và giữ form PASS;0JS exceptions/0order writes. Catalog/delivery public GET snapshot bị intercept, không nghiệm thu provider/admin thật. [Runner](../scripts/check-ui-themes.mjs), [unit tests](../tests/themes.test.mjs); evidence ignored `.security-review/themes-results.json`/`themes-*.png`. [Spec](ui-ux/LUNARA_MULTI_THEME_SPEC.md) giữ quyết định màu và giới hạn Original. |
| Home theo ref,17/10 — **local, chưa deploy** | Thay khối Featured cũ bằng Tuyển chọn hôm nay/Sản phẩm nổi bật và Hành trình trao gửi. Typecheck, architecture **234 source files**, **191/191 tests**, build PASS; CodeGraph đã sync. Preview EN/VI ×7 widths320–1440: **14 ca** layout, quick-add variant còn hàng đầu tiên, keyboard/detail/Shop, hết hàng/loading/rỗng/lỗi/retry PASS;0exceptions/0API writes. Catalog synthetic bị intercept; snapshot GET staging **1sản phẩm**, ảnh Cloudinary tải đúng trong preview, không phải deploy mới. Evidence ignored `.security-review/home-selection-results.json` và ảnh `home-selection-*`; probe tạm không đưa vào Git. |
| 17/10, Tra đơn/footer | Typecheck, architecture **234 source files**, **191 tests**, production build và staging build/dry-run PASS. Không phải lượt chạy mới của audit tài liệu |
| Tra đơn | **72 ca** =6 trạng thái ×2 locale ×6 widths320–1440px; căn giữa/cùng chiều rộng/không overflow, lỗi và phản hồi trễ, required mã+SĐT, memory-only PII PASS. API/challenge bị intercept;0exceptions/0order writes. Runner [check-ui-order-lookup](../scripts/check-ui-order-lookup.mjs), evidence ignored `.security-review/lookup-ref-results.json` |
| Footer | **84 lượt** =14 mục ×2 locale ×3 widths320/768/1440px; notice đúng tên, Escape/X/Đóng, focus restoration và không điều hướng PASS;0exceptions. Probe tạm ignored, không có runner footer riêng trong Git |
| Cart/checkout hai trang,17/10 | **18 nhóm**: EN/VI/responsive/cart controls/consent/bank rollback/review/memory draft/retry UUID PASS;2 order responses bị intercept(503→201),0order API writes/0exceptions. [Runner](../scripts/check-ui-cart-checkout.mjs), evidence `.security-review/`/ảnh probe local; không nghiệm thu provider thật |
| Story,17/10 | **28 ca** =2 routes ×2 locale ×7 widths;7 vị trí ảnh đã tải, noindex/navigation/địa chỉ chung footer PASS,0exceptions/0order writes. Đã chạy lại sau khi chèn Hành trình trao gửi, assertion thứ tự Home được cập nhật. [Runner](../scripts/check-ui-story.mjs), `.security-review/story-ui-results.json` |
| Header/layout/typeface,17/10 | Header/search/cart **24 ca**, EN/VI/6 widths/cart0 và12; query tiếng Việt, Escape/focus, container/grid PASS. Probe typography tải4font/glyph VI, body/form/portal PASS. Local evidence, không phải full UI suite |
| Delivery/catalog,16/10 | **190 tests/225 source files**, typecheck/build, schema **13/13 nhóm(46 assertions)** và smoke **40/40** PASS; browser admin7 +address8 +checkout12nhóm PASS trên dữ liệu cô lập;0exceptions. [Delivery](DELIVERY_ADDRESS.md) |
| Gallery/detail,16/10 | Gallery5nhóm và product detail6nhóm browser PASS; signed-upload/challenge giả lập, Worker/D1 cô lập; snapshot persisted không đổi. Lần lượt179/174tests tại đúng mốc, không phải counts hiện tại |
| Category images,16/10 |172tests, schema13/13, smoke40/40; browser ảnh EN/VI10ca PASS;4WebP khớp SHA256. [Nguồn/rollback](CATEGORY_IMAGES.md) |
| Hardening/fail-closed,16/10 | Native verifier3cấu hình và22phản hồi header live đã kiểm; bằng chứng tại mốc đó, không chứng minh secret/challenge hiện tại hoặc CPU cloud |
| Phase5,15/10 |136tests/207source/smoke40, UI17routes/0exceptions;10/10MVP +2/2mở rộng trên local. [Nghiệm thu Phase5](pipeline/PHASE_5_FRONTEND.md) |

Full UI checker đã chạy lại cho Home và theme17/10, vẫn dừng ở assertion total670 trong `check-ui-live-catalog.mjs`: checker cũ còn giả định quote-before-zone/luồng checkout gộp. Chưa điều chỉnh và nghiệm thu lại toàn bộ; các targeted PASS ở trên không thay kết quả full suite. Ảnh/provider bị chặn hoặc mock trong một số probe; không suy ra upload thật, Turnstile thật hoặc quota/CPU cloud.

## Staging ghi nhận gần nhất — 17/10/2026

Version **`ef985262-c3fe-4b70-b75f-636c87cfadda`**, deploy lúc **17:14 giờ Việt Nam**; gồm sửa căn giữa Tra đơn và hộp thoại footer cùng source runtime lúc build. Đây là mốc deploy trước audit, không phải ánh xạ tự động mọi commit tài liệu sau đó tới Worker.

- Public UI: **12/12 ca EN/VI320–1440px PASS**,0JavaScript exceptions/0ghi đơn; Tra đơn không hiển thị dữ liệu mẫu, footer notice hoạt động.
- Bundle `/assets/index-CgGAlfXA.js` khớp artifact staging, SHA256 `110914504d68011aee8ff85295724c66f19347dbb86b4a888c500d42184050d9`; CSP/noindex và API nosniff giữ nguyên.
- `POST /api/orders/lookup` với mã/SĐT/token tổng hợp sai trả **403 FORBIDDEN**. Đây là kiểm từ chối token, chưa chứng minh lookup thành công với challenge thật.
- Không migrate/seed/đổi secrets hoặc ghi D1 trong lượt deploy này; production không thay đổi. Evidence ignored: `.security-review/lookup-live-results.json`, `.security-review/lookup-staging-verification.json`.

### Staging và hai PR đã merge — 17/10/2026

Mốc trước đó lúc16:42:38, owner deploy `c29141be-740e-4908-b369-179d7631356e`,100%traffic, deployment`54ad979d-50af-412d-8e4c-9298e60b27b9`. Main tại lúc kiểm là`77bdfdc`: @minphuc8042 thực hiện README`4821a53` và tiến trình đơn`7dac1bb`; @minphuc2408 merge [PR1](https://github.com/minphuc2408/Lurana/pull/1) và [PR2](https://github.com/minphuc2408/Lurana/pull/2). Bản16:42 được thay bởi mốc17:14 ở trên.

Public audit16:42: /,/about,/cart,/checkout,/orders/track đều200/CSP/noindex; health200. Bundle`index-DzKDn3E3.js`, SHA256`69bed88c55cf154f2769d9fb1047698a7add75ade351927e4643dc87681864e0` khớp artifact. Metadata có tên TURNSTILE_SECRET/admin/Cloudinary secrets, đúng DB/RateLimit/TTL; public catalog4categories/1product và delivery1tỉnh Hà Nội/1phường. Không đọc secret values, DB riêng tư hoặc suy ra tổng stock/orders. Evidence `.security-review/staging-doc-audit-2026-10-17.json`.

## Snapshot remote chỉ đọc — 16/10/2026

Đây là **lịch sử**, không phải xác minh cloud mới của audit tài liệu. Production chưa được rà lại sau snapshot này; trạng thái staging mới hơn ở mục trên.

| Hạng mục | Production tại16/10 | Staging tại16/10,13:31 |
| --- | --- | --- |
| URL | [Production](https://lunara.minphuc2408.workers.dev) | [Staging](https://lunara-staging.minphuc2408.workers.dev) |
| Worker / D1 | lunara /lunara-db | lunara-staging /lunara-staging-db |
| Version |26d0811c-f2f0-4f7f-a0fa-7cb175035d06,deploy15/10 19:52 |e984d962-076f-492c-b2e3-c5cac5f52ec3 |
| Public catalog/coverage |4categories/8active products/2provinces |4categories/1active product/0provinces |
| Secrets/config đã thấy |Admin secret names; thiếu Cloudinary vars/secrets và TURNSTILE_SECRET tại snapshot |Admin/Cloudinary names; chưa có TURNSTILE_SECRET tại snapshot |
| Static headers /bot config |Chưa có CSP/RateLimit/TTL mới; robots trả SPA |Có CSP/noindex/key staging/RateLimit/TTL24/scheduled handler |

Source Wrangler hiện khai báo Cloudinary public vars, RateLimit và Cron cho cả hai target; điều đó không chứng minh production đã nhận cấu hình mới. Secret staging đã xuất hiện trong metadata17/10, nên kết luận thiếu secret16/10 không còn mô tả staging ghi nhận gần nhất.

| Mốc migration/deploy lịch sử | Bằng chứng cần giữ |
| --- | --- |
|15/10,production Phase6 |0001/seed remote, backup export mở offline integrity/FK/counts PASS; API live7/7 và public browser PASS.3đơnSMOKE đã cleanup, tồn24variant về baseline/FK sạch tại thời điểm đó. [Phase6](pipeline/PHASE_6_DEPLOY.md) giữ checklist và kết quả này |
|16/10,category images |0002 +4URL áp local/staging; version75fcbb54-5528-4cc1-b101-22fdc7a91a40. API4URL/ảnh4khớpSHA256/browser10ca; login/lookup503khi thiếu secret tại đúng mốc |
|16/10,19:21,administrative catalog |0003 áp local/staging,12bảng/1tỉnh126phường Hà Nội/HCM0/FK sạch; version27c3d24e-f3df-42e1-8d18-8b8299427062. Aggregate sau migration:zones0/products1/variants3/stock30/orders0/items0/history0; publicoptions trống đúng mốc. Không full seed hoặc tạo phí. Full remote backup không xuất do automatic approval review từ chối khả năng sao chép dữ liệu khách; chỉ đối chiếu aggregate/FK |

Counts nghiệp vụ lịch sử không phải dữ liệu hiện tại. Không suy từ coverage1phường sang tổng zone, orders hay stock. Không chạy lại seed hoặc backup chỉ để cập nhật tài liệu.

## Việc còn cần chủ shop

| Việc | Điều kiện hoàn tất |
| --- | --- |
| Dữ liệu mở bán thật |Catalog/ảnh/giá/SKU/tồn và zone/phí/khung giờ thật được owner duyệt; tắt dữ liệu mẫu và kiểm quote |
| Bàn giao quota |Owner xác nhận xem được Workers Requests/Errors/CPU và D1 rows/storage; [OPERATIONS](OPERATIONS.md#8-kiểm-hạn-mức-hằng-ngày-và-sự-cố) |
| Turnstile/provider |Kiểm challenge thật/action/hostname của checkout,lookup,login trên từng môi trường; metadata secret name/token-sai403 không thay success flow |
| Cloudinary/Cron/cloud limits |Nghiệm thu upload thật/preset, Cron tick/expiry và CPU/quota trong đúng cửa sổ được phép; source/scheduled binding không chứng minh thực thi |
| Production mới |Đối chiếu migrations/config/secrets/rollback trước khi xin deploy; staging không tự cấp quyền migrate/deploy production |
| Nội dung shop |Xác minh địa chỉ/maps,pháp nhân/MST,hotline,story/giờ mở cửa,policy và Zalo; nội dung minh họa trong source không phải xác nhận pháp lý |
| Staging checkout |Public17/10 đã có1phường; vẫn chưa nghiệm thu end-to-end checkout/admin với dữ liệu/challenge thật |
| Domain/WAF |Tùy chọn, quyết định riêng về hạ tầng và chi phí |

## Tài liệu chuẩn

[Kiến trúc](../PROJECT_GUIDE.md) · [Stack](TECH_STACK.md) · [API](pipeline/API_CONTRACT.md) · [Database](DATABASE_DESIGN.md) · [Entity](FRONTEND_ENTITIES.md) · [Staging](STAGING.md) · [Operations](OPERATIONS.md) · [Audit tài liệu](DOCUMENTATION_AUDIT.md).
