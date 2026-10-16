import { useCallback, useState } from 'react';
import { turnstileSiteKey } from '../lib/turnstile';

export function useTurnstile() {
  const [token, onToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const reset = useCallback(() => { onToken(''); setResetKey(value => value + 1); }, []);
  return { token, onToken, resetKey, reset, ready: !turnstileSiteKey || Boolean(token) };
}
