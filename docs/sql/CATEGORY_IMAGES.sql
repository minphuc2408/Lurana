-- Owner-approved category illustration URLs only. Requires 0002_category_images.sql.
-- Static assets must be deployed separately to the target origin before delivery works.
-- No full seed, INSERT/REPLACE, product/stock/order changes or category renaming.
-- Revisioned asset names allow future replacements without stale URL caches.
UPDATE categories SET image_url = CASE code
    WHEN 'bouquets' THEN '/images/categories/bouquets-v1.webp'
    WHEN 'arrangements' THEN '/images/categories/arrangements-v1.webp'
    WHEN 'dried-flowers' THEN '/images/categories/dried-flowers-v1.webp'
    WHEN 'gift-sets' THEN '/images/categories/gift-sets-v1.webp'
END
WHERE code IN ('bouquets', 'arrangements', 'dried-flowers', 'gift-sets');
