# Ảnh danh mục

How-to cho maintainer quản lý bốn ảnh minh họa danh mục được owner phê duyệt ngày 16/10/2026: vị trí asset, cập nhật URL, tương thích và rollback. Migration/triển khai từng môi trường và kết quả nghiệm thu xem [PROJECT_STATUS](../PROJECT_STATUS.md).

## Dữ liệu và nơi lưu

Bốn mã hiện hữu: bouquets, arrangements, dried-flowers, gift-sets. Không thêm/đổi tên category, không chạy full seed. Ảnh AI chỉ minh họa collection, không là ảnh mô tả một sản phẩm đang bán. Dãy thẻ danh mục Home và link All Flowers đã gỡ 18/10/2026 theo yêu cầu owner; không xóa dữ liệu category/ảnh.

- File WebP 256 px: public/images/categories/<code>-v1.webp; 10–14 KB/tấm, revisioned filename.
- DB chỉ lưu đường dẫn cùng origin `/images/categories/<code>-v1.webp` trong categories.image_url; không lưu bytes/base 64.
- Hero tiếp tục import Vite hashed asset riêng; ảnh category dùng public vì URL cần cố định trong DB.
- [Nguồn và ghi nhận asset](../../ATTRIBUTIONS.md); [contract](../reference/API_CONTRACT.md).

## Schema và cách áp

[0002_category_images.sql](../../migrations/0002_category_images.sql) thêm cột `categories.image_url` nullable, CHECK độ dài 1..2048 nếu có giá trị; không thêm bảng. Giữ nguyên 0001 đã áp dụng. Chuỗi migration hiện hành và các bảng bổ sung ở [DATABASE_DESIGN](../reference/DATABASE_DESIGN.md); không áp migration custom requests trong `docs/sql/deferred/`.

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

GET /api/categories giữ image_url nullable, query active/sort/cache 30 s và DTO tương thích field vắng/null. UI Home hiện không render dãy thẻ ảnh danh mục hoặc All Flowers; navigation và bộ lọc Shop vẫn dùng category code/name. Giữ các asset/URL/D1 hiện có; không chạy migration hoặc cập nhật dữ liệu để gỡ khối UI. Source chưa có admin CRUD/upload category.

Worker đọc cột ảnh cần 0002 trước; DB có cột mới vẫn tương thích Worker cũ. Khi triển khai toàn bộ source hiện tại, phải áp đủ chuỗi migration được liệt kê trong [STAGING](../operations/STAGING.md), không chỉ 0002. `db:verify` so migration chain và chạy thử phá hủy trên D1 `persist:false`; không đổi dữ liệu đã seed.

## Rollback và thay ảnh

Trước khi đổi URL, backup riêng categories của đúng môi trường và giữ bản xuất local/ignored. Muốn ẩn ảnh: cập nhật image_url=NULL cho 4 code, không xóa category hoặc drop column. Nếu cần phục hồi URL trước đó, dùng backup để lấy giá trị rồi UPDATE cột ảnh; không import cả CREATE TABLE vào DB hiện hành. Không sửa 0001 hoặc rollback DDL đã áp bằng cách xóa lịch sử migration.

Ảnh thay mới dùng filename-v2.webp và cập nhật URL sau khi file có trên đúng origin; tránh overwrite-v1 làm cache không đồng nhất. Không cần thêm migration cho mỗi lần thay ảnh.

## Kiểm chứng ảnh

Sau cập nhật, kiểm API trả đúng bốn URL, file trên đúng origin trả `image/webp` và checksum khớp asset; thumbnail/fallback/link category trên Home là bằng chứng của UI cũ trước 18/10, không còn là kiểm bắt buộc cho Home hiện tại. Bằng chứng staging 16/10/2026 ở [archive](../archive/VERIFICATION_HISTORY.md#snapshot-remote-cũ-ngày-1617102026); trạng thái mới ở [PROJECT_STATUS](../PROJECT_STATUS.md); không dùng snapshot số sản phẩm/đơn ở lần đó làm số liệu hiện tại.
