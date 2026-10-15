import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { useLocale } from '@/shared/i18n';
import { apiErrorKey } from '@/shared/api/client';
import { useAuth } from '../hooks/useAuth';

export function AdminRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { t } = useLocale();
  if (auth.loading) return <div role="status" className="p-10 font-body text-lunara-ink">{t('Loading…')}</div>;
  if (auth.error && !auth.user) return <div className="p-10 font-body text-lunara-ink"><p role="alert">{t(apiErrorKey(auth.error))}</p><button onClick={() => void auth.refresh()} className="mt-4 rounded-full bg-lunara-rose-strong px-5 py-2 text-white">{t('Retry')}</button></div>;
  if (!auth.user) return <Navigate to="/admin/login" replace />;
  if (auth.user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
