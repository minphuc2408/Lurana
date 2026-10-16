export interface TurnstileApi {
  render: (element: HTMLElement, options: {
    sitekey: string; action: string; language: string; size: 'flexible' | 'compact'; theme: 'light';
    callback: (token: string) => void; 'expired-callback': () => void;
    'error-callback': () => void; 'timeout-callback': () => void;
  }) => string;
  remove: (id: string) => void;
}
declare global { interface Window { turnstile?: TurnstileApi } }
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
export const turnstileSiteKey = env?.VITE_TURNSTILE_SITE_KEY?.trim() || '';
let loading: Promise<TurnstileApi> | undefined;

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const fail = () => { clearTimeout(timeout); script.remove(); reject(new Error('Verification unavailable')); };
    const timeout = setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => { clearTimeout(timeout); if (window.turnstile) resolve(window.turnstile); else fail(); };
    document.head.append(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}
