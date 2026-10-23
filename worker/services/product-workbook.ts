import { readSheet } from 'read-excel-file/universal';
import writeXlsxFile, { type SheetData } from 'write-excel-file/universal';
import { strFromU8, unzipSync, zipSync } from 'fflate';
import { adminProductDataSchema } from '../../shared/admin-catalog-schemas.ts';
import { PRODUCT_IMPORT_COLUMNS, PRODUCT_IMPORT_MAX_BYTES, PRODUCT_IMPORT_MAX_PRODUCTS,
  PRODUCT_IMPORT_MAX_VARIANTS, type ProductImportIssue } from '../../shared/product-import.ts';
import { AppError } from '../lib/errors.ts';
import type { z } from 'zod';

export type ImportedProduct = z.output<typeof adminProductDataSchema> & { rows: number[] };
export function workbookError(message: string, details: ProductImportIssue[] = [{ path: 'file', message }]): never {
  throw new AppError('VALIDATION_ERROR', 400, message, details.slice(0, 100));
}
export function encodeWorkbook(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
const cell = (value: string | number | boolean) => ({ value, type: typeof value === 'number' ? Number : typeof value === 'boolean' ? Boolean : String });
const header = (values: readonly string[]) => values.map(value => ({ ...cell(value), fontWeight: 'bold' as const }));
export async function createProductWorkbook(categories: { id: number; code: string; name_vi: string; name_en: string }[]): Promise<Uint8Array> {
  const example = (['S', 'M', 'L'] as const).map((size, i) => [categories[0]?.id ?? 1, 'hoa-mau-thay-slug', 'Hoa mẫu — thay dữ liệu',
    'Example flowers — replace data', '', '', '', false, 'HIDDEN', `EXAMPLE-${size}`, size, 200000 + i * 50000, '', 10, 5, true].map(cell));
  const instructions = [
    ['Hướng dẫn / Instructions', 'Quy tắc / Rules'],
    ['Products', 'Nhập vào sheet Products, giữ hàng tiêu đề. / Fill Products; keep the header row.'],
    ['Mỗi dòng / Each row', 'Một kích cỡ/SKU; lặp đầy đủ thông tin sản phẩm cho mọi dòng cùng slug. / One size/SKU; repeat all product fields for the same slug.'],
    ['Bắt buộc / Required', 'category_id, slug, name_vi, name_en, sku, size_code, price, stock_quantity, low_stock_threshold'],
    ['Danh mục / Category', 'Chọn category_id từ sheet Categories. / Choose category_id from Categories.'],
    ['slug', 'Duy nhất, chữ thường a-z, số và dấu gạch ngang; không dùng by-variants. / Unique lowercase letters, digits, hyphens; by-variants is reserved.'],
    ['size_code', 'S, M, L, STANDARD, DELUXE; 1–5 kích cỡ khác nhau/sản phẩm. / 1–5 distinct sizes per product.'],
    ['price, compare_at_price', 'VND nguyên không âm, không dấu phân cách. Giá so sánh trống hoặc ≥ giá bán. / Nonnegative integer VND; compare price blank or ≥ price.'],
    ['stock_quantity, low_stock_threshold', 'Số nguyên không âm, bắt buộc kể cả 0. / Required nonnegative integers, including 0.'],
    ['status', 'ACTIVE, HIDDEN, ARCHIVED; trống = ACTIVE. / Blank = ACTIVE.'],
    ['is_featured, is_active', 'TRUE/FALSE hoặc 1/0; trống = FALSE/TRUE. / TRUE/FALSE or 1/0; blank = FALSE/TRUE respectively.'],
    ['badge_code', 'Trống / blank, BEST_SELLER, HOT, NEW.'],
    ['description_vi, description_en', 'Tùy chọn, tối đa 5000 ký tự. / Optional, up to 5000 characters.'],
    ['Giới hạn / Limits', '50 sản phẩm, 250 SKU, 1 MB/file .xlsx; không công thức. / 50 products, 250 SKUs, 1 MB .xlsx; no formulas.'],
    ['Tạo mới / Create only', 'Slug/SKU đã có sẽ bị từ chối. File lỗi không ghi dữ liệu. / Existing slugs/SKUs rejected; invalid file writes nothing.'],
    ['Ảnh / Images', 'Bỏ qua ảnh trong file. Sau khi nhập, chọn Tải ảnh ở sản phẩm rồi Lưu sản phẩm. / Add images afterward using Upload images, then Save product.'],
    ['Examples', 'Dữ liệu minh họa, không tự nhập. Chép sang Products và sửa trước khi dùng. / Examples are not imported; copy to Products and replace before use.'],
  ].map(row => row.map(cell));
  const sheets: { sheet: string; data: SheetData; columns: { width: number }[]; stickyRowsCount?: number }[] = [
    { sheet: 'Products', data: [header(PRODUCT_IMPORT_COLUMNS)], columns: PRODUCT_IMPORT_COLUMNS.map(() => ({ width: 24 })), stickyRowsCount: 1 },
    { sheet: 'Instructions', data: instructions, columns: [{ width: 36 }, { width: 120 }] },
    { sheet: 'Categories', data: [header(['category_id', 'code', 'name_vi', 'name_en']), ...categories.map(row => [row.id, row.code, row.name_vi, row.name_en].map(cell))], columns: [12, 24, 36, 36].map(width => ({ width })) },
    { sheet: 'Examples', data: [header(PRODUCT_IMPORT_COLUMNS), ...example], columns: PRODUCT_IMPORT_COLUMNS.map(() => ({ width: 24 })) },
  ];
  const blob = await writeXlsxFile(sheets).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}

// Bound ZIP expansion before invoking the spreadsheet parser. Repack only inspected XML
// so archive metadata cannot select a different, unchecked entry on the second read.
function boundedWorkbook(base64: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  if (!bytes.length || bytes.length > PRODUCT_IMPORT_MAX_BYTES) workbookError('File Excel phải nhỏ hơn hoặc bằng 1 MB.');
  let total = 0;
  let count = 0;
  const entries = unzipSync(bytes, { filter(entry) {
    if (++count > 64 || !Number.isFinite(entry.originalSize) || entry.originalSize > 2 * 1024 * 1024
      || (total += entry.originalSize) > 4 * 1024 * 1024) workbookError('File Excel vượt giới hạn giải nén.');
    return /\.(xml|rels)$/.test(entry.name);
  } });
  for (const [name, entry] of Object.entries(entries)) {
    const xml = strFromU8(entry);
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) workbookError('File Excel chứa XML không được hỗ trợ.');
    // Relationship targets may use a nonstandard path; inspect every XML entry.
    if (name.endsWith('.xml')) {
      if (/<(?:\w+:)?f[\s/>]/.test(xml)) workbookError('Vui lòng thay công thức Excel bằng giá trị trước khi nhập.');
      if ([...xml.matchAll(/<(?:\w+:)?row[\s/>]/g)].length > 1000 || [...xml.matchAll(/<(?:\w+:)?c[\s/>]/g)].length > 64000) {
        workbookError('File Excel vượt 1000 dòng hoặc 64 cột.');
      }
      // Also bound formatted empty rows/cells; the parser preserves gaps.
      for (const tag of xml.matchAll(/<(?:\w+:)?(?:row|c)\b([^>]*)>/g)) {
        const reference = /\sr\s*=\s*["']([^"']*)["']/.exec(tag[1]);
        if (!reference) continue;
        const address = /^([A-Z]*)([1-9]\d*)$/.exec(reference[1]);
        if (!address) workbookError('Tọa độ ô Excel không hợp lệ.');
        const column = [...address[1]].reduce((value, char) => value * 26 + char.charCodeAt(0) - 64, 0);
        if (Number(address[2]) > 1000 || column > 64) workbookError('File Excel vượt 1000 dòng hoặc 64 cột.');
      }
    }
  }
  return zipSync(entries, { level: 0 }).buffer as ArrayBuffer;
}

