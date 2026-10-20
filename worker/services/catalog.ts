import { CATALOG_PAGE_SIZE, MAX_CART_LINES, MAX_QTY_PER_LINE } from '../../shared/constants.ts';
import { AppError } from '../lib/errors.ts';

export interface CategoryDTO {
  id: number;
  code: string;
  slug: string;
  name_vi: string;
  name_en: string;
  image_url: string | null;
}

export interface ProductVariantDTO {
  id: number;
  sku: string;
  size_code: 'S' | 'M' | 'L' | 'STANDARD' | 'DELUXE';
  price: number;
  compare_at_price: number | null;
  in_stock: boolean;
  low_stock: boolean;
  max_quantity: number;
}

export interface ProductImageDTO {
  url: string;
  alt_vi: string | null;
  alt_en: string | null;
  is_primary: boolean;
}

export interface ProductDTO {
  id: number;
  slug: string;
  category_code: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  badge_code: 'BEST_SELLER' | 'HOT' | 'NEW' | null;
  is_featured: boolean;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
}

interface ProductRow extends Omit<ProductDTO, 'is_featured' | 'images' | 'variants'> {
  is_featured: number;
}

interface VariantRow extends Omit<ProductVariantDTO, 'in_stock' | 'low_stock' | 'max_quantity'> {
  product_id: number;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface ImageRow {
  product_id: number;
  image_url: string;
  alt_vi: string | null;
  alt_en: string | null;
  is_primary: number;
}

export interface ProductFilters {
  category?: string;
  featured?: boolean;
  q?: string;
  price?: 'all' | 'under-500' | '500-1000' | '1000-2000' | 'over-2000';
  sort?: 'featured' | 'low' | 'high' | 'rating';
  page?: number;
}

export interface ProductPageDTO {
  items: ProductDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PRODUCT_COLUMNS = `p.id, p.slug, c.code AS category_code,
  p.name_vi, p.name_en, p.description_vi, p.description_en,
  p.badge_code, p.is_featured`;

export async function listCategories(db: D1Database): Promise<CategoryDTO[]> {
  const { results } = await db.prepare(`SELECT id, code, slug, name_vi, name_en, image_url
    FROM categories WHERE is_active = 1 ORDER BY sort_order, id`).all<CategoryDTO>();
  return results;
}

// Match the storefront's size choice, rather than the cheapest larger variant.
const CARD_PRICE = `COALESCE((SELECT v.price FROM product_variants v
  WHERE v.product_id = p.id AND v.is_active = 1
  ORDER BY CASE v.size_code WHEN 'S' THEN 0 WHEN 'STANDARD' THEN 1
    WHEN 'M' THEN 2 WHEN 'DELUXE' THEN 3 WHEN 'L' THEN 4 END, v.id LIMIT 1), 0)`;
const PRICE_RANGES: Record<string, [number, number?]> = {
  'under-500': [0, 500000], '500-1000': [500000, 1000000],
  '1000-2000': [1000000, 2000000], 'over-2000': [2000000],
};
function normalizeSearch(search: string): string {
  return search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
}

function productConditions(filters: ProductFilters) {
  const conditions = ["p.status = 'ACTIVE'", 'c.is_active = 1'];
  const values: (string | number)[] = [];
  if (filters.category !== undefined) {
    conditions.push('c.code = ?');
    values.push(filters.category);
  }
  if (filters.featured !== undefined) {
    conditions.push('p.is_featured = ?');
    values.push(filters.featured ? 1 : 0);
  }
  const range = PRICE_RANGES[filters.price ?? 'all'];
  if (range) {
    conditions.push(`${CARD_PRICE} >= ?`);
    values.push(range[0]);
    if (range[1] !== undefined) {
      conditions.push(`${CARD_PRICE} < ?`);
      values.push(range[1]);
    }
  }
  return { where: conditions.join(' AND '), values };
}

function productOrder(filters: ProductFilters): string {
  return filters.sort === 'low' ? `${CARD_PRICE} ASC, p.id ASC`
    : filters.sort === 'high' ? `${CARD_PRICE} DESC, p.id ASC`
    : 'p.is_featured DESC, p.id ASC';
}

function productListStatement(db: D1Database, filters: ProductFilters) {
  const { where, values } = productConditions(filters);
  return db.prepare(`SELECT ${PRODUCT_COLUMNS}
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE ${where} ORDER BY ${productOrder(filters)} LIMIT ? OFFSET ?`)
    .bind(...values, CATALOG_PAGE_SIZE, ((filters.page ?? 1) - 1) * CATALOG_PAGE_SIZE);
}

// Page/detail/restore use two bulk child reads; no per-product queries. Page and
// cart limits keep each child IN safely below D1's 100-parameter ceiling.
async function assembleProducts(db: D1Database, products: ProductRow[], fullGallery = false): Promise<ProductDTO[]> {
  if (products.length === 0) return [];

  const ids = products.map(product => product.id);
  const placeholders = ids.map(() => '?').join(',');
  const { results: variants } = await db.prepare(`SELECT product_id, id, sku, size_code,
    price, compare_at_price, stock_quantity, low_stock_threshold FROM product_variants
    WHERE is_active = 1 AND product_id IN (${placeholders})
    ORDER BY product_id, CASE size_code WHEN 'S' THEN 0 WHEN 'M' THEN 1 WHEN 'L' THEN 2
      WHEN 'STANDARD' THEN 3 WHEN 'DELUXE' THEN 4 END, id`)
    .bind(...ids).all<VariantRow>();
  const { results: images } = await db.prepare(`SELECT product_id, image_url, alt_vi, alt_en, is_primary
    FROM product_images WHERE product_id IN (${placeholders}) ${!fullGallery ? `AND id =
      (SELECT cover.id FROM product_images cover WHERE cover.product_id = product_images.product_id
       ORDER BY cover.is_primary DESC, cover.sort_order, cover.id LIMIT 1)` : ''}
    ORDER BY product_id, sort_order, id`)
    .bind(...ids).all<ImageRow>();

  const variantsByProduct = new Map<number, ProductVariantDTO[]>();
  for (const variant of variants) {
    const productVariants = variantsByProduct.get(variant.product_id) ?? [];
    productVariants.push({
      id: variant.id,
      sku: variant.sku,
      size_code: variant.size_code,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      in_stock: variant.stock_quantity > 0,
      low_stock: variant.stock_quantity > 0 && variant.stock_quantity <= variant.low_stock_threshold,
      max_quantity: Math.min(variant.stock_quantity, MAX_QTY_PER_LINE),
    });
    variantsByProduct.set(variant.product_id, productVariants);
  }
  const imagesByProduct = new Map<number, ProductImageDTO[]>();
  for (const image of images) {
    const productImages = imagesByProduct.get(image.product_id) ?? [];
    productImages.push({
      url: image.image_url,
      alt_vi: image.alt_vi,
      alt_en: image.alt_en,
      is_primary: image.is_primary === 1,
    });
    imagesByProduct.set(image.product_id, productImages);
  }
  return products.map(product => ({
    id: product.id,
    slug: product.slug,
    category_code: product.category_code,
    name_vi: product.name_vi,
    name_en: product.name_en,
    description_vi: product.description_vi,
    description_en: product.description_en,
    badge_code: product.badge_code,
    is_featured: product.is_featured === 1,
    images: imagesByProduct.get(product.id) ?? [],
    variants: variantsByProduct.get(product.id) ?? [],
  }));
}

export async function listProducts(db: D1Database, filters: ProductFilters = {}): Promise<ProductDTO[]> {
  if (filters.q?.trim()) return (await listProductPage(db, filters)).items;
  const { results } = await productListStatement(db, filters).all<ProductRow>();
  return assembleProducts(db, results);
}

export async function listProductPage(db: D1Database, filters: ProductFilters = {}): Promise<ProductPageDTO> {
  const { where, values } = productConditions(filters);
  if (filters.q?.trim()) {
    // D1 rejects expanded Unicode GLOB patterns as too complex. Read only names
    // and IDs, normalize in the Worker, and cap IDs before hydrating public DTOs.
    const { results } = await db.prepare(`SELECT p.id, p.name_en, p.name_vi
      FROM products p JOIN categories c ON c.id = p.category_id
      WHERE ${where} ORDER BY ${productOrder(filters)}`).bind(...values)
      .all<Pick<ProductRow, 'id' | 'name_en' | 'name_vi'>>();
    const search = normalizeSearch(filters.q);
    const matched = results.filter(product => normalizeSearch(product.name_en).includes(search) || normalizeSearch(product.name_vi).includes(search));
    const page = filters.page ?? 1;
    const ids = matched.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE).map(product => product.id);
    let items: ProductDTO[] = [];
    if (ids.length) {
      const { results: products } = await db.prepare(`SELECT ${PRODUCT_COLUMNS}
        FROM products p JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'ACTIVE' AND c.is_active = 1 AND p.id IN (${ids.map(() => '?').join(',')})`)
        .bind(...ids).all<ProductRow>();
      const productsById = new Map(products.map(product => [product.id, product]));
      const ordered = ids.flatMap(id => { const product = productsById.get(id); return product ? [product] : []; });
      items = await assembleProducts(db, ordered);
    }
    return { items, total: matched.length, page, pageSize: CATALOG_PAGE_SIZE, totalPages: Math.ceil(matched.length / CATALOG_PAGE_SIZE) };
  }
  const [count, products] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id
      WHERE ${where}`).bind(...values),
    productListStatement(db, filters),
  ]);
  const total = Number((count.results as unknown as { total: number }[])[0]?.total ?? 0);
  return { items: await assembleProducts(db, products.results as unknown as ProductRow[]),
    total, page: filters.page ?? 1, pageSize: CATALOG_PAGE_SIZE, totalPages: Math.ceil(total / CATALOG_PAGE_SIZE) };
}

export async function listProductsByVariants(db: D1Database, variantIds: number[]): Promise<ProductDTO[]> {
  if (variantIds.length < 1 || variantIds.length > MAX_CART_LINES || new Set(variantIds).size !== variantIds.length
    || variantIds.some(id => !Number.isSafeInteger(id) || id < 1)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Danh sách biến thể không hợp lệ.');
  }
  const placeholders = variantIds.map(() => '?').join(',');
  const { results } = await db.prepare(`SELECT ${PRODUCT_COLUMNS}
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'ACTIVE' AND c.is_active = 1 AND EXISTS
      (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1 AND v.id IN (${placeholders}))
    ORDER BY p.id LIMIT ${MAX_CART_LINES}`).bind(...variantIds).all<ProductRow>();
  return assembleProducts(db, results);
}

export async function getProduct(db: D1Database, slug: string): Promise<ProductDTO> {
  const { results } = await db.prepare(`SELECT ${PRODUCT_COLUMNS}
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'ACTIVE' AND c.is_active = 1 AND p.slug = ? LIMIT 1`).bind(slug).all<ProductRow>();
  const [product] = await assembleProducts(db, results, true);
  if (!product) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy sản phẩm.');
  return product;
}
