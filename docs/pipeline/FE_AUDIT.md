# Frontend audit — dữ liệu, fixture và backup

Đối chiếu source **17/10/2026**. File này giữ ranh giới dữ liệu/frontend và cách nhận diện backup demo; checklist/kết quả Phase 5 ở [PHASE_5_FRONTEND](PHASE_5_FRONTEND.md#kết-quả-10-kịch-bản--15102026), checks/deployment hiện hành ở [PROJECT_STATUS](../PROJECT_STATUS.md).

## Dữ liệu và quyền

| Phần | Ranh giới hiện hành |
| --- | --- |
| Catalog | CatalogProvider/Shop service dùng API D1, không fixture fallback. Product detail nạp theo slug và nhớ DTO trong memory cho shared cart |
| Cart storage | `lunara.cart.v1` chỉ `{version:1,lines:[{variantId,quantity}]}`, validate Zod. Slug/size/giá/ảnh là snapshot memory, không lưu cùng cart |
| Checkout | `/cart` → `/checkout` dùng CheckoutFlowProvider giữ draft/intent trong memory; rời nhóm route/reload xóa. Quote/order quyết định giá/phí/tổng, confirmation chỉ từ API |
| Tra đơn | Mã/SĐT/token/kết quả chỉ memory; mã có thể được điền qua `?order=`, không đưa SĐT lên URL. Hành vi và giới hạn privacy đầy đủ ở [ORDER_TRACKING](../ORDER_TRACKING.md) |
| Admin session | Cookie HttpOnly do API cấp; không lưu password/JWT/session trong browser storage. Client guard không thay authorization server |
| Stock write | Delta chưa rõ kết quả được xóa/khóa đến GET đối chiếu thành công; không tự retry ghi. [Quy trình vận hành](../OPERATIONS.md) |
| Locale | Saved preference → browser EN/VI → EN fallback; đổi locale không dịch dữ liệu khách hoặc đổi VND/Asia/Ho_Chi_Minh |

Không persist người gửi/người nhận/SĐT/email/địa chỉ, nội dung thiệp/đơn hoặc idempotency intent trong browser storage. Component/page không gọi fetch trực tiếp; service đi qua API client chung với timeout/mapping lỗi. Quote chỉ đọc, không tạo đơn hoặc giữ tồn.

## Source deferred và dữ liệu mẫu

Customer auth/profile/orders/wishlist/custom request và admin customers/settings/notifications còn source/fixture nhưng không có API vận hành tương ứng. Routes/menu giữ ẩn hoặc trang Sắp ra mắt; `VITE_ENABLE_CUSTOMER_AUTH` mặc định false và customer API-ready gate false ngăn việc bật fixture qua env. Admin cookie auth là luồng đã tích hợp, không dùng sessionStorage demo.

Scan nghiệm thu Phase 5 ngày 15/10: 74 file runtime active sạch; 40 hits legacy toàn src thuộc fixture/code/JSON deferred (PHP/₱/Asia/Manila). Đây là phạm vi scan lịch sử, không phải số hiện tại. `name_vn` là alias tương thích cho tên tiếng Việt, không xóa chỉ vì xuất hiện trong scan.

Catalog D1 seed cũng là dữ liệu mẫu, tách biệt với fixture frontend. Ảnh sản phẩm/mô tả/giá/tồn do DB sở hữu; hero/category/story theo tài liệu thiết kế. Không phục hồi fixture vào luồng MVP hoặc nhập demo accounts từ backup vào D1.

## Backup local trước khi sửa

Thư mục: `temp/fe-demo-2026-10-14-1791974270315/`, giữ local/ignored, không đưa vào Git.

| File | Nội dung |
| --- | --- |
| `frontend-source.zip` | Toàn bộ source frontend/config public ở commit `c33104f801ee07d6932b4c35a12bbd0c97e1ba0b`, đủ phục hồi thiết kế và fixture ban đầu |
| `frontend-data.json` | Snapshot 8 sản phẩm PHP và source của 18 file fixture, gồm cart/auth/profile/orders/admin/custom request/inventory/landing |
| `demo-images.zip` | 15 ảnh gốc frontend đã tải xuống, các kích thước khác nhau được giữ riêng |
| `manifest.json` | Ánh xạ URL → tên ảnh, file sử dụng ảnh, SHA-256 và số byte; 15/15 tải thành công |
| `README.txt` | Cách nhận diện backup; không nhập demo accounts/fixture vào D1 |

Backup trên là bản ghi vị trí/manifest lịch sử 14/10/2026; không khẳng định artifact còn tồn tại trên mọi máy. Giữ local/ignored, chỉ dùng phục hồi tham khảo thiết kế; không ghi đè source hiện hành hoặc dữ liệu vận hành. SHA-256 15/15 ảnh và 18 file fixture đã được kiểm tại thời điểm tạo.

## Giới hạn bằng chứng

Nghiệm thu Phase 5 chạy Edge/CDP với workerd D1 `persist:false`, `remoteBindings:false` và credentials tổng hợp; đối chiếu SQL readonly cho thấy DB persisted không đổi. Bridge Node dùng shim timingSafeEqual; kiểm auth native workerd riêng ở [PHASE_4_ADMIN](PHASE_4_ADMIN.md). Mock API/challenge hoặc receipt browser không thay xác nhận provider, giao dịch cloud, CPU/quota hay trạng thái private D1 hiện tại.
