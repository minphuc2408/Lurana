# Entity đang có trong frontend Lunara

Đối chiếu source ngày 13/10/2026, sau refactor và i18n. Đây là **mô hình UI/fixture**, chưa phải schema database và chưa có backend. Tên thương hiệu trên UI là Lunara; repository là Lurana.

| Entity/khái niệm | Field hiện có ở FE | Source | Xử lý khi làm DB |
| --- | --- | --- | --- |
| AuthUser | `name`, `email`, `role: user/admin` | [auth.types.ts](../src/features/auth/auth.types.ts) | Thêm ID ổn định, email unique, trạng thái account; credential do backend quản lý |
| Profile | `firstName`, `lastName`, `email`, `phone`, `address`, `bio` | [demo-profile.ts](../src/features/profile/data/demo-profile.ts) | Liên kết user; bỏ email trùng với users, tách address thành bảng |
| Customer trong admin | `id`, `name`, `email`, `phone`, `orders`, `spent`, `lastOrder`, `joined`, `status`, `vip` | [admin-customers.data.ts](../src/features/admin/data/admin-customers.data.ts) | Là user/profile + số liệu tổng hợp; không tạo bản sao customer độc lập |
| Product | `id`, `name`, `name_en`, `name_vi`, alias `name_vn`, `price`, `category`, `image`, `tag`, `rating`, `reviews` | [shop.types.ts](../src/features/shop/shop.types.ts), [shop.data.ts](../src/features/shop/data/shop.data.ts) | Dùng `name_en/name_vi`; category FK; ảnh và variant riêng; rating/reviews là aggregate |
| ProductCategory | Bouquets, Arrangements, Dried Flowers, Gift Sets | [shop.data.ts](../src/features/shop/data/shop.data.ts) | ID/code ổn định, tên song ngữ; `All` chỉ là bộ lọc UI |
| Cart / CartItem | Cart là danh sách; line: `id`, `productId`, các field tên, `price`, `qty`, `image`, `size` | [cart.types.ts](../src/features/cart/cart.types.ts), [useCartState.ts](../src/features/cart/hooks/useCartState.ts) | Cart ID/user hoặc guest session; item FK variant; unique cart+variant; không tin giá client |
| ProductSize / variant | Small, Medium, Large; line ID hiện là `productId:size` | [cart.types.ts](../src/features/cart/cart.types.ts) | Variant có ID/SKU/giá/tồn riêng; size là code, nhãn dịch tại UI |
| DeliveryOption | `id`, `label`, `sublabel`, `price`; standard/express/same-day | [cart.data.ts](../src/features/cart/data/cart.data.ts) | Method code + fee/rule; snapshot method/fee vào đơn; cutoff/địa bàn chưa được chốt |
| Coupon | Rule `lunara10`, giảm `floor(subtotal*0.1)` | [useCheckout.ts](../src/features/cart/hooks/useCheckout.ts), [cart.service.ts](../src/features/cart/cart.service.ts) | Nếu dùng thật: coupon và redemption; validity/usage tính server |
| Checkout contact/address | `firstName`, `lastName`, `email`, `phone`, `address`, `city`, `notes` | [cart.types.ts](../src/features/cart/cart.types.ts) | Snapshot người nhận/địa chỉ vào order delivery; không buộc người nhận là người mua |
| Order của khách | `id`, `date`, `status`, `items[]`, `address`, `delivery`, `rating`, `tracking[]`, `trackStep` | [my-orders.data.ts](../src/features/orders/data/my-orders.data.ts) | Một orders model chung cho customer/admin; timestamp và lịch sử status thay chuỗi ngày/trackStep |
| Order của admin | `id`, `customer`, `email`, `items` dạng chuỗi, `total`, `date`, `payment`, `status` | [admin-orders.data.ts](../src/features/orders/data/admin-orders.data.ts) | Customer FK; bỏ items string; payment method tách khỏi payment status |
| OrderItem | `name`, tên snapshot song ngữ, `image`, `price`, `qty` | [my-orders.data.ts](../src/features/orders/data/my-orders.data.ts) | FK product/variant nullable + snapshot tên/SKU/size/giá; giá lịch sử không đổi theo catalog |
| TrackingStep | Chuỗi label, thứ tự, `trackStep` | [my-orders.data.ts](../src/features/orders/data/my-orders.data.ts) | `order_status_history`: status, timestamp, actor, note; label không lưu làm business code |
| CustomRequest của khách | `occasion`, `colors[]`, `flowers[]`, `size`, `budget`, `date`, `recipient`, `message`, `name`, `email`, `phone` | [custom-order.types.ts](../src/features/custom-order/custom-order.types.ts) | ID, user nullable, contact snapshot, needed date, budget numeric, trạng thái và timestamps |
| CustomRequest của admin | `id`, `customer`, `date`, `occasion`, `budget` string, `flowers` string, `notes`, `status` | [admin-requests.data.ts](../src/features/custom-order/data/admin-requests.data.ts) | Gộp với request của khách; không giữ hai dataset độc lập; thêm assigned staff nếu cần vận hành |
| Occasion / ColorPalette / FlowerType / ArrangementSize | Occasion strings; palette `{name, colors[]}`; flower strings; size `{name, desc, price}` | [custom-order.data.ts](../src/features/custom-order/data/custom-order.data.ts) | Lookup có code + nhãn song ngữ; size đặt riêng Petite/Classic/Grande/Luxe khác variant Small/Medium/Large |
| StockItem / Supplier | `id`, tên song ngữ, `category`, `price`, `stock`, `threshold`, `image`, `supplier`, `lastRestocked` | [inventory.types.ts](../src/features/inventory/inventory.types.ts), [inventory-metadata.ts](../src/features/inventory/data/inventory-metadata.ts) | Bỏ bản sao product; inventory theo variant, movement ledger; supplier FK thay chuỗi |
| Wishlist | Shop: mảng liked ID cục bộ; Profile: 2 product fixture | [useProducts.ts](../src/features/shop/hooks/useProducts.ts), [profile.service.ts](../src/features/profile/profile.service.ts) | Một wishlist source theo user+product, unique; hiện hai demo chưa kết nối |
| Review / Testimonial | Product: rating/reviews count; order: rating; landing: name/review/review_vi/stars | [home.data.ts](../src/features/landing/data/home.data.ts) | Review thực có user/product/order item FK, rating/comment/moderation; testimonial tuyển chọn là CMS riêng hoặc review được chọn |
| StoreSettings | `name`, `email`, `phone`, `address`, `currency`, `timezone` | [settings.data.ts](../src/features/admin/data/settings.data.ts) | Một store record; settings save hiện không đổi cấu hình toàn app |
| NotificationPreference | newOrder, lowStock, newRequest, emailDigest | [settings.data.ts](../src/features/admin/data/settings.data.ts) | Theo admin user; tách khỏi thông tin cửa hàng |
| Dashboard projections | KPI, salesData month/revenue/orders, category %, top product sales/revenue/trend, recent orders | [admin-dashboard.data.ts](../src/features/admin/data/admin-dashboard.data.ts), [dashboard-stats.ts](../src/features/admin/data/dashboard-stats.ts) | Query/aggregate từ orders/products; không tạo bảng cho mỗi card/chart/period |
| UI preference | Ngôn ngữ EN/VI trong localStorage | [language.ts](../src/shared/i18n/language.ts) | Có thể thêm preferred_locale vào user profile; chưa cần bảng languages/translations cho UI JSON |

