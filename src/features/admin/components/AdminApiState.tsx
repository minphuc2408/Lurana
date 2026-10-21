import { useLocale } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { AlertCircle } from 'lucide-react';

export const adminInputClass = 'min-h-11 w-full rounded-[var(--lunara-admin-radius-field)] border border-lunara-control-border bg-lunara-admin-panel px-3 py-2 text-sm text-lunara-ink placeholder:text-lunara-body placeholder:opacity-100 disabled:cursor-not-allowed disabled:opacity-60';
export const adminButtonClass = 'min-h-11 rounded-full bg-lunara-admin-primary px-5 py-2 text-sm font-medium text-lunara-on-admin-primary transition-colors hover:bg-lunara-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-60';
export const adminSecondaryClass = 'min-h-11 rounded-full border border-lunara-control-border bg-lunara-admin-panel px-5 py-2 text-sm text-lunara-ink transition-colors hover:bg-lunara-admin-soft disabled:cursor-not-allowed disabled:opacity-60';

export function AdminApiState({ loading, error, onRetry, empty = false }: { loading?: boolean; error?: unknown; onRetry?: () => void; empty?: boolean }) {
  const { t } = useLocale();
  const admin = useLocale("admin");
  return <>
    {loading && <p role="status" className="py-5 text-sm text-lunara-body">{t('Loading…')}</p>}
    {error != null && <div role="alert" className="my-4 rounded-lunara-admin-panel border border-lunara-danger/40 bg-lunara-admin-panel p-4 text-sm text-lunara-ink"><p className="flex items-start gap-2"><AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-lunara-danger" />{t(apiErrorKey(error))}</p>{onRetry && <button type="button" onClick={onRetry} className={`${adminSecondaryClass} mt-3`}>{t('Retry')}</button>}</div>}
    {!loading && error == null && empty && <p className="py-8 text-center text-lunara-body">{admin.t('No results')}</p>}
  </>;
}
