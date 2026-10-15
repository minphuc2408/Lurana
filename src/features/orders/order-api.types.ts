export type ApiOrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export interface OrderSummary {
  order_number: string; status_code: ApiOrderStatus; payment_method: 'COD'; payment_status: 'UNPAID' | 'PAID';
  subtotal: number; discount_total: number; delivery_fee: number; grand_total: number; placed_at: string; replayed?: boolean;
}
export interface OrderDetail extends OrderSummary {
  sender: { name: string; phone: string; email: string | null; is_anonymous: boolean };
  recipient: { name: string; phone: string; province_name: string; ward_name: string; address_line: string };
  delivery: { method_code: string; date: string; time_slot: string };
  card: { type: string; message: string | null }; customer_note: string | null;
  items: { sku: string; name_vi: string; name_en: string; size: string; image_url: string | null; unit_price: number; quantity: number; line_total: number }[];
  timeline: { from_status: string | null; to_status: string; note: string | null; occurred_at: string; actor_label?: string }[];
  delivered_at: string | null; paid_at: string | null;
}
