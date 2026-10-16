# Cloudinary cho Lunarra

Cloud name owner cung cấp qua ảnh dashboard: `yrnqg7ay`, chế độ **Dynamic folders**. Tích hợp local gồm signed direct upload trong form tạo/sửa sản phẩm. Snapshot chỉ đọc16/10: staging đã deploy và có cloud/preset/scope cùng tên secrets CLOUDINARY_API_KEY/API_SECRET; production chưa có cấu hình/secrets Cloudinary trong version live. Chưa xác minh giá trị keys/preset hoặc upload thật; kiểm thử mock không phải nghiệm thu provider. [Hiện trạng](PROJECT_STATUS.md).

## 1. Có thể dùng thủ công ngay

Cloudinary Console → Media Library/Assets → Upload: tải ảnh sản phẩm, mở ảnh và sao chép **HTTPS delivery URL**. Vào Lunara admin → Kho → tạo/sửa sản phẩm → mở “Dùng đường dẫn ảnh có sẵn” → dán Image URL → Save product. D1 lưu URL, không lưu file ảnh; storefront đọc ảnh từ URL đó. Không cần API secret cho thao tác dán URL.

## 2. Owner cấu hình Cloudinary

1. Console → Settings → **API Keys**: lấy API key và API secret. Không gửi secret hoặc CLOUDINARY_URL vào chat, không đưa vào Git hoặc VITE_*.
2. Settings → **Upload → Upload presets → Add upload preset**. Tạo hai preset:

| Preset name | Signing mode | Dùng cho |
| --- | --- | --- |
| `lunara_products_staging` | **Signed** | Local + staging |
| `lunara_products_prod` | **Signed** | Production |

3. Nếu UI có Allowed formats, đặt `jpg,png,webp`. Code cũng ký giá trị này trong từng upload. Giữ ảnh public (delivery type upload) để khách xem được. Không bật chế độ authenticated/private, moderation chờ duyệt hoặc add-on có phí cho flow hiện tại. Không cần tạo unsigned preset, webhook, CORS wildcard hoặc bật thanh toán.
4. Với Dynamic folders, code gửi **asset_folder** và **public_id** do server tạo: `lunara/local/products`, `lunara/staging/products`, `lunara/prod/products`. Cloudinary tạo folder khi upload; không cần tạo tay hoặc bật Use asset folder as public ID prefix. Không cấu hình prefix/đổi tên khác trong preset. Mỗi ảnh có UUID mới, overwrite=false.
5. Save cả hai preset. Dùng cùng một Cloudinary environment tiết kiệm cấu hình nhưng **folder không tách quota hoặc quyền tài khoản**. Nếu cần cách ly tài khoản hoàn toàn, dùng product environment/account riêng và cloud name/API keys riêng cho từng Worker.

## 3. Owner nhập keys vào Cloudflare

Từ root repo, nhập giá trị tại prompt ẩn (không truyền giá trị bằng arguments). API key được gửi trong signed upload nên không phải secret như API secret, nhưng vẫn cấu hình server để tránh nhầm môi trường.

```powershell
# Staging
npx wrangler secret put CLOUDINARY_API_KEY --env staging --config wrangler.jsonc
npx wrangler secret put CLOUDINARY_API_SECRET --env staging --config wrangler.jsonc
```

Nếu Worker staging chưa tồn tại và Wrangler hỏi tạo mới, kiểm đúng `lunara-staging`. Staging cần ADMIN_PASSWORD/JWT_SECRET riêng theo [STAGING](STAGING.md). D1 staging đã migrate, đã có4 categories và1 sản phẩm active khi kiểm16/10; không chạy full seed. Thêm dữ liệu thử theo nhu cầu cụ thể chỉ khi owner cho phép.

Sau nghiệm thu staging, production dùng top-level config. Xóa CLOUDFLARE_ENV khỏi terminal trước thao tác production nếu đã đặt:

```powershell
Remove-Item Env:CLOUDFLARE_ENV -ErrorAction SilentlyContinue
npx wrangler secret put CLOUDINARY_API_KEY --config wrangler.jsonc
npx wrangler secret put CLOUDINARY_API_SECRET --config wrangler.jsonc
```

Nếu Wrangler hỏi tạo Worker production mới thì dừng: `lunara` đã tồn tại. Secrets Cloudflare không tự truyền từ production sang staging. Dùng key riêng cho mỗi môi trường nếu tài khoản hỗ trợ; dù dùng chung key, folder vẫn được code tách theo Worker.

