# Địa chỉ và phạm vi giao hàng Hà Nội

> Cập nhật staging17/10: owner deploy c29141be, main77bdfdc đã merge hai PR của@minphuc8042 bởi@minphuc2408. Public UI200/CSP/noindex, metadata có TURNSTILE_SECRET, coverage1tỉnh Hà Nội/1phường. Chưa nghiệm thu provider/đơn thật; kết luận thiếu secret/zones0/chưa deploy16/10 bên dưới là lịch sử. [Hiện trạng và bằng chứng](PROJECT_STATUS.md#staging-và-hai-pr-đã-merge--17102026).


Cập nhật 16/10/2026: đã áp migration local và staging, đã deploy staging version `27c3d24e-f3df-42e1-8d18-8b8299427062`. Không migrate/deploy production. Phần này thay cho thiết kế JSON Hà Nội + TP.HCM trước đó.

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

Chuỗi 0001 + 0002 + 0003 hiện có **12 bảng nghiệp vụ** ở local/staging. Mã hành chính chỉ dùng cho danh mục; zone/order contract vẫn lưu tên. Service kiểm danh mục trước khi tạo/bật zone, không thêm FK vào snapshot đơn. Thêm tỉnh mới phải nhập danh mục có kiểm chứng trước, rồi cấu hình từng zone; không bật phạm vi giao bằng việc nhập danh mục.

Tên phường chuẩn không có tiền tố. Server chấp nhận alias `Phường ` / `Xã ` / `Đặc khu ` của dòng cũ, chuẩn hóa khi lưu mới và chặn trùng alias bằng CONFLICT. Dòng `ward_name=''` hoặc tỉnh/phường ngoài danh mục được giữ nguyên; có thể tắt dòng cũ nhưng không tạo/bật phạm vi không hợp lệ.

## Admin và checkout

Admin `/admin/delivery-zones` dùng shared Combobox: mở để chọn hoặc tìm không dấu (gồm đ/d); chọn thành phố xong chọn phường, nhập phí và lưu. Đổi thành phố xóa phường. Không lưu được lựa chọn chưa thuộc danh mục. GET admin trả cả zones hiện hữu và danh mục Hà Nội126; cookie auth và same-origin JSON write giữ nguyên.

Public `GET /api/delivery/options` chỉ JOIN các zone **đang active và khớp danh mục**, trả tên phường chuẩn. Checkout lấy toàn bộ lựa chọn từ response này:

- Có zone Hoàn Kiếm active → hiện Hà Nội và Hoàn Kiếm.
- Cửa Nam chưa cấu hình hoặc đã tắt → không hiện Cửa Nam.
- Chưa cấu hình phường nào → `provinces: []`, UI báo chưa có khu vực giao được cấu hình.
- Quote và tạo đơn kiểm cùng quy tắc trên server. Phường chưa được bật trả422 `NO_DELIVERY_ZONE`; **không fallback phí mặc định tỉnh**, kể cả có dòng legacy `ward_name=''`.

Parent fields `default_fee` và `free_from_amount` trong public options vẫn có mặt với giá trị null để giữ shape tương thích. Ngưỡng miễn phí theo từng zone và phụ phí phương thức vẫn do server tính. Resolve phí giữ một statement; ngân sách order15dòng vẫn35/36 statements, retry tối đa40.

Combobox tách chữ tìm khỏi giá trị đã chọn; hỗ trợ chuột, Tab/Enter/Escape và thông báo không kết quả. `useQuoteCart` chỉ quote khi có hàng và lựa chọn thuộc options; debounce350ms, hủy request đọc cũ và bỏ response lỗi thời. Gõ tìm kiếm/liên hệ/địa chỉ/ghi chú không gọi quote. Không polling hoặc tự retry lỗi. Layout/payment/consent theo [CHECKOUT_UI](CHECKOUT_UI.md).

## Thao tác DB và staging đã thực hiện

- Local: backup local ignored trước thay đổi, áp0003;1tỉnh/126phường, FK sạch. Giữ nguyên4zone seed lịch sử; public chỉ hiện Hoàn Kiếm là phường khớp danh mục và active.
- Staging: guard xác nhận `lunara-staging-db`, UUID `ed391b18-0bcf-41b3-8315-389807ace7f2`, áp0003. Sau migrate:1tỉnh/126phường, Hồ Chí Minh0, zones0, products1/variants3/tổng tồn30; orders/items/history0, FK sạch. Không chạy full seed hoặc tự đặt phí.
- Deploy staging version `27c3d24e-f3df-42e1-8d18-8b8299427062`; live bundle `/assets/index-Ba-uzNNV.js` khớp SHA-256 artifact staging, HTML giữ CSP/noindex. Public options200 và provinces rỗng đúng với zones0; admin không cookie401. Chưa nghiệm thu CRUD bằng tài khoản thật trên staging; browser CRUD bên dưới dùng DB tổng hợp cô lập.
- Full export staging không được thực hiện vì automatic approval review từ chối xuất DB có thể chứa dữ liệu khách. Thay đổi chỉ bổ sung bảng/danh mục; kiểm aggregate trước/sau và FK, không xuất bản ghi khách. Không thay secret hoặc chạm production.

Để mở giao hàng trên staging, người vận hành cần tạo các zone có phí trong admin. Import126phường không tự coi toàn Hà Nội là khu vực phục vụ. Turnstile/provider acceptance và Phase6 vẫn tách riêng, Phase6 giữ5/7.

## Kiểm chứng

- Typecheck, architecture225source,190/190tests, build PASS; `db:verify`13/13nhóm,46assertions; smoke40/40, persisted D1 không đổi bởi harness.
- `check-ui-delivery-admin.mjs`:7nhóm browser PASS,0exceptions; danh mục126, tìm/chọn không dấu, tạo Cửa Nam có phí → checkout hiện, tắt → ẩn và direct quote422; EN/VI320/390/768/1440px. Worker thật + SQLite tổng hợp/cookie test,0orders; không dùng credentials thật, không ghi remote.
- Các runner checkout/địa chỉ được cập nhật theo phạm vi active-only; kết quả mới nhất ở [PROJECT_STATUS](PROJECT_STATUS.md). Không coi targeted browser là nghiệm thu lại full legacy UI suite (còn assumptions quote-before-zone/datalist/checkout-start).
- Build khi Vite preview đang chạy cần restart preview để manifest mới có hiệu lực. Evidence local nằm trong `.security-review/`, không đưa vào Git.
