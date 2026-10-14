# Entity đang có trong frontend Lunara

**Cập nhật:** 14/10/2026 · **UI:** demo/fixtures · **Backend:** health local + schema D1 local (Phase 1) · **Commerce API:** PLANNED. [Hiện trạng](PROJECT_STATUS.md) · [Stack](TECH_STACK.md) · [Schema canonical](../migrations/0001_mvp.sql). UI **Lunara**, repo **Lurana**.

**Giữ hiện tại:** English mặc định/fallback, EN/VI JSON, PHP/₱, Asia/Manila, cart in-memory. **Đích pipeline:** COD guest + admin server, VND/giờ Việt Nam ở Phase 5. Phase 1 chốt 10 bảng DDL v2, có `delivery_zones`, idempotency và các CHECK/unique; `custom_requests` deferred. Schema/seed/verifier ở D1 local không tự nối các entity FE vào API; các ánh xạ dưới đây vẫn là việc cần triển khai. [Nghiệm thu database](pipeline/PHASE_1_DATABASE.md).

| Entity/khái niệm | Field hiện có ở FE | Source | Ánh xạ MVP D1 / mở rộng |
| --- | --- | --- | --- |
| AuthUser | `name`, `email`, `role: user/admin` | [auth.types.ts](../src/features/auth/auth.types.ts) | Hiện fixture/sessionStorage; Phase 4–5 admin secret + cookie JWT; `users` dành cho auth khách sau MVP |
| Profile | `firstName`, `lastName`, `email`, `phone`, `address`, `bio` | [demo-profile.ts](../src/features/profile/data/demo-profile.ts) | Sau MVP: `users.full_name/phone/avatar_url`, `user_addresses`; bio chưa có trong SQL |
| Customer trong admin | `id`, `name`, `email`, `phone`, `orders`, `spent`, `lastOrder`, `joined`, `status`, `vip` | [admin-customers.data.ts](../src/features/admin/data/admin-customers.data.ts) | Ngoài pipeline MVP; guest lưu contact snapshot trong orders, customer/VIP làm sau |
| Product | `id`, `name`, `name_en`, `name_vi`, alias `name_vn`, `price`, `category`, `image`, `tag`, `rating`, `reviews` | [shop.types.ts](../src/features/shop/shop.types.ts), [shop.data.ts](../src/features/shop/data/shop.data.ts) | Dùng `name_en/name_vi`; category FK, ảnh/variant riêng; ratings/reviews fixture, ẩn ở MVP khi nối API |
| ProductCategory | Bouquets, Arrangements, Dried Flowers, Gift Sets | [shop.data.ts](../src/features/shop/data/shop.data.ts) | ID/code ổn định, tên song ngữ; `All` chỉ là bộ lọc UI |
| Cart / CartItem | Cart là danh sách; line: `id`, `productId`, các field tên, `price`, `qty`, `image`, `size` | [cart.types.ts](../src/features/cart/cart.types.ts), [useCartState.ts](../src/features/cart/hooks/useCartState.ts) | MVP dự kiến localStorage cho guest; line theo variant ID + quantity; server tính lại giá; chưa cần bảng cart |
| ProductSize / variant | Small, Medium, Large; line ID hiện là `productId:size` | [cart.types.ts](../src/features/cart/cart.types.ts) | `product_variants`: ID/SKU/giá/tồn; map Small/Medium/Large → S/M/L; STANDARD/DELUXE chỉ thêm khi có sản phẩm |
| DeliveryOption | `id`, `label`, `sublabel`, `price`; standard/express/same-day | [cart.data.ts](../src/features/cart/data/cart.data.ts) | Map `delivery_method_code` + `delivery_zones` canonical + config surcharge; ưu tiên phường, fallback tỉnh; snapshot method/fee vào đơn; cutoff/khu vực thật cần chủ shop chốt |
| Coupon | Rule `lunara10`, giảm `floor(subtotal*0.1)` | [useCheckout.ts](../src/features/cart/hooks/useCheckout.ts), [cart.service.ts](../src/features/cart/cart.service.ts) | SQL chỉ có coupon_code/discount_total; rule demo chưa thành coupon thật; mở rộng sau |
| Checkout contact/address | `firstName`, `lastName`, `email`, `phone`, `address`, `city`, `notes` | [cart.types.ts](../src/features/cart/cart.types.ts) | Snapshot trực tiếp trong `orders`: tách sender/recipient, thêm province/ward, ngày/khung giờ giao và thiệp |
| Order của khách | `id`, `date`, `status`, `items[]`, `address`, `delivery`, `rating`, `tracking[]`, `trackStep` | [my-orders.data.ts](../src/features/orders/data/my-orders.data.ts) | Một orders model chung cho customer/admin; timestamp và lịch sử status thay chuỗi ngày/trackStep |
| Order của admin | `id`, `customer`, `email`, `items` dạng chuỗi, `total`, `date`, `payment`, `status` | [admin-orders.data.ts](../src/features/orders/data/admin-orders.data.ts) | `orders` + `order_items`; user_id nullable cho guest; COD tách khỏi UNPAID/PAID |
| OrderItem | `name`, tên snapshot song ngữ, `image`, `price`, `qty` | [my-orders.data.ts](../src/features/orders/data/my-orders.data.ts) | FK product/variant nullable + snapshot tên/SKU/size/giá; giá lịch sử không đổi theo catalog |
| TrackingStep | Chuỗi label, thứ tự, `trackStep` | [my-orders.data.ts](../src/features/orders/data/my-orders.data.ts) | `order_status_history`: status, timestamp, actor_id/actor_label, note; actor_label phân loại SYSTEM/CUSTOMER/ADMIN; nhãn UI không lưu làm business code |
| CustomRequest của khách | `occasion`, `colors[]`, `flowers[]`, `size`, `budget`, `date`, `recipient`, `message`, `name`, `email`, `phone` | [custom-order.types.ts](../src/features/custom-order/custom-order.types.ts) | Ngoài 10 bảng MVP; [deferred/0002](sql/deferred/0002_custom_requests.sql) chưa áp dụng; wizard chưa tạo record |
| CustomRequest của admin | `id`, `customer`, `date`, `occasion`, `budget` string, `flowers` string, `notes`, `status` | [admin-requests.data.ts](../src/features/custom-order/data/admin-requests.data.ts) | Deferred; khi triển khai sẽ dùng cùng request API với khách, thay dataset riêng |
| Occasion / ColorPalette / FlowerType / ArrangementSize | Occasion strings; palette `{name, colors[]}`; flower strings; size `{name, desc, price}` | [custom-order.data.ts](../src/features/custom-order/data/custom-order.data.ts) | Lookup có code + nhãn song ngữ; size đặt riêng Petite/Classic/Grande/Luxe khác variant Small/Medium/Large |
| StockItem / Supplier | `id`, tên song ngữ, `category`, `price`, `stock`, `threshold`, `image`, `supplier`, `lastRestocked` | [inventory.types.ts](../src/features/inventory/inventory.types.ts), [inventory-metadata.ts](../src/features/inventory/data/inventory-metadata.ts) | MVP dùng `product_variants.stock_quantity/low_stock_threshold`; supplier và movement ledger mở rộng sau |
| Wishlist | Shop: mảng liked ID cục bộ; Profile: 2 product fixture | [useProducts.ts](../src/features/shop/hooks/useProducts.ts), [profile.service.ts](../src/features/profile/profile.service.ts) | Chưa hợp nhất/persist; ẩn ở pipeline MVP, localStorage/server wishlist làm sau |
| Review / Testimonial | Product: rating/reviews count; order: rating; landing: name/review/review_vi/stars | [home.data.ts](../src/features/landing/data/home.data.ts) | Review thực có user/product/order item FK, rating/comment/moderation; testimonial tuyển chọn là CMS riêng hoặc review được chọn |
| StoreSettings | `name`, `email`, `phone`, `address`, `currency`, `timezone` | [settings.data.ts](../src/features/admin/data/settings.data.ts) | Một store record; settings save hiện không đổi cấu hình toàn app |
| NotificationPreference | newOrder, lowStock, newRequest, emailDigest | [settings.data.ts](../src/features/admin/data/settings.data.ts) | Theo admin user; tách khỏi thông tin cửa hàng |
| Dashboard projections | KPI, salesData month/revenue/orders, category %, top product sales/revenue/trend, recent orders | [admin-dashboard.data.ts](../src/features/admin/data/admin-dashboard.data.ts), [dashboard-stats.ts](../src/features/admin/data/dashboard-stats.ts) | Query/aggregate từ orders/products; không tạo bảng cho mỗi card/chart/period |
| UI preference | Ngôn ngữ EN/VI trong localStorage | [language.ts](../src/shared/i18n/language.ts) | SQL có `users.preferred_locale`; giữ English fallback và preference guest; không cần bảng translations UI |

