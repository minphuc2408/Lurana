import { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminOrders, getAdminSummary } from '../admin-api.service';
import type { AdminOrderRow, AdminSummary } from '../admin-api.types';

export function useAdminApiDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const generation = useRef(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    const revision = ++generation.current;
    setLoading(true); setError(null);
    try {
      const [nextSummary, recent] = await Promise.all([getAdminSummary(signal), getAdminOrders({ limit: '10', offset: '0' }, signal)]);
      if (!signal?.aborted && revision === generation.current) { setSummary(nextSummary); setOrders(recent.items); }
    } catch (cause) { if (!signal?.aborted && revision === generation.current) setError(cause); }
    finally { if (!signal?.aborted && revision === generation.current) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => { controller.abort(); generation.current++; }; }, [load]);
  return { summary, orders, loading, error, reload: () => void load() };
}
export type AdminApiDashboardModel = ReturnType<typeof useAdminApiDashboard>;
