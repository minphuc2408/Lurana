import { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminOrders, getAdminSummary } from '../admin-api.service';
import type { AdminOrderRow, AdminSummary } from '../admin-api.types';

export function useAdminApiDashboard() {
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const summaryCache = useRef<AdminSummary | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [ordersPopup, setOrdersPopup] = useState<{ number?: string } | null>(null);
  const generation = useRef(0);
  const load = useCallback(async (signal?: AbortSignal, refresh = false) => {
    const revision = ++generation.current;
    setLoading(true); setError(null);
    try {
      const [nextSummary, recent] = await Promise.all([!refresh && summaryCache.current ? Promise.resolve(summaryCache.current) : getAdminSummary(signal), getAdminOrders({ limit: '5', offset: String(page * 5) }, signal)]);
      if (!signal?.aborted && revision === generation.current) { summaryCache.current = nextSummary; setSummary(nextSummary); setOrders(recent.items); setTotal(recent.total); if (page > 0 && page * 5 >= recent.total) setPage(Math.floor(Math.max(0, recent.total - 1) / 5)); }
    } catch (cause) { if (!signal?.aborted && revision === generation.current) setError(cause); }
    finally { if (!signal?.aborted && revision === generation.current) setLoading(false); }
  }, [page]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => { controller.abort(); generation.current++; }; }, [load]);
  return { summary, orders, total, page, pageSize: 5, setPage, loading, error, ordersPopup, setOrdersPopup, reload: () => void load(undefined, true) };
}
export type AdminApiDashboardModel = ReturnType<typeof useAdminApiDashboard>;
