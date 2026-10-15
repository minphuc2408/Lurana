# Cloudinary cho Lunara Shop

Cloud name owner cung cấp qua ảnh dashboard: `yrnqg7ay`, chế độ **Dynamic folders**. Tích hợp local gồm signed direct upload trong form tạo/sửa sản phẩm. Chưa đặt API keys, tạo preset, upload thật hoặc deploy tính năng; kiểm thử mock không phải nghiệm thu tài khoản Cloudinary.

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

Nếu Worker staging chưa tồn tại và Wrangler hỏi tạo mới, kiểm đúng `lunara-staging`. Staging cần ADMIN_PASSWORD/JWT_SECRET riêng theo [STAGING](STAGING.md). D1 staging đã migrate; để có category/sản phẩm test, cần seed staging nếu còn trống, chỉ chạy khi owner cho phép.

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

D1 tiếp tục lưu URL qua API sản phẩm hiện có; không đổi schema/migration. cloudinary_public_id chưa được lưu vào cột riêng. Chưa thêm gallery nhiều ảnh, tự xóa asset cũ, dọn ảnh mồ côi hoặc xóa Cloudinary khi xóa sản phẩm. Đổi ảnh/hủy form có thể để lại asset chưa dùng: owner kiểm và dọn thủ công sau khi chắc ảnh không còn tham chiếu. Không xóa ảnh cũ tự động vì đơn hàng có thể dùng snapshot URL.

Tham khảo chính thức: [credentials](https://cloudinary.com/documentation/how_to_integrate_cloudinary), [upload presets](https://cloudinary.com/documentation/upload_presets), [signed client uploads](https://cloudinary.com/documentation/client_side_uploading), [signature algorithm/validity](https://cloudinary.com/documentation/authentication_signatures).

## Bằng chứng local 15/10/2026

Cloudinary 15/10/2026: đã tích hợp local signed direct upload (SHA-256, cookie admin/same-origin, JPEG/PNG/WebP, client 5 MB, prefix local/staging/prod). Typecheck/build/architecture 208 source files PASS; tests 148/148, smoke local 40/40 PASS. Browser mock EN/VI 390px PASS: file sai, thành công/preview, Save URL, thiếu config giữ URL; 0 JS exceptions. Chưa tạo preset/đặt keys/upload thật/deploy tính năng, không ghi D1 remote; Phase 6 vẫn 5/7. Không thêm migration/dependency hoặc tự xóa asset. Evidence ignored tại .security-review/cloudinary-ui.mjs và verification-cloudinary-upload-*.png; provider/API quản trị được mock ở browser, không xem đây là upload thật.

Form sản phẩm 15/10/2026: chọn/upload ảnh là mặc định; Image URL nằm trong tùy chọn phụ thu gọn. Không còn ô nhập slug; khi tạo, client sinh slug từ tên EN (fallback VI), bỏ dấu/ký tự đặc biệt + UUID v4, tối đa 200 ký tự; giữ slug đã sinh trong draft khi thử lưu lại, không đổi slug sản phẩm cũ. Chưa chọn ảnh hiển thị lỗi EN/VI; upload thành công xóa lỗi cũ. Backend contract/DDL không đổi, slug vẫn được API yêu cầu và unique DB kiểm tra. Typecheck/architecture/build, 150 tests và browser mock form EN/VI 390px PASS; không upload thật/ghi remote/deploy trong lượt này. Verifier Phase 5 tổng quát dừng ở ca 3 do chờ tổng quote trước khi chọn khu vực (2/10, 0/2 mở rộng, persisted D1 không đổi); không coi là suite UI PASS.
