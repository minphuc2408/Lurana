import { quoteSchema } from '../../shared/schemas.ts';
import { MAX_QTY_PER_LINE } from '../config.ts';
import { AppError } from '../lib/errors.ts';
import { parseSchema } from '../lib/validate.ts';
import { resolveFee } from './delivery.ts';

interface VariantRow {
  id: number;
  sku: string;
  name_vi: string;
  name_en: string;
  size_code: string;
  image_url: string | null;
  price: number;
  stock_quantity: number;
}

export interface QuoteLine {
  variant_id: number;
  sku: string;
  name_vi: string;
  name_en: string;
  size_code: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface QuoteIssue {
  variant_id: number;
  code: 'OUT_OF_STOCK' | 'VARIANT_UNAVAILABLE';
  available?: number;
}

export interface CartQuote {
  lines: QuoteLine[];
  subtotal: number;
  discount_total: 0;
  delivery_fee: number;
  grand_total: number;
  issues: QuoteIssue[];
}

/** Read-only pricing shared by quote and the future order service. Client prices are stripped. */
export async function priceCart(
  db: D1Database,
  items: { variant_id: number; quantity: number }[],
  province: string,
  ward: string,
  methodCode: string,
): Promise<CartQuote> {
  const input = parseSchema(quoteSchema, {
    items,
    province_name: province,
    ward_name: ward,
    delivery_method_code: methodCode,
  });
  const quantities = new Map<number, number>();
  for (const item of input.items) {
    const quantity = (quantities.get(item.variant_id) ?? 0) + item.quantity;
    if (quantity > MAX_QTY_PER_LINE) {
      throw new AppError('CART_LIMIT', 422, 'Mỗi loại hoa chỉ được mua tối đa 20 sản phẩm.');
    }
    quantities.set(item.variant_id, quantity);
  }

  const ids = [...quantities.keys()];
  // IDs are bounded to 15 by the schema; only placeholders are constructed from their count.
  const { results } = await db.prepare(`
    SELECT v.id, v.sku, v.size_code, v.price, v.stock_quantity, p.name_vi, p.name_en,
      (SELECT i.image_url FROM product_images i WHERE i.product_id = p.id
       ORDER BY i.is_primary DESC, i.sort_order, i.id LIMIT 1) AS image_url
    FROM product_variants v
    JOIN products p ON p.id = v.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE v.is_active = 1 AND p.status = 'ACTIVE' AND c.is_active = 1
      AND v.id IN (${ids.map(() => '?').join(',')})
  `).bind(...ids).all<VariantRow>();
  const variants = new Map(results.map(variant => [variant.id, variant]));
  const lines: QuoteLine[] = [];
  const issues: QuoteIssue[] = [];
  let subtotal = 0;

  for (const [variantId, quantity] of quantities) {
    const variant = variants.get(variantId);
    if (!variant) {
      issues.push({ variant_id: variantId, code: 'VARIANT_UNAVAILABLE' });
      continue;
    }
    const lineTotal = variant.price * quantity;
    lines.push({
      variant_id: variantId,
      sku: variant.sku,
      name_vi: variant.name_vi,
      name_en: variant.name_en,
      size_code: variant.size_code,
      image_url: variant.image_url,
      unit_price: variant.price,
      quantity,
      line_total: lineTotal,
    });
    subtotal += lineTotal;
    if (quantity > variant.stock_quantity) {
      issues.push({ variant_id: variantId, code: 'OUT_OF_STOCK', available: variant.stock_quantity });
    }
  }

  const deliveryFee = await resolveFee(
    db, input.province_name, input.ward_name, subtotal, input.delivery_method_code,
  );
  return {
    lines,
    subtotal,
    discount_total: 0,
    delivery_fee: deliveryFee,
    grand_total: subtotal + deliveryFee,
    issues,
  };
}