## Những điểm chưa nhất quán cần sửa khi nối backend

1. User/profile/customer fixtures chưa có cùng ID và dữ liệu chung. Profile edit chưa cập nhật AuthProvider.
2. Orders khách/admin/profile/dashboard là các snapshot độc lập; API phải trả cùng một hệ thống đơn, khác projection/permission.
3. Request wizard không tạo record cho AdminRequests; budget hiện có trong model nhưng chưa có ô nhập.
4. Stock edit chỉ ở state của trang, không cập nhật Shop hoặc Cart. Checkout chưa giữ/trừ tồn.
5. Price/total/budget có nơi numeric, có nơi chứa `₱` và dấu phẩy. Không đưa các chuỗi display này vào cột money.
6. Ngày phần lớn là chuỗi `Mar 17, 2026` hoặc `Jan 2025`; dùng timestamp/date có format tại ranh giới UI.
7. Category/status/payment đang dùng English label làm code. Backend nên dùng code ổn định; Việt/English chỉ là nhãn.
8. Cart là demo in-memory, reload reset. Ngôn ngữ là preference riêng, không đổi giá, currency, timezone hoặc tên khách.
9. Schema dùng VND/địa chỉ tỉnh-phường và status uppercase; FE còn PHP/Asia/Manila/English labels. Cần adapter và chuyển thị trường riêng trước khi nối API.

Xem [DATABASE_DESIGN.md](DATABASE_DESIGN.md) để tra canonical, khác biệt v1/v2 và giới hạn schema; [pipeline](pipeline/README.md) cho scope/phase. Seed local có 4 categories, 8 products, 24 variants, 8 images, 4 zones; chưa đồng bộ fixture frontend. Cloudflare/D1 remote đã được chủ dự án chuẩn bị; Phase 1 chỉ local. Không coi demo success, role client hoặc state cục bộ là nghiệp vụ bền vững.