`wrangler.jsonc` đã chứa cloud name, preset và scope công khai cho từng Worker. Không cần client env VITE_* hoặc Cloudinary SDK.

## 4. Local

Tự bổ sung vào `.dev.vars` ignored; xem placeholder tại `.dev.vars.example`. Không đọc/copy mật khẩu production để test.

```dotenv
CLOUDINARY_CLOUD_NAME=yrnqg7ay
CLOUDINARY_UPLOAD_PRESET=lunara_products_staging
CLOUDINARY_SCOPE=local
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
```

Khởi động lại dev/preview sau đổi biến. Phải đặt scope=local để ảnh thử không vào prefix prod của top-level config. Khi chưa đặt keys, upload trả 503 CLOUDINARY_NOT_CONFIGURED; dán URL ảnh vẫn hoạt động.

## 5. Deploy và nghiệm thu

Khi owner cho phép deploy: `npm run deploy:staging`; kiểm thật rồi mới `npm run deploy` production. Không dùng chung dist cho hai lệnh chạy đồng thời.

1. Đăng nhập admin, mở một sản phẩm thử → chọn ảnh JPEG/PNG/WebP ≤5 MB.
2. Chờ thông báo tải ảnh thành công, URL HTTPS điền tự động và preview hiện.
3. Bấm **Save product**; reload admin và storefront để kiểm ảnh. CatalogProvider giữ snapshot đến reload/retry; HTTP catalog có cache 30 giây.
4. Kiểm asset trong đúng folder Cloudinary và product_images.url trong đúng D1 môi trường. Upload xong chưa bấm Save thì chưa đổi sản phẩm.
5. Kiểm lỗi ảnh sai định dạng/quá lớn, cấu hình thiếu, mất mạng, EN/VI và mobile. Không tự retry upload khi mất phản hồi: asset có thể đã tồn tại, xem Media Library trước.

## Hợp đồng và giới hạn

POST `/api/admin/uploads/sign`, cookie admin + same-origin Origin + JSON; body `{ "mime": "image/jpeg", "size": 12345 }` ≤1 KB. Server kiểm MIME/size khai báo (JPEG/PNG/WebP, 1..5 MiB), không nhận public_id/preset tùy ý. Trả `data` gồm cloud_name/api_key/signature và params cố định (timestamp/public_id/asset_folder/upload_preset/overwrite/allowed_formats). SHA-256 ký ở Worker bằng Web Crypto, không dùng Node SDK. Cloudinary cho chữ ký upload hiệu lực **một giờ**; không gọi đây là URL một lần hay ticket 60 giây. overwrite=false + UUID tránh ghi đè.

Ảnh đi trực tiếp browser → Cloudinary, không đi qua Worker. **Giới hạn 5 MB là kiểm ở client và metadata khai báo**, không phải giới hạn byte do Worker cưỡng chế; Cloudinary áp allowed_formats và giới hạn provider/preset thực tế. Không tuyên bố có server-side magic-byte scanning hoặc hard quota 5 MB. Chỉ admin được cấp chữ ký; chưa có rate limit/quota upload bổ sung.

D1 lưu URL và `cloudinary_public_id` vào bảng/cột đã có trong0001; không đổi schema/migration. Gallery nhiều ảnh đã có local16/10 như mục bên dưới. Chưa tự xóa asset cũ, dọn ảnh mồ côi hoặc xóa Cloudinary khi xóa sản phẩm. Đổi ảnh/hủy form có thể để lại asset chưa dùng: owner kiểm và dọn thủ công sau khi chắc ảnh không còn tham chiếu. Không xóa ảnh cũ tự động vì đơn hàng có thể dùng snapshot URL.

