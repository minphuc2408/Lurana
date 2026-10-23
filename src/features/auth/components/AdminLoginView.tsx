import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import type { AdminLoginModel } from '../hooks/useAdminLogin';
import { TurnstileChallenge } from '@/shared/components/TurnstileChallenge';

export function AdminLoginView(model: AdminLoginModel) {
  const { t } = useLocale("auth");
  const common = useLocale();
  return <main data-admin-login className="flex min-h-dvh items-center justify-center bg-lunara-admin-background px-5 py-24 font-body text-lunara-ink">
    <div className="w-full max-w-md">
      <div className="mb-9 flex items-center justify-center gap-3"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={36} height={36} /><span className="font-display text-4xl tracking-[-0.03em]">{t('Lunara Shop')}</span></div>
      <section className="rounded-2xl border border-lunara-border bg-lunara-admin-panel p-7 sm:p-9">
        <h1 className="font-display text-3xl font-normal">{t('Admin sign in')}</h1><p className="mt-3 text-sm leading-relaxed text-lunara-body">{t('Manage your Lunara shop')}</p>
        <form data-testid="admin-login" onSubmit={model.submit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm">{t('Password')}</label>
            <input id="admin-password" name="password" type="password" required maxLength={1024} autoComplete="current-password" placeholder={t('Password')} value={model.password} onChange={event => model.setPassword(event.target.value)} disabled={model.submitting} className="admin-input min-h-12 w-full rounded-lg border border-lunara-border bg-lunara-admin-panel px-4 text-sm placeholder:text-lunara-body placeholder:opacity-100" />
          </div>
          {model.errorKey && <p role="alert" className="rounded-lunara-admin-panel bg-lunara-blush p-3 text-sm text-lunara-ink">{common.t(model.errorKey)}</p>}
          <TurnstileChallenge action="admin_login" {...model.challenge} />
          <button data-testid="admin-login-submit" disabled={model.submitting || !model.challenge.ready} className="min-h-12 w-full rounded-lg bg-lunara-admin-primary px-4 py-3 text-sm font-medium text-lunara-on-admin-primary transition-colors hover:bg-lunara-admin-primary-hover disabled:opacity-50">{t(model.submitting ? 'Signing in…' : 'Sign In')}</button>
        </form>
      </section>
      <div className="mt-7 text-center"><Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-lunara-body underline-offset-4 hover:text-lunara-ink hover:underline"><ArrowLeft size={15} />{t('Back to Home')}</Link></div>
    </div>
  </main>;
}
