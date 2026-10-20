import { Dropdown } from '@/shared/ui/dropdown';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { vietnamDate } from '@/shared/lib/format';
import { DeliveryOptions, DeliveryMethods } from './DeliveryOptions';
import { CheckoutPayment } from './CheckoutPayment';
import type { CodCheckoutModel, CodForm } from '../hooks/useCodCheckout';
import { useCheckoutFieldFocus } from '../hooks/useCheckoutFieldFocus';

const inputClass = 'mt-1 min-h-11 w-full min-w-0 rounded-[2px] border-0 bg-lunara-cream p-2.5 text-base leading-6 font-normal text-lunara-ink placeholder:text-lunara-body placeholder:opacity-100';
const sectionClass = 'min-w-0 space-y-4 rounded-[2px] border border-lunara-border bg-lunara-surface p-5 sm:p-6';
const headingClass = 'border-b border-lunara-border pb-2 font-display text-xl leading-7 text-lunara-ink';
export function CodCheckoutForm(model: CodCheckoutModel) {
  const { t, language } = useLocale('cart');
  const formRef = useCheckoutFieldFocus();
  const fields: { key: keyof CodForm; path: string; label: string; type?: string; max: number; min?: number; autoComplete: string; placeholder: string }[] = [
    { key: 'senderName', path: 'sender.name', label: 'Orderer name', max: 100, autoComplete: 'section-sender name', placeholder: 'Your full name' },
    { key: 'senderPhone', path: 'sender.phone', label: 'Orderer phone', type: 'tel', max: 30, autoComplete: 'section-sender tel', placeholder: 'Your phone number' },
    { key: 'recipientName', path: 'recipient.name', label: 'Recipient name', max: 100, autoComplete: 'section-recipient name', placeholder: 'Flower recipient name' },
    { key: 'recipientPhone', path: 'recipient.phone', label: 'Recipient phone', type: 'tel', max: 30, autoComplete: 'section-recipient tel', placeholder: 'Recipient phone number' },
    { key: 'address', path: 'recipient.address_line', label: 'Flower delivery address', max: 200, min: 5, autoComplete: 'section-recipient street-address', placeholder: 'House number, street, building or company' },
  ];
  const renderField = (field: typeof fields[number]) => <label key={field.key} className="block min-w-0 text-sm font-medium leading-5 text-lunara-body">{t(field.label)} <span aria-hidden="true" className="text-lunara-rose-strong">*</span>
    <input name={field.key} type={field.type || 'text'} value={String(model.form[field.key])} onChange={event => model.updateForm(field.key, event.target.value)} readOnly={model.sameRecipient && (field.key === 'recipientName' || field.key === 'recipientPhone')} required minLength={field.min} maxLength={field.max} autoComplete={field.autoComplete} placeholder={t(field.placeholder)} aria-invalid={model.invalidFields.includes(field.path)} aria-describedby={model.invalidFields.includes(field.path) ? 'error-' + field.key : undefined} className={inputClass + ' read-only:bg-lunara-blush'} />
    {model.invalidFields.includes(field.path) && <span id={'error-' + field.key} className="mt-2 block text-sm leading-6 text-lunara-ink">{t(field.type === 'tel' ? 'Enter a valid phone number' : field.key === 'address' ? 'Enter a delivery address of at least 5 characters' : 'Enter the full name')}</span>}
  </label>;
  return <form ref={formRef} id="cod-checkout" data-checkout-form onSubmit={event => { event.preventDefault(); model.review(); }}>
    <fieldset disabled={model.sending} className="space-y-8">
      <section data-checkout-block="sender" className={sectionClass}>
        <h2 className={headingClass}>1. {t('Orderer information')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.filter(field => field.key === 'senderName' || field.key === 'senderPhone').map(renderField)}</div>
        <div className="space-y-3 pt-1"><label className="flex items-start gap-2 text-sm leading-relaxed"><input name="sameRecipient" type="checkbox" checked={model.sameRecipient} onChange={event => model.setSameRecipient(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-lunara-rose-strong" />{t('Orderer is also recipient')}</label>
          <label className="flex items-start gap-2 text-sm leading-relaxed"><input name="anonymous" type="checkbox" checked={model.form.anonymous} onChange={event => model.updateForm('anonymous', event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-lunara-rose-strong" />{t('Keep sender anonymous')}</label></div>
      </section>
      <section data-checkout-block="recipient" className={sectionClass}>
        <h2 className={headingClass}>2. {t('Flower recipient address')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.filter(field => field.key === 'recipientName' || field.key === 'recipientPhone').map(renderField)}</div>
        <DeliveryOptions {...model} embedded hideMethods />
        {fields.filter(field => field.key === 'address').map(renderField)}
      </section>
      <section data-checkout-block="delivery" className={sectionClass}>
        <h2 className={headingClass}>3. {t('Flower delivery schedule')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block min-w-0 text-sm">{t('Flower delivery date')}<input name="date" type="date" required value={model.form.date} min={vietnamDate()} max={model.method === 'STANDARD' ? vietnamDate(model.options?.limits.max_advance_days || 30) : vietnamDate()} onChange={event => model.updateForm('date', event.target.value)} className={inputClass} /></label>
          <label className="block min-w-0 text-sm">{t('Delivery time slot')}<Dropdown name="slot" required value={model.form.slot || model.options?.time_slots[0] || ''} onValueChange={value => model.updateForm('slot', value)} className={inputClass} contentClassName="[&_[role=option]]:text-base [&_[role=option]]:leading-6">{model.options?.time_slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}</Dropdown></label>
        </div>
        <p className="text-sm leading-relaxed">{t('Vietnam delivery time notice')}</p><DeliveryMethods {...model} />
      </section>
      <section data-checkout-block="card" className={sectionClass}>
        <h2 className={headingClass}>4. {t('Card for this order')}</h2>
        <label className="block text-sm">{t('Card type')}<Dropdown name="cardType" value={model.form.cardType} onValueChange={value => model.updateForm('cardType', value as CodForm['cardType'])} className={inputClass} contentClassName="[&_[role=option]]:text-base [&_[role=option]]:leading-6">{['NONE', 'GREETING_CARD', 'BANNER'].map(type => <option key={type} value={type}>{t(type)}</option>)}</Dropdown></label>
        {model.form.cardType !== 'NONE' && <label className="block text-sm">{t('Message content')}<textarea name="cardMessage" required maxLength={200} value={model.form.cardMessage} aria-invalid={model.invalidFields.includes('card.message')} aria-describedby={model.invalidFields.includes('card.message') ? 'error-cardMessage' : undefined} onChange={event => model.updateForm('cardMessage', event.target.value)} className={inputClass} rows={3} />{model.invalidFields.includes('card.message') && <span id="error-cardMessage" className="mt-2 block text-sm leading-6 text-lunara-ink">{t('Enter a message for this card')}</span>}</label>}
        <p className="text-sm leading-relaxed">{t('One card for the whole order notice')}</p>
      </section>
      <CheckoutPayment {...model} />
      {Boolean(model.submitError) && <div role="alert" className="rounded-[2px] border border-lunara-border bg-lunara-blush p-3 text-sm text-lunara-ink">{t(apiErrorKey(model.submitError))}{model.invalidFields.length > 0 && <p className="mt-2">{t('Check required fields and phone')}</p>}</div>}
      {model.stockIssues.map(issue => <p key={issue.variant_id} role="alert" className="text-sm">{t('Stock issue {{name}} {{available}}', { name: getLocalizedName(model.items.find(item => item.variantId === issue.variant_id) || {}, language) || '#' + issue.variant_id, available: issue.available ?? 0 })}</p>)}
    </fieldset>
  </form>;
}
