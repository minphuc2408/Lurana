# Địa chỉ và phạm vi giao hàng Hà Nội

Reference cho backend/admin vận hành về coverage/provenance; nguồn đối chiếu 17/10, hợp nhất 19/10/2026. Runtime lấy dữ liệu D1. Trạng thái migration, coverage live và nghiệm thu theo môi trường ở [PROJECT_STATUS](../PROJECT_STATUS.md); thao tác môi trường theo [STAGING](../operations/STAGING.md).

## Nguồn và giấy phép

- Nguồn: Open Admin Data, [Vietnam Administrative Divisions](https://github.com/open-admin-data/vietnam-administrative-divisions), giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Snapshot: [54cdb052284b02e75dfaa44089ca383aa12c57db](https://github.com/open-admin-data/vietnam-administrative-divisions/tree/54cdb052284b02e75dfaa44089ca383aa12c57db), trích ngày 16/10/2026 từ `data/all-province.json` và `data/all-ward.json`.
- Chỉ lấy Hà Nội, mã `01`, đủ **126 phường/xã** theo `parent.id`. Giữ mã và tên tiếng Việt, bỏ tọa độ/metadata; tên tỉnh chuẩn hóa thành `Thành phố Hà Nội` để tương thích cấu hình phí hiện hữu. Không nhập Hồ Chí Minh (`79`). Nguồn không phân loại tên từng đơn vị; không tự suy đoán tiền tố hoặc thêm quận/huyện.
- [delivery-divisions.json](../../src/features/cart/data/delivery-divisions.json) lưu bản trích và attribution để đối chiếu; frontend runtime không import JSON này. Dữ liệu dùng thật lấy từ D1/API, không gọi GitHub trong checkout.

## Hai bảng danh mục và bảng phí riêng

[0003_hanoi_administrative_areas.sql](../../migrations/0003_hanoi_administrative_areas.sql) thêm administrative_provinces/administrative_wards, tách danh mục khỏi delivery_zones hiện có; constraints/PK/FK có owner tại [DATABASE_DESIGN](../reference/DATABASE_DESIGN.md#10-bảng-base-mvp-và-2-bảng-danh-mục). Không sửa 0001/0002 hoặc tạo phí.

Mã hành chính dùng cho danh mục; zone/order contract vẫn lưu tên, snapshot đơn không có FK phụ thuộc coverage. Thêm tỉnh phải nhập danh mục có kiểm chứng rồi cấu hình từng zone; nhập danh mục không tự mở coverage.

Tên phường chuẩn không có tiền tố. Server chấp nhận alias `Phường ` / `Xã ` / `Đặc khu ` của dòng cũ, chuẩn hóa khi lưu mới và chặn trùng alias bằng CONFLICT. Dòng `ward_name=''` hoặc tỉnh/phường ngoài danh mục được giữ nguyên; có thể tắt dòng cũ nhưng không tạo/bật phạm vi không hợp lệ.

## Admin và checkout

Admin `/admin/delivery-zones` dùng shared Combobox: mở để chọn hoặc tìm không dấu (gồm đ/d); chọn thành phố xong chọn phường, nhập phí và lưu. Đổi thành phố xóa phường. Không lưu được lựa chọn chưa thuộc danh mục. GET admin trả một trang zones + tổng/counts theo bộ lọc, cùng danh mục Hà Nội126; cookie auth và same-origin JSON write giữ nguyên.

Kho phí có Tải template/Upload file Excel: điền DeliveryZones từ danh mục Areas, kiểm trước rồi xác nhận tạo khu vực mới; không ghi đè phí đã có hoặc tự seed coverage. Công tắc tắt/bật giữ dòng; icon xóa có xác nhận và xóa cấu hình zone, đơn cũ giữ snapshot. Payload/giới hạn và rollback thuộc [API Excel phí](../reference/API_CONTRACT.md#nhập-phí-giao-hàng-excel).

Public `GET /api/delivery/options` chỉ JOIN các zone **đang active và khớp danh mục**, trả tên phường chuẩn. Checkout lấy toàn bộ lựa chọn từ response này:

- Có zone Hoàn Kiếm active → hiện Hà Nội và Hoàn Kiếm.
- Cửa Nam chưa cấu hình hoặc đã tắt → không hiện Cửa Nam.
- Chưa cấu hình phường nào → `provinces: []`, UI báo chưa có khu vực giao được cấu hình.
- Quote và tạo đơn kiểm cùng quy tắc trên server. Phường chưa được bật trả 422 `NO_DELIVERY_ZONE`; **không fallback phí mặc định tỉnh**, kể cả có dòng legacy `ward_name=''`.

Parent fields `default_fee` và `free_from_amount` trong public options vẫn có mặt với giá trị null để giữ shape tương thích. Ngưỡng miễn phí theo từng zone và phụ phí phương thức do server tính; [API_CONTRACT](../reference/API_CONTRACT.md) mô tả payload/response.

Combobox tách chữ tìm khỏi giá trị chọn, hỗ trợ chuột/Tab/Enter/Escape và thông báo không kết quả. Quote chỉ chạy với lựa chọn active hợp options; debounce/abort/ownership ở [FRONTEND_ENTITIES](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu), layout/payment/consent ở [CHECKOUT_UI](CHECKOUT_UI.md).

## Cấu hình và kiểm chứng

Sau khi áp migration theo runbook môi trường, người vận hành tạo hoặc bật từng zone với phí đã chốt trong admin. Không chạy full seed, tạo phí mẫu hoặc tự bật cả 126 phường. Kiểm FK, số đơn vị trong danh mục và public options sau thay đổi; backup theo [OPERATIONS](../operations/OPERATIONS.md). Import danh mục không tự coi toàn Hà Nội là khu vực phục vụ.

[Runner admin](../../scripts/check-ui-delivery-admin.mjs) dùng Worker + SQLite tổng hợp/cookie test để kiểm tìm/chọn không dấu, tạo zone → checkout hiện, tắt → ẩn và direct quote trả 422, EN/VI và responsive. [Runner địa chỉ](../../scripts/check-ui-delivery.mjs) và [runner checkout](../../scripts/check-ui-cart-checkout.mjs) kiểm lựa chọn active-only và debounce. Đây là bằng chứng local cô lập, không nghiệm thu CRUD bằng tài khoản thật hoặc dữ liệu remote; kết quả ở [PROJECT_STATUS](../PROJECT_STATUS.md).
