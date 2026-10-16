import { orderSchema, type OrderInput } from '../../../shared/schemas.ts';

export interface CodForm {
  senderName: string; senderPhone: string; senderEmail: string; anonymous: boolean;
  recipientName: string; recipientPhone: string; address: string;
  date: string; slot: string; cardType: 'NONE' | 'GREETING_CARD' | 'BANNER'; cardMessage: string; note: string;
}

export function copySenderToRecipient(form: CodForm): CodForm {
  return { ...form, recipientName: form.senderName, recipientPhone: form.senderPhone };
}

export function updateCheckoutForm<K extends keyof CodForm>(form: CodForm, key: K, value: CodForm[K], sameRecipient: boolean): CodForm {
  const next = { ...form, [key]: value };
  if (key === 'cardType' && value === 'NONE') next.cardMessage = '';
  return sameRecipient ? copySenderToRecipient(next) : next;
}

export function canReviewCheckout(payload: OrderInput, options: {
  quoteReady: boolean; termsAccepted: boolean; payment: 'COD' | 'BANK_TRANSFER';
  today: string; latestDate: string; slots: string[];
}): boolean {
  return options.quoteReady && options.termsAccepted && options.payment === 'COD'
    && orderSchema.safeParse(payload).success && payload.delivery.date >= options.today
    && payload.delivery.date <= options.latestDate && options.slots.includes(payload.delivery.time_slot);
}
