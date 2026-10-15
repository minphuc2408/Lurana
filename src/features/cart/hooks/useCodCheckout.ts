import { useRef, useState } from 'react';
import { orderSchema, type OrderInput } from '../../../../shared/schemas';
import { submitOrder, type OrderSummary } from '@/features/orders';
import { ApiError } from '@/shared/api/client';
import { vietnamDate } from '@/shared/lib/format';
import { useQuoteCart } from './useQuoteCart';
import { checkoutIntent, type CheckoutIntent } from '../checkout-intent';

export interface CodForm {
  senderName: string; senderPhone: string; senderEmail: string; anonymous: boolean;
  recipientName: string; recipientPhone: string; address: string;
  date: string; slot: string; cardType: 'NONE' | 'GREETING_CARD' | 'BANNER'; cardMessage: string; note: string;
}
export function useCodCheckout() {
  const cart = useQuoteCart();
  const [step, setStep] = useState<'cart' | 'details' | 'review' | 'success'>('cart');
  const [form, setForm] = useState<CodForm>({ senderName: '', senderPhone: '', senderEmail: '', anonymous: false,
    recipientName: '', recipientPhone: '', address: '', date: vietnamDate(1), slot: '', cardType: 'NONE', cardMessage: '', note: '' });
  const [error, setError] = useState<unknown>(null);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const sendingRef = useRef(false);
  const intentRef = useRef<CheckoutIntent | null>(null);
  const makePayload = (): OrderInput => ({
    items: cart.items.map(item => ({ variant_id: item.variantId!, quantity: item.qty })),
    sender: { name: form.senderName, phone: form.senderPhone, ...(form.senderEmail.trim() ? { email: form.senderEmail } : {}), is_anonymous: form.anonymous },
    recipient: { name: form.recipientName, phone: form.recipientPhone, province_name: cart.province, ward_name: cart.ward, address_line: form.address },
    delivery: { method_code: cart.method, date: form.date, time_slot: form.slot || cart.options?.time_slots[0] || '' },
    card: { type: form.cardType, ...(form.cardType === 'NONE' ? {} : { message: form.cardMessage }) },
    ...(form.note ? { customer_note: form.note } : {}),
  });
  const ready = Boolean(cart.quote && !cart.quote.issues.length && !cart.quoteLoading && !cart.quoteError && cart.items.length);
  const review = () => {
    const parsed = orderSchema.safeParse(makePayload());
    if (!parsed.success) { setInvalidFields(parsed.error.issues.map(issue => issue.path.join('.'))); setError(new ApiError('VALIDATION_ERROR', 'Check order details.')); return; }
    if (!ready || !form.date || !parsed.data.delivery.time_slot) { setError(new ApiError('INVALID_DELIVERY_SLOT', 'Select valid delivery details.')); return; }
    setInvalidFields([]); setError(null);
    intentRef.current = checkoutIntent(parsed.data, intentRef.current);
    setStep('review');
  };
  const placeOrder = async () => {
    if (sendingRef.current || !ready) return;
    const parsed = orderSchema.safeParse(makePayload());
    if (!parsed.success) { setStep('details'); setError(new ApiError('VALIDATION_ERROR', 'Check order details.')); return; }
    const intent = checkoutIntent(parsed.data, intentRef.current);
    intentRef.current = intent;
    sendingRef.current = true; setSending(true); setError(null);
    try {
      const result = await submitOrder(parsed.data, intent.key);
      setOrder(result); setStep('success'); cart.clearCart(); cart.reloadCatalog();
    } catch (failure) {
      setError(failure);
      if (failure instanceof ApiError && ['OUT_OF_STOCK', 'VARIANT_UNAVAILABLE'].includes(failure.code)) { cart.retry(); cart.reloadCatalog(); }
    } finally { sendingRef.current = false; setSending(false); }
  };
  const stockIssues = error instanceof ApiError && Array.isArray(error.details) && ['OUT_OF_STOCK', 'VARIANT_UNAVAILABLE'].includes(error.code)
    ? error.details as { variant_id: number; available?: number }[] : [];
  return { ...cart, step, form, submitError: error, invalidFields, sending, order, ready, stockIssues,
    updateForm: <K extends keyof CodForm>(key: K, value: CodForm[K]) => { setForm(previous => ({ ...previous, [key]: value })); setInvalidFields([]); },
    setMethod: (value: Parameters<typeof cart.setMethod>[0]) => { const method = typeof value === 'function' ? value(cart.method) : value; cart.setMethod(method); if (method !== 'STANDARD') setForm(previous => ({ ...previous, date: vietnamDate() })); },
    startCheckout: () => { setError(null); setStep('details'); },
    editDetails: () => { if (!sendingRef.current) setStep('details'); },
    backToCart: () => { if (!sendingRef.current) setStep('cart'); }, review, placeOrder,
  };
}
export type CodCheckoutModel = ReturnType<typeof useCodCheckout>;
