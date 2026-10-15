import { Link } from 'react-router';
import { ArrowLeft, Flower } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import type { AdminLoginModel } from '../hooks/useAdminLogin';

export function AdminLoginView(model: AdminLoginModel) {
  const { t } = useLocale("auth");
  const common = useLocale();
  return <main className="flex min-h-screen items-center justify-center bg-lunara-cream px-5 py-16 font-body text-lunara-ink">
    <div className="w-full max-w-md">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-lunara-body"><ArrowLeft size={16} />{t('Back to Home')}</Link>
      <div className="mb-8 flex items-center justify-center gap-2"><Flower className="text-lunara-rose-strong" /><span className="font-display text-4xl">{t('Lunara Shop')}</span></div>
      <section className="rounded-3xl border border-lunara-border bg-white p-7 shadow-sm sm:p-9">
        <h1 className="font-display text-3xl">{t('Admin sign in')}</h1>
        <p className="mb-7 mt-2 text-sm text-lunara-body">{t('Manage your Lunara shop')}</p>
        <form data-testid="admin-login" onSubmit={model.submit} className="space-y-5">
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm">{t('Password')}</label>
            <input id="admin-password" name="password" type="password" required maxLength={1024} autoComplete="current-password" value={model.password} onChange={event => model.setPassword(event.target.value)} disabled={model.submitting} className="min-h-12 w-full rounded-xl border border-lunara-border bg-lunara-surface px-4" />
          </div>
          {model.errorKey && <p role="alert" className="rounded-xl bg-lunara-blush p-3 text-sm text-lunara-ink">{common.t(model.errorKey)}</p>}
          <button data-testid="admin-login-submit" disabled={model.submitting} className="min-h-12 w-full rounded-full bg-lunara-rose-strong px-6 py-3 text-white disabled:opacity-60">{t(model.submitting ? 'Signing in…' : 'Sign In')}</button>
        </form>
      </section>
    </div>
  </main>;
}
