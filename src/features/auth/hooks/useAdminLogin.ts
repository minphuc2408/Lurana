import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './useAuth';

export function useAdminLogin() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState('');
  const inFlight = useRef(false);
  useEffect(() => { if (auth.user?.role === 'admin') navigate('/admin/dashboard', { replace: true }); }, [auth.user, navigate]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!password) { setErrorKey('API validation error'); return; }
    inFlight.current = true; setSubmitting(true); setErrorKey('');
    try {
      const result = await auth.login(password);
      if (result.success) { setPassword(''); navigate('/admin/dashboard', { replace: true }); }
      else setErrorKey(result.error);
    } finally { inFlight.current = false; setSubmitting(false); }
  };
  return { password, setPassword, submitting, errorKey, submit };
}
export type AdminLoginModel = ReturnType<typeof useAdminLogin>;
