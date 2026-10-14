-- =============================================================================
-- DEFERRED — KHÔNG áp dụng trong pipeline MVP. Dùng khi làm "đặt hoa theo yêu cầu" (wizard).
-- Khi dùng: di chuyển thành migrations/0002_custom_requests.sql (sau khi 0001 đã áp dụng).
-- Chuyển từ bản nháp gốc, thêm CHECK cho JSON/ngân sách/ngày.
-- =============================================================================
CREATE TABLE IF NOT EXISTS custom_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_code TEXT NOT NULL UNIQUE,          -- CR-YYMMDD-XXXXXX
    idempotency_key TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    recipient_name TEXT,

    occasion_code TEXT,
    size_code TEXT CHECK (size_code IS NULL OR size_code IN ('PETITE', 'CLASSIC', 'GRANDE', 'LUXE')),
    color_codes TEXT CHECK (color_codes IS NULL OR json_valid(color_codes)),    -- '["pastel","red"]'
    flower_codes TEXT CHECK (flower_codes IS NULL OR json_valid(flower_codes)), -- '["rose","tulip"]'
    budget_amount INTEGER CHECK (budget_amount IS NULL OR budget_amount >= 0),  -- VND

    needed_date TEXT NOT NULL CHECK (needed_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    needed_time_slot TEXT,
    province_name TEXT,
    ward_name TEXT,
    address_line TEXT,

    card_message TEXT,
    customer_note TEXT,
    admin_note TEXT,
    status_code TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status_code IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'DECLINED')),
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_custom_requests_idem ON custom_requests(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_requests_status_needed ON custom_requests(status_code, needed_date);
