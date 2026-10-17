import { useLocale, getLocalizedName } from '@/shared/i18n';
import { formatVietnamDate } from '@/shared/lib/format';
import { apiErrorKey } from '@/shared/api/client';
import type { CodCheckoutModel } from '../hooks/useCodCheckout';
import { TurnstileChallenge } from '@/shared/components/TurnstileChallenge';

export function CodOrderReview(model: CodCheckoutModel) {
  const { t, language } = useLocale("cart");
  return <section data-checkout-confirm className="rounded-[2px] border border-lunara-border bg-lunara-surface p-5 sm:p-6">
    <h2 className="font-display text-2xl text-lunara-ink">{t('Confirm your order')}</h2>
    <dl className="my-6 space-y-5 text-xs leading-relaxed text-lunara-body">
      <div><dt className="font-medium text-lunara-ink">{t('Sender name')}</dt><dd>{model.form.senderName} · {model.form.senderPhone}</dd>{model.form.senderEmail && <dd>{model.form.senderEmail}</dd>}{model.form.anonymous && <dd>{t('Keep sender anonymous')}</dd>}</div>
      <div><dt className="font-medium text-lunara-ink">{t('Recipient name')}</dt><dd>{model.form.recipientName} · {model.form.recipientPhone}</dd><dd>{model.form.address}, {model.ward}, {model.province}</dd></div>
      <div><dt className="font-medium text-lunara-ink">{t('Delivery date')}</dt><dd>{formatVietnamDate(model.form.date, language)} · {model.form.slot || model.options?.time_slots[0]}</dd><dd>{t(model.method === 'STANDARD' ? 'Standard Delivery' : model.method === 'EXPRESS' ? 'Express Delivery' : 'Same-Day Delivery')}</dd></div>
      <div><dt className="font-medium text-lunara-ink">{t('Card type')}</dt><dd>{t(model.form.cardType)}</dd>{model.form.cardType !== 'NONE' && <dd className="whitespace-pre-wrap">{model.form.cardMessage}</dd>}</div>
      {model.form.note && <div><dt className="font-medium text-lunara-ink">{t('Order note optional')}</dt><dd className="whitespace-pre-wrap">{model.form.note}</dd></div>}
      <div><dt className="font-medium text-lunara-ink">{t('Payment')}</dt><dd>{t(model.payment === 'COD' ? 'Cash on delivery COD' : 'Bank transfer Internet Banking ATM')}</dd></div>
    </dl>
    <p className="mb-6 text-sm text-lunara-body">{t('Server confirms final total')}</p>
    <TurnstileChallenge action="checkout" {...model.challenge} />
    {Boolean(model.submitError) && <div role="alert" className="mb-4 rounded-xl bg-lunara-blush p-4 text-lunara-ink">{t(apiErrorKey(model.submitError))}<p className="mt-2 text-sm">{t('Retry keeps same order intent')}</p></div>}
    {model.stockIssues.map(issue => <p key={issue.variant_id} role="alert" className="mb-4">{t('Stock issue {{name}} {{available}}', { name: getLocalizedName(model.items.find(item => item.variantId === issue.variant_id) || {}, language) || '#' + issue.variant_id, available: issue.available ?? 0 })}</p>)}
    <div className="flex flex-wrap gap-4"><button data-checkout-edit type="button" disabled={model.sending} onClick={model.editDetails} className="rounded-[2px] border border-lunara-border px-5 py-3 text-xs text-lunara-body disabled:opacity-50">{t('Edit details')}</button></div>
    {model.sending && <p role="status" className="mt-4 text-lunara-body">{t('Placing order')}</p>}
  </section>;
}
