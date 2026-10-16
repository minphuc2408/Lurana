-- Owner-requested category illustrations, 16/10/2026.
-- Additive only: existing rows keep their identifiers, names and product links.
-- Asset URLs are populated separately; missing images remain NULL.
ALTER TABLE categories ADD COLUMN image_url TEXT
    CHECK (image_url IS NULL OR length(image_url) BETWEEN 1 AND 2048);
