import { Dropdown } from "@/shared/ui/dropdown";
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { vietnamDate } from '@/shared/lib/format';
import { DeliveryOptions, DeliveryMethods } from './DeliveryOptions';
import type { CodCheckoutModel, CodForm } from '../hooks/useCodCheckout';

const inputClass = 'mt-2 w-full min-w-0 rounded-xl border border-lunara-border bg-lunara-surface px-4 py-3 text-lunara-ink';
export function CodCheckoutForm(model: CodCheckoutModel) {
  const { t, language } = useLocale("cart");
  const fields: { key: keyof CodForm; path: string; label: string; type?: string; max: number; required?: boolean; min?: number; autoComplete?: string }[] = [
    { key: 'senderName', path: 'sender.name', label: 'Orderer name', max: 100, required: true, autoComplete: 'section-sender name' },
    { key: 'senderPhone', path: 'sender.phone', label: 'Orderer phone', type: 'tel', max: 30, required: true, autoComplete: 'section-sender tel' },
    { key: 'recipientName', path: 'recipient.name', label: 'Recipient name', max: 100, required: true, autoComplete: 'section-recipient name' },
    { key: 'recipientPhone', path: 'recipient.phone', label: 'Recipient phone', type: 'tel', max: 30, required: true, autoComplete: 'section-recipient tel' },
    { key: 'address', path: 'recipient.address_line', label: 'Flower delivery address', max: 200, min: 5, required: true, autoComplete: 'section-recipient street-address' },
  ];
  return <form id="cod-checkout" data-checkout-form onSubmit={event => { event.preventDefault(); model.review(); }} className="space-y-6">
    <div className="space-y-6"><section data-checkout-block="sender" className="min-w-0 rounded-2xl border border-lunara-border bg-white p-5 sm:p-6">
      <h2 className="mb-5 font-display text-2xl text-lunara-ink">1. {t('Orderer information')}</h2>
      <div className="grid gap-5 sm:grid-cols-2">{fields.filter(field => field.key === 'senderName' || field.key === 'senderPhone').map(field => <label key={field.key} className="block text-sm text-lunara-body">{t(field.label)}<input name={field.key} type={field.type || 'text'} value={String(model.form[field.key])} onChange={event => model.updateForm(field.key, event.target.value)} required={field.required} minLength={field.min} maxLength={field.max} autoComplete={field.autoComplete} aria-invalid={model.invalidFields.includes(field.path)} aria-describedby={model.invalidFields.includes(field.path) ? `error-${field.key}` : undefined} className={inputClass} />{model.invalidFields.includes(field.path) && <span id={`error-${field.key}`} className="mt-2 block text-sm text-lunara-ink">{t('Check this field')}</span>}</label>)}</div>
      <div className="mt-5 grid grid-cols-2 gap-4"><label className="flex items-start gap-3 text-sm leading-6 text-lunara-body"><input name="sameRecipient" type="checkbox" checked={model.sameRecipient} onChange={event => model.setSameRecipient(event.target.checked)} className="mt-1 size-4 shrink-0 accent-lunara-rose-strong" />{t('Orderer is also recipient')}</label>
      <label className="flex items-start gap-3 text-sm leading-6 text-lunara-body"><input name="anonymous" type="checkbox" checked={model.form.anonymous} onChange={event => model.updateForm('anonymous', event.target.checked)} className="mt-1 size-4 shrink-0 accent-lunara-rose-strong" />{t('Keep sender anonymous')}</label></div>
    </section>
<section data-checkout-block="recipient" className="min-w-0 rounded-2xl border border-lunara-border bg-white p-5 sm:p-6"><h2 className="mb-5 font-display text-2xl text-lunara-ink">2. {t('Recipient information')}</h2>
      <div className="grid gap-5 sm:grid-cols-2">{fields.filter(field => ['recipientName', 'recipientPhone', 'address'].includes(field.key)).map(field => <label key={field.key} className={`block text-sm text-lunara-body ${field.key === 'address' ? 'sm:col-span-2' : ''}`}>{t(field.label)}<input name={field.key} type={field.type || 'text'} value={String(model.form[field.key])} onChange={event => model.updateForm(field.key, event.target.value)} readOnly={model.sameRecipient && field.key !== 'address'} required={field.required} minLength={field.min} maxLength={field.max} autoComplete={field.autoComplete} aria-invalid={model.invalidFields.includes(field.path)} aria-describedby={model.invalidFields.includes(field.path) ? `error-${field.key}` : undefined} className={`${inputClass} read-only:bg-lunara-blush`} />{model.invalidFields.includes(field.path) && <span id={`error-${field.key}`} className="mt-2 block text-sm text-lunara-ink">{t('Check this field')}</span>}</label>)}</div>
<DeliveryOptions {...model} embedded hideMethods /></section></div>
    <section data-checkout-block="card" className="min-w-0 rounded-2xl border border-lunara-border bg-white p-5 sm:p-6">
      <h2 className="mb-5 font-display text-2xl text-lunara-ink">3. {t('Card and delivery requests')}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-lunara-body">{t('Flower delivery date')}<input name="date" type="date" required value={model.form.date} min={vietnamDate()} max={model.method === 'STANDARD' ? vietnamDate(model.options?.limits.max_advance_days || 30) : vietnamDate()} onChange={event => model.updateForm('date', event.target.value)} className={inputClass} /></label>
        <label className="text-sm text-lunara-body">{t('Delivery time slot')}<Dropdown name="slot" required value={model.form.slot || model.options?.time_slots[0] || ''} onValueChange={value => model.updateForm('slot', value)} className={inputClass}>{model.options?.time_slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}</Dropdown></label>
        <label className="text-sm text-lunara-body">{t('Card type')}<Dropdown name="cardType" value={model.form.cardType} onValueChange={value => model.updateForm('cardType', value as CodForm['cardType'])} className={inputClass}>{['NONE', 'GREETING_CARD', 'BANNER'].map(type => <option key={type} value={type}>{t(type)}</option>)}</Dropdown></label>
      </div>
      <p className="mt-3 text-sm text-lunara-body">{t('Vietnam delivery time notice')}</p><div className="mt-5"><DeliveryMethods {...model} /></div>
      {model.form.cardType !== 'NONE' && <label className="mt-5 block text-sm text-lunara-body">{t('Message content')}<textarea name="cardMessage" required maxLength={200} value={model.form.cardMessage} aria-invalid={model.invalidFields.includes('card.message')} aria-describedby={model.invalidFields.includes('card.message') ? 'error-cardMessage' : undefined} onChange={event => model.updateForm('cardMessage', event.target.value)} className={inputClass} rows={3} />{model.invalidFields.includes('card.message') && <span id="error-cardMessage" className="mt-2 block text-sm text-lunara-ink">{t('Check this field')}</span>}</label>}
      <label className="mt-5 block text-sm text-lunara-body">{t('Order note optional')}<textarea name="note" maxLength={500} value={model.form.note} onChange={event => model.updateForm('note', event.target.value)} className={inputClass} rows={3} /></label>
    </section>
    {Boolean(model.submitError) && <div role="alert" className="rounded-xl border border-lunara-border bg-lunara-blush p-4 text-lunara-ink">{t(apiErrorKey(model.submitError))}{model.invalidFields.length > 0 && <p className="mt-2 text-sm">{t('Check required fields and phone')}</p>}</div>}
    {model.stockIssues.map(issue => <p key={issue.variant_id} role="alert">{t('Stock issue {{name}} {{available}}', { name: getLocalizedName(model.items.find(item => item.variantId === issue.variant_id) || {}, language) || '#' + issue.variant_id, available: issue.available ?? 0 })}</p>)}
  </form>;
}