## Những điểm chưa nhất quán cần sửa khi nối backend

1. User/profile/customer fixtures chưa có cùng ID và dữ liệu chung. Profile edit chưa cập nhật AuthProvider.
2. Orders khách/admin/profile/dashboard là các snapshot độc lập; API phải trả cùng một hệ thống đơn, khác projection/permission.
3. Request wizard không tạo record cho AdminRequests; budget hiện có trong model nhưng chưa có ô nhập.
4. Stock edit chỉ ở state của trang, không cập nhật Shop hoặc Cart. Checkout chưa giữ/trừ tồn.
5. Price/total/budget có nơi numeric, có nơi chứa `₱` và dấu phẩy. Không đưa các chuỗi display này vào cột money.
6. Ngày phần lớn là chuỗi `Mar 17, 2026` hoặc `Jan 2025`; dùng timestamp/date có format tại ranh giới UI.
7. Category/status/payment đang dùng English label làm code. Backend nên dùng code ổn định; Việt/English chỉ là nhãn.
8. Cart là demo in-memory, reload reset. Ngôn ngữ là preference riêng, không đổi giá, currency, timezone hoặc tên khách.

Xem [DATABASE_DESIGN.md](DATABASE_DESIGN.md) để có cấu trúc bảng và thứ tự xây đề xuất. Báo cáo này không tự tạo database hoặc thay đổi business policy.
