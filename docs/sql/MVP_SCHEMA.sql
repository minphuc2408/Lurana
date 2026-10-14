-- Lunara MVP schema draft, prepared 2026-10-14 from the owner's SQL.
-- Design: docs/DATABASE_DESIGN.md. Not applied to remote Cloudflare D1.
-- Draft money: integer VND. Current frontend demo: PHP / Asia/Manila.
-- Review auth schema, checkout idempotency and market migration before production.

-- Kích hoạt ràng buộc khóa ngoại cho SQLite/D1
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. NGƯỜI DÙNG & ĐỊA CHỈ (Dựng sẵn cấu trúc, chưa bật đăng ký ở MVP)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED')),
    avatar_url TEXT,
    preferred_locale TEXT DEFAULT 'vi' CHECK (preferred_locale IN ('vi', 'en')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    province_name TEXT NOT NULL, -- Tỉnh / Thành phố
    ward_name TEXT NOT NULL,     -- Phường / Xã
    address_line TEXT NOT NULL,  -- Số nhà, ngõ, tên đường
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- ============================================================================
-- 2. DANH MỤC & SẢN PHẨM (CATALOG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,       -- bouquets, grand-opening, condolence,...
    slug TEXT UNIQUE NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    slug TEXT UNIQUE NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    badge_code TEXT,                 -- BEST_SELLER, HOT, NEW
    is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'ARCHIVED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Biến thể kích thước hoa (Tiêu chuẩn, Lớn, Đặc biệt) kèm tồn kho
CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    size_code TEXT NOT NULL CHECK (size_code IN ('S', 'M', 'L', 'STANDARD', 'DELUXE')),
    price INTEGER NOT NULL CHECK (price >= 0),                 -- Đơn vị: VND
    compare_at_price INTEGER CHECK (compare_at_price >= price), -- Giá niêm yết gốc (để hiển thị % giảm giá)
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT uq_product_size UNIQUE (product_id, size_code)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Ảnh sản phẩm (Lưu trữ Cloudinary)
CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,            -- URL đầy đủ trả về từ Cloudinary
    cloudinary_public_id TEXT NOT NULL, -- Dùng để gọi API xóa ảnh trên Cloudinary khi cần
    alt_vi TEXT,
    alt_en TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- ============================================================================
-- 3. ĐƠN HÀNG (ORDERS & CHECKOUT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL, -- LNR-YYYYMMDD-XXXX
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL đối với khách vãng lai

    -- Trạng thái đơn & Thanh toán (COD)
    status_code TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status_code IN ('PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
    payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD')),
    payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),

    -- Thông tin người đặt hoa (Sender/Buyer)
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_email TEXT,
    is_anonymous INTEGER NOT NULL DEFAULT 0 CHECK (is_anonymous IN (0, 1)), -- Giấu tên người gửi khi giao hoa

    -- Thông tin người nhận & Địa chỉ (Snapshot - Bỏ cấp Quận/Huyện)
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    province_name TEXT NOT NULL,
    ward_name TEXT NOT NULL,
    address_line TEXT NOT NULL,

    -- Thời gian giao hoa & Thiệp chúc mừng
    delivery_method_code TEXT NOT NULL DEFAULT 'STANDARD' CHECK (delivery_method_code IN ('STANDARD', 'EXPRESS', 'SAME_DAY')),
    delivery_date TEXT NOT NULL,       -- Định dạng YYYY-MM-DD
    delivery_time_slot TEXT NOT NULL,  -- '08:00 - 10:00', '14:00 - 16:00', 'Giao gấp 60p'
    card_type TEXT NOT NULL DEFAULT 'NONE' CHECK (card_type IN ('NONE', 'GREETING_CARD', 'BANNER')),
    card_message TEXT,                 -- Nội dung lời chúc in trên thiệp/băng rôn
    customer_note TEXT,                -- Lời dặn cho tài xế/thợ cắm
    admin_note TEXT,                   -- Ghi chú nội bộ cho shop

    -- Tiền tệ (VND) - Tính toán và kiểm tra toàn bộ tại Backend
    currency TEXT NOT NULL DEFAULT 'VND',
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    discount_total INTEGER NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    grand_total INTEGER NOT NULL CHECK (grand_total >= 0),
    coupon_code TEXT,

    placed_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status_placed ON orders(status_code, placed_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Chi tiết đơn hàng (Snapshot toàn bộ thông tin tại thời điểm mua)
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    sku_snapshot TEXT NOT NULL,
    name_vi_snapshot TEXT NOT NULL,
    name_en_snapshot TEXT NOT NULL,
    size_snapshot TEXT NOT NULL,
    image_url_snapshot TEXT NOT NULL,
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total INTEGER NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Lịch sử trạng thái đơn hàng (Tracking timeline)
CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- ============================================================================
-- 4. YÊU CẦU ĐẶT HOA THEO MẪU RIÊNG (CUSTOM REQUESTS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_code TEXT UNIQUE NOT NULL, -- CR-YYYYMMDD-XXXX
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    recipient_name TEXT,

    occasion_code TEXT,                  -- birthday, anniversary, opening,...
    size_code TEXT CHECK (size_code IN ('PETITE', 'CLASSIC', 'GRANDE', 'LUXE')),
    color_codes TEXT,                    -- Chuỗi JSON: '["pastel", "red", "pink"]'
    flower_codes TEXT,                   -- Chuỗi JSON: '["rose", "tulip", "baby"]'
    budget_amount INTEGER,               -- Ngân sách dự kiến (VND)

    needed_date TEXT NOT NULL,
    needed_time_slot TEXT,
    province_name TEXT,
    ward_name TEXT,
    address_line TEXT,

    card_message TEXT,
    customer_note TEXT,
    status_code TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status_code IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'DECLINED')),
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL, -- Gắn đơn hàng khi chốt mẫu thành công

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_custom_requests_status_needed ON custom_requests(status_code, needed_date);
