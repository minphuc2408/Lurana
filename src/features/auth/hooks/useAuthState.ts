import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, apiErrorKey } from '@/shared/api/client';
import { ADMIN_UNAUTHORIZED_EVENT, getAdminSession, loginAdmin, logoutAdmin } from '../admin-auth.service';
import type { AuthUser, LoginResult } from '../auth.types';

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const generation = useRef(0);
  const sessionController = useRef<AbortController | null>(null);
  const invalidateSessionRead = useCallback(() => { generation.current++; sessionController.current?.abort(); }, []);
  const readSession = useCallback(async (signal?: AbortSignal) => {
    invalidateSessionRead();
    const revision = generation.current;
    const controller = new AbortController();
    sessionController.current = controller;
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const current = () => !controller.signal.aborted && revision === generation.current;
    setLoading(true); setError(null);
    try { const session = await getAdminSession(controller.signal); if (current()) setUser(session); }
    catch (cause) {
      if (!current()) return;
      if (cause instanceof ApiError && cause.status === 401) setUser(null);
      else setError(cause);
    } finally { signal?.removeEventListener('abort', abort); if (current()) setLoading(false); }
  }, [invalidateSessionRead]);
  useEffect(() => {
    const controller = new AbortController();
    void readSession(controller.signal);
    const unauthorized = () => { invalidateSessionRead(); setUser(null); setError(null); setLoading(false); };
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, unauthorized);
    return () => { controller.abort(); window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, unauthorized); };
  }, [readSession, invalidateSessionRead]);
  const login = async (emailOrPassword: string, password?: string): Promise<LoginResult> => {
    invalidateSessionRead();
    const revision = generation.current;
    setError(null);
    try {
      const session = await loginAdmin(password ?? emailOrPassword);
      if (revision !== generation.current) return { success: false, error: apiErrorKey(new ApiError('UNAUTHORIZED', 'Session changed.')) };
      setUser(session); setLoading(false);
      return { success: true, user: session };
    } catch (cause) { if (revision === generation.current) setLoading(false); return { success: false, error: apiErrorKey(cause) }; }
  };
  const logout = async () => {
    invalidateSessionRead();
    const revision = generation.current;
    setError(null);
    try { await logoutAdmin(); if (revision === generation.current) { setUser(null); setLoading(false); } return true; }
    catch (cause) {
      if (revision !== generation.current) return false;
      if (cause instanceof ApiError && cause.status === 401) { setUser(null); setLoading(false); return true; }
      setError(cause); setLoading(false); return false;
    }
  };
  return { user, loading, error, refresh: () => readSession(), login, logout };
}
