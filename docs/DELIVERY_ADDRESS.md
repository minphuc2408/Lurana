# Địa chỉ và phạm vi giao hàng Hà Nội

Cập nhật 17/10/2026. Tài liệu mô tả nguồn danh mục hành chính và cách cấu hình phạm vi/phí giao hàng; dữ liệu runtime lấy từ D1. Trạng thái migration, coverage live và nghiệm thu theo môi trường ở [PROJECT_STATUS](PROJECT_STATUS.md); thao tác môi trường theo [STAGING](STAGING.md).

## Nguồn và giấy phép

- Nguồn: Open Admin Data, [Vietnam Administrative Divisions](https://github.com/open-admin-data/vietnam-administrative-divisions), giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Snapshot: [54cdb052284b02e75dfaa44089ca383aa12c57db](https://github.com/open-admin-data/vietnam-administrative-divisions/tree/54cdb052284b02e75dfaa44089ca383aa12c57db), trích ngày 16/10/2026 từ `data/all-province.json` và `data/all-ward.json`.
- Chỉ lấy Hà Nội, mã `01`, đủ **126 phường/xã** theo `parent.id`. Giữ mã và tên tiếng Việt, bỏ tọa độ/metadata; tên tỉnh chuẩn hóa thành `Thành phố Hà Nội` để tương thích cấu hình phí hiện hữu. Không nhập Hồ Chí Minh (`79`). Nguồn không phân loại tên từng đơn vị; không tự suy đoán tiền tố hoặc thêm quận/huyện.
- [delivery-divisions.json](../src/features/cart/data/delivery-divisions.json) lưu bản trích và attribution để đối chiếu; frontend runtime không import JSON này. Dữ liệu dùng thật lấy từ D1/API, không gọi GitHub trong checkout.

## Hai bảng danh mục và bảng phí riêng

[0003_hanoi_administrative_areas.sql](../migrations/0003_hanoi_administrative_areas.sql) là migration bổ sung theo yêu cầu owner, gồm hai CREATE và hai INSERT, không sửa/xóa dữ liệu nghiệp vụ hoặc migration 0001/0002:

| Bảng | Dữ liệu và ràng buộc |
| --- | --- |
| `administrative_provinces` | `code` TEXT PK hai ký tự; `name` unique, không rỗng |
| `administrative_wards` | `code` TEXT PK năm ký tự; `province_code` FK RESTRICT; `name` không rỗng, unique trong tỉnh |
| `delivery_zones` có sẵn | Cấu hình phí/ngưỡng miễn phí/ETA/active cho từng phường; giữ schema và các dòng lịch sử |

0003 bổ sung hai bảng vào schema nghiệp vụ; cấu trúc đầy đủ ở [DATABASE_DESIGN](DATABASE_DESIGN.md). Mã hành chính chỉ dùng cho danh mục; zone/order contract vẫn lưu tên. Service kiểm danh mục trước khi tạo/bật zone, không thêm FK vào snapshot đơn. Thêm tỉnh mới phải nhập danh mục có kiểm chứng trước, rồi cấu hình từng zone; không bật phạm vi giao bằng việc nhập danh mục.

Tên phường chuẩn không có tiền tố. Server chấp nhận alias `Phường ` / `Xã ` / `Đặc khu ` của dòng cũ, chuẩn hóa khi lưu mới và chặn trùng alias bằng CONFLICT. Dòng `ward_name=''` hoặc tỉnh/phường ngoài danh mục được giữ nguyên; có thể tắt dòng cũ nhưng không tạo/bật phạm vi không hợp lệ.

## Admin và checkout

Admin `/admin/delivery-zones` dùng shared Combobox: mở để chọn hoặc tìm không dấu (gồm đ/d); chọn thành phố xong chọn phường, nhập phí và lưu. Đổi thành phố xóa phường. Không lưu được lựa chọn chưa thuộc danh mục. GET admin trả cả zones hiện hữu và danh mục Hà Nội126; cookie auth và same-origin JSON write giữ nguyên.

Public `GET /api/delivery/options` chỉ JOIN các zone **đang active và khớp danh mục**, trả tên phường chuẩn. Checkout lấy toàn bộ lựa chọn từ response này:

- Có zone Hoàn Kiếm active → hiện Hà Nội và Hoàn Kiếm.
- Cửa Nam chưa cấu hình hoặc đã tắt → không hiện Cửa Nam.
- Chưa cấu hình phường nào → `provinces: []`, UI báo chưa có khu vực giao được cấu hình.
- Quote và tạo đơn kiểm cùng quy tắc trên server. Phường chưa được bật trả422 `NO_DELIVERY_ZONE`; **không fallback phí mặc định tỉnh**, kể cả có dòng legacy `ward_name=''`.

Parent fields `default_fee` và `free_from_amount` trong public options vẫn có mặt với giá trị null để giữ shape tương thích. Ngưỡng miễn phí theo từng zone và phụ phí phương thức do server tính; [API_CONTRACT](pipeline/API_CONTRACT.md) mô tả payload/response.

Combobox tách chữ tìm khỏi giá trị đã chọn; hỗ trợ chuột, Tab/Enter/Escape và thông báo không kết quả. `useQuoteCart` chỉ quote khi có hàng và lựa chọn thuộc options; debounce350ms, hủy request đọc cũ và bỏ response lỗi thời. Gõ tìm kiếm/liên hệ/địa chỉ/ghi chú không gọi quote. Không polling hoặc tự retry lỗi. Layout/payment/consent theo [CHECKOUT_UI](CHECKOUT_UI.md).

## Cấu hình và kiểm chứng

Sau khi áp migration theo runbook môi trường, người vận hành tạo hoặc bật từng zone với phí đã chốt trong admin. Không chạy full seed, tạo phí mẫu hoặc tự bật cả 126 phường. Kiểm FK, số đơn vị trong danh mục và public options sau thay đổi; backup theo [OPERATIONS](OPERATIONS.md). Import danh mục không tự coi toàn Hà Nội là khu vực phục vụ.

[Runner admin](../scripts/check-ui-delivery-admin.mjs) dùng Worker + SQLite tổng hợp/cookie test để kiểm tìm/chọn không dấu, tạo zone → checkout hiện, tắt → ẩn và direct quote trả 422, EN/VI và responsive. [Runner địa chỉ](../scripts/check-ui-delivery.mjs) và [runner checkout](../scripts/check-ui-cart-checkout.mjs) kiểm lựa chọn active-only và debounce. Đây là bằng chứng local cô lập, không nghiệm thu CRUD bằng tài khoản thật hoặc dữ liệu remote; kết quả ở [PROJECT_STATUS](PROJECT_STATUS.md).
