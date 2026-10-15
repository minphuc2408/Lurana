import { useLocale } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';

export const adminInputClass = 'min-h-11 w-full rounded-xl border border-lunara-border bg-white px-3 py-2 text-sm text-lunara-ink disabled:opacity-60';
export const adminButtonClass = 'min-h-11 rounded-full bg-lunara-rose-strong px-5 py-2 text-sm text-white disabled:cursor-wait disabled:opacity-60';
export const adminSecondaryClass = 'min-h-11 rounded-full border border-lunara-border bg-white px-5 py-2 text-sm text-lunara-ink disabled:opacity-60';

export function AdminApiState({ loading, error, onRetry, empty = false }: { loading?: boolean; error?: unknown; onRetry?: () => void; empty?: boolean }) {
  const { t } = useLocale();
  const admin = useLocale("admin");
  return <>
    {loading && <p role="status" className="py-5 text-sm text-lunara-body">{t('Loading…')}</p>}
    {error != null && <div role="alert" className="my-4 rounded-xl border border-lunara-border bg-lunara-blush p-4 text-sm text-lunara-ink"><p>{t(apiErrorKey(error))}</p>{onRetry && <button type="button" onClick={onRetry} className={`${adminSecondaryClass} mt-3`}>{t('Retry')}</button>}</div>}
    {!loading && error == null && empty && <p className="py-8 text-center text-lunara-body">{admin.t('No results')}</p>}
  </>;
}
