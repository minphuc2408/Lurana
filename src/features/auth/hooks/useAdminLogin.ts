import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './useAuth';
import { useTurnstile } from '@/shared/hooks/useTurnstile';

export function useAdminLogin() {
  const auth = useAuth();
  const challenge = useTurnstile();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState('');
  const inFlight = useRef(false);
  useEffect(() => { if (auth.user?.role === 'admin') navigate('/admin/dashboard', { replace: true }); }, [auth.user, navigate]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !challenge.ready) return;
    if (!password) { setErrorKey('API validation error'); return; }
    inFlight.current = true; setSubmitting(true); setErrorKey('');
    try {
      const result = await auth.login(password, undefined, challenge.token);
      if (result.success) { setPassword(''); navigate('/admin/dashboard', { replace: true }); }
      else setErrorKey(result.error);
    } finally { challenge.reset(); inFlight.current = false; setSubmitting(false); }
  };
  return { password, setPassword, submitting, errorKey, submit, challenge };
}
export type AdminLoginModel = ReturnType<typeof useAdminLogin>;