Tham khảo chính thức: [credentials](https://cloudinary.com/documentation/how_to_integrate_cloudinary), [upload presets](https://cloudinary.com/documentation/upload_presets), [signed client uploads](https://cloudinary.com/documentation/client_side_uploading), [signature algorithm/validity](https://cloudinary.com/documentation/authentication_signatures).


## Gallery nhiều ảnh — local16/10, chưa deploy

Form tạo/sửa có bộ ảnh tối đa8 ảnh, chọn nhiều file hoặc thêm URL trong phần tùy chọn. Mỗi file dùng ticket ký riêng; upload tuần tự, mỗi ảnh vẫn≤5MiB và JPEG/PNG/WebP. Kết quả được kiểm secure_url/public_id theo ticket trước khi thêm vào draft. Nếu ảnh thứn lỗi, giữ các ảnh trước đã thành công và dừng; người dùng có thể lưu phần đã có hoặc chọn lại file, không tự upload lại. Chọn cover bằng nút sao, đổi thứ tự bằng lên/xuống và gỡ ảnh bằng thùng rác; nếu gỡ cover thì ảnh còn lại đầu tiên làm cover. Chỉ bấm Lưu sản phẩm mới ghi gallery vào D1. Cancel/gỡ không xóa file provider; có thể có file chưa liên kết cần owner dọn thủ công sau khi kiểm tham chiếu.

Dùng POST/PATCH `/api/admin/products[/:id]` hiện có, cookie admin + same-origin JSON. Payload `images`1..8 phần tử `{url, cloudinary_public_id?, alt_vi?, alt_en?, is_primary}`; mảng quyết định sort_order, đúng1primary, URL/public ID không trùng. URL giữ allowlistHTTPS; khi cópublic ID phải khớp URL Cloudinary. `image` đơn vẫn tương thích; không gửi cả `image` và `images`. Patch gallery xóa/thêm liên kết trong1batch atomic; lỗi insert rollback cả gallery và text. ID row ảnh được cấp lại khi replace; form dùng danh sách ảnh, không có endpoint xóa asset Cloudinary. API admin trảid/sort_order/public ID; API public chỉ URL/alt/is_primary. Không đưa secret vào frontend hay public API.

GET `/api/products` trả1cover, fallback theo sort_order/id khi legacy không cóprimary. GET `/api/products/:slug` trả toàn bộảnh; `/shop/:slug` hiển thị cover + thumbnails, chuyển/phóng ảnh. Không tạo bảng mới, không cần migration hay chuyển URL cũ. Upload thật/preset vẫn cần nghiệm thu riêng; local5nhóm browser dùngCloudinarymock vàD1tạm, không phải provider acceptance. [Upload response chính thức](https://cloudinary.com/documentation/image_upload_api_reference#upload_response).

## Bằng chứng lịch sử — local 15/10/2026

Những câu chưa deploy/chưa đặt keys dưới đây mô tả đúng thời điểm kiểm cũ. Trạng thái cloud hiện tại ở đầu tài liệu; không dùng mốc cũ làm trạng thái staging hôm nay.

Cloudinary 15/10/2026: đã tích hợp local signed direct upload (SHA-256, cookie admin/same-origin, JPEG/PNG/WebP, client 5 MB, prefix local/staging/prod). Typecheck/build/architecture 208 source files PASS; tests 148/148, smoke local 40/40 PASS. Browser mock EN/VI 390px PASS: file sai, thành công/preview, Save URL, thiếu config giữ URL; 0 JS exceptions. Chưa tạo preset/đặt keys/upload thật/deploy tính năng, không ghi D1 remote; Phase 6 vẫn 5/7. Không thêm migration/dependency hoặc tự xóa asset. Evidence ignored tại .security-review/cloudinary-ui.mjs và verification-cloudinary-upload-*.png; provider/API quản trị được mock ở browser, không xem đây là upload thật.

Form sản phẩm 15/10/2026: chọn/upload ảnh là mặc định; Image URL nằm trong tùy chọn phụ thu gọn. Không còn ô nhập slug; khi tạo, client sinh slug từ tên EN (fallback VI), bỏ dấu/ký tự đặc biệt + UUID v4, tối đa 200 ký tự; giữ slug đã sinh trong draft khi thử lưu lại, không đổi slug sản phẩm cũ. Chưa chọn ảnh hiển thị lỗi EN/VI; upload thành công xóa lỗi cũ. Backend contract/DDL không đổi, slug vẫn được API yêu cầu và unique DB kiểm tra. Typecheck/architecture/build, 150 tests và browser mock form EN/VI 390px PASS; không upload thật/ghi remote/deploy trong lượt này. Verifier Phase 5 tổng quát dừng ở ca 3 do chờ tổng quote trước khi chọn khu vực (2/10, 0/2 mở rộng, persisted D1 không đổi); không coi là suite UI PASS.

M8/M3 local 15/10/2026: create/patch image.url chỉ nhận HTTPS res.cloudinary.com hoặc images.unsplash.com, không credential/port tùy chỉnh; giữ ảnh Unsplash seed, không sửa dữ liệu cũ. CSP static cho phép connect-src https://api.cloudinary.com và img-src HTTPS/blob để upload/preview. Upload Cloudinary thật vẫn chưa nghiệm thu; [hardening](HARDENING.md).