export async function parseProductWorkbook(base64: string): Promise<ImportedProduct[]> {
  let rows;
  try { rows = await readSheet(boundedWorkbook(base64), 'Products', { trim: false }); }
  catch (error) {
    if (error instanceof AppError) throw error;
    workbookError('Không đọc được file .xlsx. Hãy dùng template và giữ sheet Products.');
  }
  const columns = rows[0]?.map(value => typeof value === 'string' ? value.trim() : value) ?? [];
  if (columns.length !== PRODUCT_IMPORT_COLUMNS.length || PRODUCT_IMPORT_COLUMNS.some(column => columns.filter(value => value === column).length !== 1)) {
    workbookError('Các cột không khớp template. Vui lòng tải template mới và giữ đầy đủ tiêu đề.');
  }
  const issues: ProductImportIssue[] = [];
  const grouped = new Map<string, { product: Record<string, unknown>; variants: Record<string, unknown>[]; rows: number[] }>();
  const seenSkus = new Set<string>();
  let variants = 0;
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    if (row.every(value => value == null || value === '')) continue;
    if (++variants > PRODUCT_IMPORT_MAX_VARIANTS) workbookError('Mỗi file chỉ được tối đa 250 SKU.');
    const number = index + 1;
    const values = Object.fromEntries(PRODUCT_IMPORT_COLUMNS.map(column => [column, row[columns.indexOf(column)]]));
    const issue = (path: string, message: string) => issues.push({ row: number, path, message });
    const text = (key: string) => {
      const value = values[key];
      if (value == null) return '';
      if (typeof value !== 'string') { issue(key, 'Dùng kiểu văn bản cho cột này.'); return ''; }
      return value.trim();
    };
    const integer = (key: string, optional = false): number | null => {
      const value = values[key];
      if (optional && (value == null || value === '')) return null;
      const parsed = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : NaN;
      if (!Number.isSafeInteger(parsed) || parsed < 0) issue(key, 'Nhập số nguyên không âm, không dấu phân cách.');
      return parsed;
    };
    const boolean = (key: string, fallback: boolean): boolean => {
      const value = values[key];
      if (value == null || value === '') return fallback;
      if (value === true || value === 1 || String(value).trim().toUpperCase() === 'TRUE' || value === '1') return true;
      if (value === false || value === 0 || String(value).trim().toUpperCase() === 'FALSE' || value === '0') return false;
      issue(key, 'Nhập TRUE/FALSE hoặc 1/0.'); return fallback;
    };
    const product = { category_id: integer('category_id'), slug: text('slug'), name_vi: text('name_vi'), name_en: text('name_en'),
      description_vi: text('description_vi') || null, description_en: text('description_en') || null,
      badge_code: text('badge_code') || null, is_featured: boolean('is_featured', false), status: text('status') || 'ACTIVE' };
    const variant = { sku: text('sku'), size_code: text('size_code'), price: integer('price'), compare_at_price: integer('compare_at_price', true),
      stock_quantity: integer('stock_quantity'), low_stock_threshold: integer('low_stock_threshold'), is_active: boolean('is_active', true) };
    if (row.slice(columns.length).some(value => value != null && value !== '')) issue('file', 'Có dữ liệu ngoài các cột template.');
    if (seenSkus.has(variant.sku)) issue('sku', 'SKU không được trùng trong file.');
    seenSkus.add(variant.sku);
    const group = grouped.get(product.slug);
    if (group) {
      if (JSON.stringify(group.product) !== JSON.stringify(product)) issue('slug', 'Các dòng cùng slug phải có cùng thông tin sản phẩm.');
      group.variants.push(variant); group.rows.push(number);
    } else grouped.set(product.slug, { product, variants: [variant], rows: [number] });
  }
  if (!grouped.size) workbookError('Sheet Products chưa có sản phẩm.');
  if (grouped.size > PRODUCT_IMPORT_MAX_PRODUCTS) workbookError('Mỗi file chỉ được tối đa 50 sản phẩm.');
  const products: ImportedProduct[] = [];
  for (const group of grouped.values()) {
    const result = adminProductDataSchema.safeParse({ ...group.product, variants: group.variants });
    if (!result.success) {
      for (const issue of result.error.issues) {
        const variantIndex = issue.path[0] === 'variants' && typeof issue.path[1] === 'number' ? issue.path[1] : 0;
        issues.push({ row: group.rows[variantIndex], path: issue.path.join('.'), message: issue.message });
      }
    } else products.push({ ...result.data, rows: group.rows });
  }
  if (issues.length) workbookError('File có lỗi. Chưa có sản phẩm nào được nhập.', issues);
  return products;
}
