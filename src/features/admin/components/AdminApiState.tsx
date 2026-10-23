import type { KeyboardEvent } from 'react';
import { useLocale } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { AlertCircle, LoaderCircle, SearchX } from 'lucide-react';

export const adminInputClass = 'admin-input min-h-11 w-full rounded-lg border-0 bg-lunara-admin-soft px-3 py-2.5 text-sm text-lunara-ink transition-colors placeholder:text-lunara-body placeholder:opacity-100 disabled:cursor-not-allowed disabled:opacity-50';
export const adminButtonClass = 'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-lunara-admin-primary px-4 py-2.5 text-sm font-medium text-lunara-on-admin-primary transition-colors hover:bg-lunara-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50';
export const adminSecondaryClass = 'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border-0 bg-lunara-admin-soft px-4 py-2.5 text-sm font-medium text-lunara-ink transition-colors hover:bg-lunara-admin-soft disabled:cursor-not-allowed disabled:opacity-45';

export function AdminStatusBadge({ status }: { status: string }) {
  const { t } = useLocale('admin');
  return <span data-admin-status={status} className="admin-status"><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />{t(`Status ${status}`)}</span>;
}

export function AdminApiState({ loading, error, onRetry, empty = false }: { loading?: boolean; error?: unknown; onRetry?: () => void; empty?: boolean }) {
  const { t } = useLocale();
  const admin = useLocale("admin");
  return <>
    {loading && <p role="status" className="flex items-center justify-center gap-3 py-12 text-sm text-lunara-body"><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{t('Loading…')}</p>}
    {error != null && <div role="alert" className="my-3 rounded-xl border border-lunara-danger/40 bg-lunara-admin-panel p-4 text-sm text-lunara-ink"><p className="flex items-start gap-2"><AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-lunara-danger" />{t(apiErrorKey(error))}</p>{onRetry && <button type="button" onClick={onRetry} className={`${adminSecondaryClass} mt-4`}>{t('Retry')}</button>}</div>}
    {!loading && error == null && empty && <div role="status" className="flex flex-col items-center gap-3 py-16 text-sm text-lunara-body"><SearchX size={28} strokeWidth={1.25} aria-hidden="true" /><p className="font-medium text-lunara-ink">{admin.t('No results')}</p></div>}
  </>;
}

export function adminTabKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')].filter(tab => !tab.disabled && tab.getBoundingClientRect().width > 0);
  const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (!tabs.length) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].focus(); tabs[next].click();
}
