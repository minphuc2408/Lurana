-- Lunara MVP canonical schema — Phase 1, agreed 2026-10-14.
-- Single DDL source: migrations/0001_mvp.sql. Reconciles v1 with pipeline v2.
-- Decision, differences and reasons: docs/DATABASE_DESIGN.md.
-- Exactly 10 MVP tables; custom_requests is deferred and must not be applied here.
-- INTEGER VND; UTC timestamps; delivery_date has YYYY-MM-DD shape (API validates calendar).
-- D1 enforces foreign keys; updated_at is maintained by the API.
-- No DDL changes after agreement unless a real test failure is documented.
-- After remote application, use a new migration for every schema change.
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL CHECK (email = lower(email)),
    password_hash TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED')),
    avatar_url TEXT,
    preferred_locale TEXT NOT NULL DEFAULT 'vi' CHECK (preferred_locale IN ('vi', 'en')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);

CREATE TABLE IF NOT EXISTS user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    province_name TEXT NOT NULL,   -- Tỉnh / Thành phố
    ward_name TEXT NOT NULL,       -- Phường / Xã
    address_line TEXT NOT NULL,    -- Số nhà, ngõ, tên đường
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
-- Mỗi user tối đa 1 địa chỉ mặc định
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_default_address ON user_addresses(user_id) WHERE is_default = 1;

-- ============================================================================
-- 2. DANH MỤC & SẢN PHẨM
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,     -- bouquets, arrangements, dried-flowers, gift-sets
    slug TEXT NOT NULL UNIQUE,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    slug TEXT NOT NULL UNIQUE,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    badge_code TEXT CHECK (badge_code IS NULL OR badge_code IN ('BEST_SELLER', 'HOT', 'NEW')),
    is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'ARCHIVED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Biến thể theo size, kèm tồn kho. Sản phẩm đã bán thì ARCHIVE, không xóa cứng.
CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    size_code TEXT NOT NULL CHECK (size_code IN ('S', 'M', 'L', 'STANDARD', 'DELUXE')),
    price INTEGER NOT NULL CHECK (price >= 0),                                   -- VND
    compare_at_price INTEGER CHECK (compare_at_price IS NULL OR compare_at_price >= price),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),       -- CHECK này là chốt chặn bán quá tồn
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT uq_product_size UNIQUE (product_id, size_code)
);

CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT,         -- NULL nếu ảnh không do Cloudinary quản lý (seed/placeholder)
    alt_vi TEXT,
    alt_en TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
-- Mỗi sản phẩm tối đa 1 ảnh chính
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_primary_image ON product_images(product_id) WHERE is_primary = 1;

-- ============================================================================
-- 3. GIAO HÀNG: PHÍ THEO PHƯỜNG / KHU VỰC
-- Tra phí: khớp (province, ward) trước; không có thì dùng dòng ward_name = '' của tỉnh đó;
-- không có cả hai => chưa giao tới khu vực này.
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province_name TEXT NOT NULL,
    ward_name TEXT NOT NULL DEFAULT '',          -- '' = mức mặc định cho cả tỉnh/thành
    fee INTEGER NOT NULL CHECK (fee >= 0),       -- VND
    free_from_amount INTEGER CHECK (free_from_amount IS NULL OR free_from_amount >= 0), -- miễn phí khi subtotal >= giá trị này
    eta_minutes INTEGER CHECK (eta_minutes IS NULL OR eta_minutes > 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT uq_delivery_zone UNIQUE (province_name, ward_name)
);

-- ============================================================================
-- 4. ĐƠN HÀNG (COD, hỗ trợ khách vãng lai)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,   -- vd LNR-261014-K7QX2M (API sinh, có phần ngẫu nhiên, retry nếu trùng)
    idempotency_key TEXT,                -- UUID do client sinh cho mỗi lần bấm đặt hàng
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- NULL = khách vãng lai

    status_code TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status_code IN ('PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
    payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD')),
    payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    paid_at TEXT,                        -- thời điểm thu tiền COD
    delivered_at TEXT,

    -- Người đặt
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_email TEXT,
    is_anonymous INTEGER NOT NULL DEFAULT 0 CHECK (is_anonymous IN (0, 1)),

    -- Người nhận & địa chỉ (snapshot)
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    province_name TEXT NOT NULL,
    ward_name TEXT NOT NULL,
    address_line TEXT NOT NULL,

    -- Giao hàng & thiệp
    delivery_method_code TEXT NOT NULL DEFAULT 'STANDARD'
        CHECK (delivery_method_code IN ('STANDARD', 'EXPRESS', 'SAME_DAY')),
    delivery_date TEXT NOT NULL CHECK (delivery_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    delivery_time_slot TEXT NOT NULL,
    card_type TEXT NOT NULL DEFAULT 'NONE' CHECK (card_type IN ('NONE', 'GREETING_CARD', 'BANNER')),
    card_message TEXT,
    customer_note TEXT,
    admin_note TEXT,

    -- Tiền (VND) — server tính toàn bộ
    currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency = 'VND'),
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    discount_total INTEGER NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    grand_total INTEGER NOT NULL CHECK (grand_total >= 0),
    coupon_code TEXT,                    -- MVP: chỉ snapshot, chưa có bảng coupon

    stock_released INTEGER NOT NULL DEFAULT 0 CHECK (stock_released IN (0, 1)), -- đã hoàn tồn khi hủy (đúng 1 lần)

    placed_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    CONSTRAINT chk_order_discount CHECK (discount_total <= subtotal),
    CONSTRAINT chk_order_total CHECK (grand_total = subtotal - discount_total + delivery_fee)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency_key ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status_placed ON orders(status_code, placed_at);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Chi tiết đơn: snapshot tại thời điểm mua
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    sku_snapshot TEXT NOT NULL,
    name_vi_snapshot TEXT NOT NULL,
    name_en_snapshot TEXT NOT NULL,
    size_snapshot TEXT NOT NULL,
    image_url_snapshot TEXT,
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total INTEGER NOT NULL CHECK (line_total >= 0),
    CONSTRAINT chk_line_total CHECK (line_total = unit_price * quantity)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Timeline trạng thái
CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    actor_label TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (actor_label IN ('SYSTEM', 'CUSTOMER', 'ADMIN')),
    note TEXT,
    occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id, occurred_at);
