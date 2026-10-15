import { useLocale, getLocalizedName } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { vietnamDate } from '@/shared/lib/format';
import { DeliveryOptions } from './DeliveryOptions';
import type { CodCheckoutModel, CodForm } from '../hooks/useCodCheckout';

const inputClass = 'mt-2 w-full rounded-xl border border-lunara-border bg-lunara-surface px-4 py-3 text-lunara-ink';
export function CodCheckoutForm(model: CodCheckoutModel) {
  const { t, language } = useLocale("cart");
  const fields: { key: keyof CodForm; path: string; label: string; type?: string; max: number; required?: boolean; min?: number; autoComplete?: string }[] = [
    { key: 'senderName', path: 'sender.name', label: 'Sender name', max: 100, required: true, autoComplete: 'section-sender name' },
    { key: 'senderPhone', path: 'sender.phone', label: 'Sender phone', type: 'tel', max: 30, required: true, autoComplete: 'section-sender tel' },
    { key: 'senderEmail', path: 'sender.email', label: 'Sender email optional', type: 'email', max: 254, autoComplete: 'section-sender email' },
    { key: 'recipientName', path: 'recipient.name', label: 'Recipient name', max: 100, required: true, autoComplete: 'section-recipient name' },
    { key: 'recipientPhone', path: 'recipient.phone', label: 'Recipient phone', type: 'tel', max: 30, required: true, autoComplete: 'section-recipient tel' },
    { key: 'address', path: 'recipient.address_line', label: 'House number and street', max: 200, min: 5, required: true, autoComplete: 'section-recipient street-address' },
  ];
  return <form data-checkout-form onSubmit={event => { event.preventDefault(); model.review(); }} className="space-y-6">
    <section className="rounded-2xl border border-lunara-border bg-white p-6">
      <h2 className="mb-5 font-display text-2xl text-lunara-ink">{t('Sender and recipient')}</h2>
      <div className="grid gap-5 sm:grid-cols-2">{fields.map(field => <label key={field.key} className="block text-sm text-lunara-body">{t(field.label)}<input name={field.key} type={field.type || 'text'} value={String(model.form[field.key])} onChange={event => model.updateForm(field.key, event.target.value)} required={field.required} minLength={field.min} maxLength={field.max} autoComplete={field.autoComplete} aria-invalid={model.invalidFields.includes(field.path)} aria-describedby={model.invalidFields.includes(field.path) ? `error-${field.key}` : undefined} className={inputClass} />{model.invalidFields.includes(field.path) && <span id={`error-${field.key}`} className="mt-2 block text-sm text-lunara-ink">{t('Check this field')}</span>}</label>)}</div>
      <label className="mt-5 flex items-center gap-3 text-sm text-lunara-body"><input name="anonymous" type="checkbox" checked={model.form.anonymous} onChange={event => model.updateForm('anonymous', event.target.checked)} className="accent-lunara-rose-strong" />{t('Keep sender anonymous')}</label>
    </section>
    <DeliveryOptions {...model} />
    <section className="rounded-2xl border border-lunara-border bg-white p-6">
      <h2 className="mb-5 font-display text-2xl text-lunara-ink">{t('Delivery date and card')}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-lunara-body">{t('Delivery date')}<input name="date" type="date" required value={model.form.date} min={vietnamDate()} max={model.method === 'STANDARD' ? vietnamDate(model.options?.limits.max_advance_days || 30) : vietnamDate()} onChange={event => model.updateForm('date', event.target.value)} className={inputClass} /></label>
        <label className="text-sm text-lunara-body">{t('Delivery time slot')}<select name="slot" required value={model.form.slot || model.options?.time_slots[0] || ''} onChange={event => model.updateForm('slot', event.target.value)} className={inputClass}>{model.options?.time_slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}</select></label>
        <label className="text-sm text-lunara-body">{t('Card type')}<select name="cardType" value={model.form.cardType} onChange={event => model.updateForm('cardType', event.target.value as CodForm['cardType'])} className={inputClass}>{['NONE', 'GREETING_CARD', 'BANNER'].map(type => <option key={type} value={type}>{t(type)}</option>)}</select></label>
      </div>
      <p className="mt-3 text-sm text-lunara-body">{t('Vietnam delivery time notice')}</p>
      {model.form.cardType !== 'NONE' && <label className="mt-5 block text-sm text-lunara-body">{t('Card message')}<textarea name="cardMessage" required maxLength={200} value={model.form.cardMessage} aria-invalid={model.invalidFields.includes('card.message')} aria-describedby={model.invalidFields.includes('card.message') ? 'error-cardMessage' : undefined} onChange={event => model.updateForm('cardMessage', event.target.value)} className={inputClass} rows={3} />{model.invalidFields.includes('card.message') && <span id="error-cardMessage" className="mt-2 block text-sm text-lunara-ink">{t('Check this field')}</span>}</label>}
      <label className="mt-5 block text-sm text-lunara-body">{t('Order note optional')}<textarea name="note" maxLength={500} value={model.form.note} onChange={event => model.updateForm('note', event.target.value)} className={inputClass} rows={3} /></label>
    </section>
    <section className="rounded-2xl border border-lunara-border bg-white p-6"><h2 className="font-display text-2xl text-lunara-ink">{t('Payment')}</h2><p className="mt-3 text-lunara-body">{t('Cash on delivery COD')}</p></section>
    {Boolean(model.submitError) && <div role="alert" className="rounded-xl border border-lunara-border bg-lunara-blush p-4 text-lunara-ink">{t(apiErrorKey(model.submitError))}{model.invalidFields.length > 0 && <p className="mt-2 text-sm">{t('Check required fields and phone')}</p>}</div>}
    {model.stockIssues.map(issue => <p key={issue.variant_id} role="alert">{t('Stock issue {{name}} {{available}}', { name: getLocalizedName(model.items.find(item => item.variantId === issue.variant_id) || {}, language) || '#' + issue.variant_id, available: issue.available ?? 0 })}</p>)}
    <div className="flex flex-wrap items-center gap-4"><button type="button" onClick={model.backToCart} className="rounded-full border border-lunara-border px-5 py-3 text-lunara-body">{t('← Back to Cart')}</button><button data-checkout-review type="submit" disabled={!model.ready} className="rounded-full bg-lunara-rose-strong px-7 py-3 text-white disabled:opacity-50">{t('Review order')}</button></div>
  </form>;
}
