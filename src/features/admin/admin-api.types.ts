import type { ProductApiDto, ProductVariant } from '@/features/shop';
import type { ApiOrderStatus, OrderDetail } from '@/features/orders';
import type { AdminProductCounts, AdminZoneCounts } from '../../../shared/admin-list-schemas';

export interface AdminOrderRow {
  id: number; order_number: string; status_code: ApiOrderStatus; payment_method: 'COD'; payment_status: 'UNPAID' | 'PAID';
  sender_name: string; sender_phone: string; recipient_name: string; recipient_phone: string;
  delivery_date: string; delivery_time_slot: string; grand_total: number; placed_at: string;
}
export interface AdminOrderDetail extends OrderDetail { admin_note: string | null; stock_released: boolean; }
export interface AdminSummary { orders_by_status: Record<ApiOrderStatus, number>; period_days: number; today_orders: number; low_stock_count: number; }
export interface AdminVariant extends Omit<ProductVariant, 'in_stock' | 'low_stock' | 'max_quantity'> {
  product_id: number; stock_quantity: number; low_stock_threshold: number; is_active: boolean;
}
export interface AdminProduct extends Omit<ProductApiDto, 'variants' | 'images'> {
  category_id: number; status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED'; archived_at: string | null; variants: AdminVariant[];
  images: (ProductApiDto['images'][number] & { id: number; sort_order: number; cloudinary_public_id: string | null })[];
}
export interface DeliveryZone {
  id: number; province_name: string; ward_name: string; fee: number; free_from_amount: number | null; eta_minutes: number | null; is_active: boolean;
}
export interface VariantDraft { price: string; compare_at_price: string; low_stock_threshold: string; stock_delta: string; is_active: boolean; }
export interface ProductImageDraft { url: string; cloudinary_public_id?: string | null; alt_vi?: string | null; alt_en?: string | null; is_primary: boolean; }
export interface ProductForm {
  name_en: string; name_vi: string; category_id: string; image_url: string; images: ProductImageDraft[];
  status: AdminProduct['status']; is_featured: boolean;
  variants: { size_code: 'S' | 'M' | 'L'; sku: string; price: string; stock_quantity: string; low_stock_threshold: string }[];
}
export interface ZoneForm { province_name: string; ward_name: string; fee: string; free_from_amount: string; eta_minutes: string; is_active: boolean; }

export type AdminOrderCounts = Record<ApiOrderStatus, number>;
export interface AdminOrdersResult { items: AdminOrderRow[]; total: number; counts_by_status: AdminOrderCounts; }
export interface AdminProductsResult { items: AdminProduct[]; total: number; counts: AdminProductCounts; limit: number; offset: number; }
export interface AdminZonesResult { items: DeliveryZone[]; total: number; counts: AdminZoneCounts; limit: number; offset: number; provinces: import('../../../shared/delivery-areas').AdministrativeProvince[]; }
