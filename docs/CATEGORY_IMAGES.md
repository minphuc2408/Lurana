# Ảnh danh mục — 16/10/2026

Owner yêu cầu tạo ảnh và gán DB local + staging; sau khi xem preview/dry-run, owner đã xác nhận deploy staging và giữ Turnstile fail-closed. Production nằm ngoài phạm vi.

## Dữ liệu và nơi lưu

Bốn mã hiện hữu: bouquets, arrangements, dried-flowers, gift-sets. Không thêm/đổi tên category, không chạy full seed. Ảnh AI chỉ minh họa collection, không là ảnh mô tả một sản phẩm đang bán. All Flowers là link UI, không tạo record DB/ảnh riêng.

- File WebP 256px: public/images/categories/<code>-v1.webp; 10–14 KB/tấm, revisioned filename.
- DB chỉ lưu đường dẫn cùng origin `/images/categories/<code>-v1.webp` trong categories.image_url; không lưu bytes/base64.
- Hero tiếp tục import Vite hashed asset riêng; ảnh category dùng public vì URL cần cố định trong DB.
- [Nguồn và prompt đầy đủ](../ATTRIBUTIONS.md); [contract](pipeline/API_CONTRACT.md).

## Schema và cách áp

0001_mvp.sql đã áp remote được giữ nguyên. Migration additive mới0002_category_images.sql thêm một cột nullable, CHECK độ dài1..2048 nếu có giá trị; vẫn 10 bảng nghiệp vụ. Không áp deferred/0002_custom_requests.sql.

```powershell
# Local
npm run db:migrate:local
node node_modules/wrangler/bin/wrangler.js d1 execute lunara-db --local --file docs/sql/CATEGORY_IMAGES.sql
npm run db:verify

# Staging: chỉ chạy với authorization, guard kiểm Worker + DB UUID trước migration
node scripts/staging.mjs migrate
node node_modules/wrangler/bin/wrangler.js d1 execute lunara-staging-db --remote --env staging --config wrangler.jsonc --file docs/sql/CATEGORY_IMAGES.sql
```

Data script là một UPDATE atomic theo đúng 4 code, chạy lại cho cùng kết quả; không INSERT/REPLACE hoặc đụng products/variants/orders. Đường dẫn chỉ tải được khi static asset và Worker/API mới đã deploy. Không xem DB update là nghiệm thu ảnh live.

## API/UI và tương thích

GET /api/categories thêm image_url nullable, cùng query active/sort/cache30s. Client mới chấp nhận field vắng trên Worker cũ và null; khi không có ảnh vẫn giữ khung tròn. Ảnh có loading lazy, width/height256, alt rỗng/aria-hidden do tên category đã nằm cạnh ảnh. Dùng ImageWithFallback nếu URL lỗi; click giữ category code trên Shop query. Không có admin CRUD/upload category trong lượt này.

Deploy Worker mới cần0002 trước; DB mới vẫn tương thích Worker cũ. Vì production chưa migrate, không deploy Worker mới vào production cho tới khi migration được owner cho phép riêng. Tất cả fixture SQLite/workerd hiện áp0001+0002 trước seed; db:verify so migration chain và chạy thử phá hủy trên D1 persist:false.

## Rollback và thay ảnh

Backup riêng categories local/staging ở .security-review ignored được tạo trước migration. Muốn ẩn ảnh: cập nhật image_url=NULL cho 4 code, không xóa category hoặc drop column. Nếu cần phục hồi URL trước đó, dùng backup để lấy giá trị rồi UPDATE cột ảnh; không import cả CREATE TABLE vào DB hiện hành. Không sửa 0001 hoặc rollback DDL đã áp bằng cách xóa lịch sử migration.

Ảnh thay mới dùng filename-v2.webp và cập nhật URL sau khi file có trên đúng origin; tránh overwrite-v1 làm cache không đồng nhất. Không cần thêm migration cho mỗi lần thay ảnh.

## Staging đã nghiệm thu ảnh category — 16/10/2026

Owner đã xác nhận deploy staging và giữ Turnstile fail-closed. Worker version `75fcbb54-5528-4cc1-b101-22fdc7a91a40` đã active tại https://lunara-staging.minphuc2408.workers.dev. API trả đủ 4 image_url; cả 4 ảnh trả HTTP 200 với Content-Type image/webp và SHA-256 khớp file local. Browser live EN/VI ở 320/390/768/1024/1440px đạt 10/10 trường hợp: tải đủ 4 thumbnail 256px, không tràn ngang, liên kết danh mục hoạt động và không có exception. Staging vẫn có CSP/noindex.

DB local/staging đều có migration 0001 + 0002 và 4 URL ảnh. Staging được kiểm trực tiếp: 4 danh mục, 1 sản phẩm, 3 biến thể, 0 đơn hàng; FK sạch. Backup categories trước thay đổi của cả hai môi trường đã mở lại offline và có đủ 4 mã. Production không được migrate, deploy hoặc ghi dữ liệu trong lượt này. Không commit/push.

Chưa có TURNSTILE_SECRET: login và lookup live trả 503 TURNSTILE_NOT_CONFIGURED khi kiểm bằng input synthetic; không dùng mật khẩu thật hoặc tạo đơn. Checkout/login/lookup chưa thể nghiệm thu provider thành công cho tới khi cấu hình secret. Cron, upload thật và quota cloud vẫn chưa nghiệm thu. Local: 172 tests, architecture 215, schema 13/13, smoke 40/40, build và staging dry-run đều đạt. Full UI checker còn lỗi quote-before-zone cũ; không coi toàn bộ suite này đã đạt. Evidence trong .security-review ignored.
