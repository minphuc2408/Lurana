import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n';
import { loadTurnstile, turnstileSiteKey, type TurnstileApi } from '../lib/turnstile';

export function TurnstileChallenge({ action, onToken, resetKey }: {
  action: 'checkout' | 'lookup' | 'admin_login'; onToken: (token: string) => void; resetKey: number;
}) {
  const { t, language } = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [size, setSize] = useState<'flexible' | 'compact'>('compact');
  useEffect(() => {
    if (!turnstileSiteKey || !container.current) return;
    // Flexible widgets need at least 300px; compact fits narrow checkout/login cards.
    const observer = new ResizeObserver(entries => setSize(entries[0].contentRect.width < 300 ? 'compact' : 'flexible'));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!turnstileSiteKey) return;
    let disposed = false;
    let widget: string | undefined;
    let api: TurnstileApi | undefined;
    onToken(''); setFailed(false);
    const fail = () => { if (!disposed) { onToken(''); setFailed(true); } };
    void loadTurnstile().then(loaded => {
      if (disposed || !container.current) return;
      api = loaded;
      widget = loaded.render(container.current, {
        sitekey: turnstileSiteKey, action, language, size, theme: 'light',
        callback: token => { if (!disposed) { onToken(token); setFailed(false); } },
        'expired-callback': () => { if (!disposed) onToken(''); },
        'error-callback': fail, 'timeout-callback': fail,
      });
    }).catch(fail);
    return () => { disposed = true; if (widget !== undefined) api?.remove(widget); onToken(''); };
  }, [action, language, onToken, resetKey, retry, size]);
  if (!turnstileSiteKey) return null;
  return <div data-turnstile-challenge={action} className="my-4 min-w-0" aria-label={t('Security verification')}>
    <div ref={container} />
    {failed && <div role="alert" className="mt-2 text-sm text-lunara-ink">
      <p>{t('Security verification unavailable')}</p>
      <button type="button" className="mt-2 rounded-full border border-lunara-border px-4 py-2" onClick={() => setRetry(value => value + 1)}>{t('Retry')}</button>
    </div>}
  </div>;
}
