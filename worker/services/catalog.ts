import { MAX_QTY_PER_LINE } from '../../shared/constants.ts';
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
}

const PRODUCT_COLUMNS = `p.id, p.slug, c.code AS category_code,
  p.name_vi, p.name_en, p.description_vi, p.description_en,
  p.badge_code, p.is_featured`;

export async function listCategories(db: D1Database): Promise<CategoryDTO[]> {
  const { results } = await db.prepare(`SELECT id, code, slug, name_vi, name_en, image_url
    FROM categories WHERE is_active = 1 ORDER BY sort_order, id`).all<CategoryDTO>();
  return results;
}

// The product limit also bounds each child IN query to D1's 100-parameter limit.
// Each nonempty catalog read executes exactly three statements, without per-product reads.
async function loadProducts(db: D1Database, filters: ProductFilters, slug?: string): Promise<ProductDTO[]> {
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
  if (slug !== undefined) {
    conditions.push('p.slug = ?');
    values.push(slug);
  }
  const { results: products } = await db.prepare(`SELECT ${PRODUCT_COLUMNS}
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE ${conditions.join(' AND ')} ORDER BY p.id LIMIT ${slug === undefined ? 100 : 1}`)
    .bind(...values).all<ProductRow>();
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
    FROM product_images WHERE product_id IN (${placeholders}) ORDER BY product_id, sort_order, id`)
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

export function listProducts(db: D1Database, filters: ProductFilters = {}): Promise<ProductDTO[]> {
  return loadProducts(db, filters);
}

export async function getProduct(db: D1Database, slug: string): Promise<ProductDTO> {
  const [product] = await loadProducts(db, {}, slug);
  if (!product) throw new AppError('NOT_FOUND', 404, 'Không tìm thấy sản phẩm.');
  return product;
}
