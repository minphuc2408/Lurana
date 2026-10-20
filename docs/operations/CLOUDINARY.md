# Cloudinary cho Lunarra

How-to cho chủ shop/developer về cấu hình provider và lifecycle gallery, hợp nhất 19/10/2026. Cloud name owner cung cấp: `yrnqg7ay`, chế độ **Dynamic folders**. Form tạo/sửa sản phẩm hỗ trợ signed direct upload và gallery nhiều ảnh. Tài liệu này hướng dẫn cấu hình, tải ảnh và quản lý liên kết asset; triển khai/secrets theo môi trường và nghiệm thu provider xem [PROJECT_STATUS](../PROJECT_STATUS.md).

## 1. Có thể dùng thủ công ngay

Cloudinary Console → Media Library/Assets → Upload: tải ảnh sản phẩm, mở ảnh và sao chép **HTTPS delivery URL**. Vào Lunarra admin → Kho → tạo/sửa sản phẩm → mở “Dùng đường dẫn ảnh có sẵn” → dán Image URL → bấm thêm URL vào gallery → lưu sản phẩm. D1 lưu URL, không lưu file ảnh; storefront đọc ảnh từ URL đó. Không cần API secret cho thao tác dán URL.

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

Staging cần ADMIN_PASSWORD/JWT_SECRET riêng theo [STAGING](STAGING.md); kiểm đúng Worker trước khi nhập keys. Secrets Cloudinary không tạo dữ liệu catalog; không chạy full seed để thử upload. Thêm dữ liệu thử theo nhu cầu cụ thể chỉ khi owner cho phép.

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

Chọn build/deploy đúng target theo [STAGING](STAGING.md#build-và-deploy); nghiệm thu staging trước production trong phạm vi đã được owner cho phép.

1. Đăng nhập admin, mở một sản phẩm thử → chọn ảnh JPEG/PNG/WebP ≤5 MiB.
2. Chờ thông báo tải ảnh thành công, URL HTTPS điền tự động và preview hiện.
3. Bấm **Save product**; reload admin và storefront để kiểm ảnh. CatalogProvider giữ snapshot đến reload/retry; HTTP catalog có cache 30 giây.
4. Kiểm asset trong đúng folder Cloudinary và product_images.url trong đúng D1 môi trường. Upload xong chưa bấm Save thì chưa đổi sản phẩm.
5. Kiểm lỗi ảnh sai định dạng/quá lớn, cấu hình thiếu, mất mạng, EN/VI và mobile. Không tự retry upload khi mất phản hồi: asset có thể đã tồn tại, xem Media Library trước.

## Hợp đồng và giới hạn

`POST /api/admin/uploads/sign` yêu cầu cookie admin, same-origin Origin và JSON; payload/response đầy đủ ở [API_CONTRACT](../reference/API_CONTRACT.md#post-apiadminuploadssign). Server chỉ kiểm MIME/size khai báo và ký tham số do server sở hữu, không nhận public_id/preset tùy ý. SHA-256 ký ở Worker bằng Web Crypto, không dùng Node SDK. Theo [Cloudinary signatures](https://cloudinary.com/documentation/authentication_signatures), chữ ký có hiệu lực **một giờ** từ timestamp; không gọi đây là URL một lần hay ticket 60 giây. overwrite=false + UUID tránh ghi đè.

Ảnh đi trực tiếp browser → Cloudinary, không đi qua Worker. **Giới hạn 5 MiB là kiểm ở client và metadata khai báo**, không phải giới hạn byte do Worker cưỡng chế; Cloudinary áp allowed_formats và giới hạn provider/preset thực tế. Không tuyên bố có server-side magic-byte scanning hoặc hard quota 5 MiB. Chỉ admin được cấp chữ ký; chưa có rate limit/quota upload bổ sung.

D1 lưu URL và `cloudinary_public_id` vào bảng/cột đã có trong 0001; không cần migration riêng cho upload/gallery. Chưa tự xóa asset cũ, dọn ảnh mồ côi hoặc xóa Cloudinary khi xóa sản phẩm. Đổi ảnh/hủy form có thể để lại asset chưa dùng: owner kiểm và dọn thủ công sau khi chắc ảnh không còn tham chiếu. Không xóa ảnh cũ tự động vì đơn hàng có thể dùng snapshot URL.

Tham khảo chính thức: [credentials](https://cloudinary.com/documentation/how_to_integrate_cloudinary), [upload presets](https://cloudinary.com/documentation/upload_presets), [signed client uploads](https://cloudinary.com/documentation/client_side_uploading), [signature algorithm/validity](https://cloudinary.com/documentation/authentication_signatures).


## Gallery nhiều ảnh

Form tạo/sửa có tối đa 8 ảnh, chọn nhiều file hoặc thêm URL trong phần tùy chọn. Mỗi file dùng ticket ký riêng; upload tuần tự, mỗi ảnh ≤5 MiB và JPEG/PNG/WebP. Kết quả được kiểm secure_url/public_id theo ticket trước khi thêm vào draft. Nếu một upload lỗi, giữ các ảnh trước đã thành công và dừng; người dùng có thể lưu phần đã có hoặc chọn lại file, không tự upload lại.

Chọn cover bằng nút sao, đổi thứ tự bằng lên/xuống và gỡ ảnh bằng thùng rác; nếu gỡ cover thì ảnh còn lại đầu tiên làm cover. Chỉ bấm Lưu sản phẩm mới ghi gallery vào D1. Cancel/gỡ không xóa file provider; owner dọn file chưa liên kết thủ công sau khi kiểm tham chiếu.

Save gửi gallery qua API sản phẩm; [API_CONTRACT](../reference/API_CONTRACT.md#dto-và-validation-admin) sở hữu image/images, thứ tự/cover/URL/public ID và validation. Replace gallery/text atomic, lỗi rollback; ID ảnh có thể đổi khi thay liên kết. Không có concurrency version/ETag; không coi draft hoặc upload thành công là đã lưu D1.

Storefront list dùng cover, detail có thumbnails/zoom theo [API](../reference/API_CONTRACT.md#get-apiproductsslug). Không cần chuyển URL cũ. [Upload response chính thức](https://cloudinary.com/documentation/image_upload_api_reference#upload_response).

## Kiểm chứng

Kiểm thử dùng provider/API giả lập và D1 cô lập để kiểm file sai, thiếu cấu hình, upload/preview, gallery, lỗi giữa chừng và lưu sản phẩm. Không dùng kết quả mock để kết luận preset/keys hoặc upload thật hoạt động; nghiệm thu theo bước 5 và ghi kết quả tại [PROJECT_STATUS](../PROJECT_STATUS.md). Giới hạn URL ảnh và CSP xem [HARDENING](HARDENING.md).
