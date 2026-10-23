import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import type { ApiOrderStatus } from '@/features/orders';
import { ApiError } from '@/shared/api/client';
import { allowedAdminTransitions } from '../admin-api.adapters';
import { changeOrderStatus, getAdminOrder, getAdminOrders, saveAdminOrderNote } from '../admin-api.service';
import type { AdminOrderCounts, AdminOrderDetail, AdminOrderRow } from '../admin-api.types';
import { ORDER_STATUSES } from '../../../../shared/constants';
import { vietnamDate } from '@/shared/lib/format';

export function useAdminApiOrders({ initialOrder, initialStatus = '', loadList = true, followQuery = true }: { initialOrder?: string; initialStatus?: string; loadList?: boolean; followQuery?: boolean } = {}) {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ status: initialStatus, date: '', q: '', placed_from: vietnamDate(-89), placed_to: vietnamDate() });
  const [query, setQuery] = useState<Record<string, string>>({ limit: '10', offset: '0', ...(initialStatus ? { status: initialStatus } : {}) });
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<AdminOrderCounts>(Object.fromEntries(ORDER_STATUSES.map(status => [status, 0])) as AdminOrderCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<AdminOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<unknown>(null);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [transitionNote, setTransitionNote] = useState('');
  const [actionError, setActionError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [restock, setRestock] = useState(false);
  const inFlight = useRef(false);
  const listVersion = useRef(0);
  const queryRef = useRef(query);
  queryRef.current = query;
  const detailVersion = useRef(0);
  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    if (!loadList) { setLoading(false); return; }
    const version = ++listVersion.current;
    setLoading(true); setError(null);
    try {
      const request = queryRef.current;
      const result = await getAdminOrders(request, signal);
      if (!result.counts_by_status) throw new ApiError('BAD_RESPONSE', 'Missing order status counts.');
      if (!signal?.aborted && version === listVersion.current) {
        if (Number(request.offset) > 0 && Number(request.offset) >= result.total) {
          const size = Number(request.limit);
          setQuery({ ...request, offset: String(Math.min(10000, Math.floor(Math.max(0, result.total - 1) / size) * size)) });
          return;
        }
        setOrders(result.items); setTotal(result.total); setCounts(result.counts_by_status);
      }
    }
    catch (cause) { if (!signal?.aborted && version === listVersion.current) setError(cause); }
    finally { if (!signal?.aborted && version === listVersion.current) setLoading(false); }
  }, [query, loadList]);
  useEffect(() => { const controller = new AbortController(); void loadOrders(controller.signal); return () => controller.abort(); }, [loadOrders]);
  const loadDetail = useCallback(async (number: string) => {
    const version = ++detailVersion.current;
    setSelectedNumber(number); setDetailLoading(true); setDetailError(null);
    try {
      const detail = await getAdminOrder(number);
      if (version === detailVersion.current) { setSelected(detail); setAdminNote(detail.admin_note ?? ''); }
    } catch (cause) { if (version === detailVersion.current) setDetailError(cause); }
    finally { if (version === detailVersion.current) setDetailLoading(false); }
  }, []);
  const requestedNumber = initialOrder ?? (followQuery ? params.get('order') : null);
  useEffect(() => { if (requestedNumber) void loadDetail(requestedNumber); }, [requestedNumber, loadDetail]);
  useEffect(() => () => { detailVersion.current++; }, []);
  const openOrder = (number: string) => { if (inFlight.current) return; setSelected(null); setActionError(null); setSaved(false); setTransitionNote(''); void loadDetail(number); };
  const submitFilters = (event: FormEvent) => { event.preventDefault(); setQuery({ limit: queryRef.current.limit, offset: '0', ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) }); };
  const selectStatus = (status: string) => {
    setFilters(current => ({ ...current, status }));
    const next: Record<string, string> = { ...queryRef.current, offset: '0' };
    if (status) next.status = status; else delete next.status;
    setQuery(next);
  };
  const resetFilters = () => {
    const status = queryRef.current.status ?? '';
    setFilters({ status, date: '', q: '', placed_from: vietnamDate(-89), placed_to: vietnamDate() });
    setQuery({ limit: queryRef.current.limit, offset: '0', ...(status ? { status } : {}) });
  };
  const transition = async (status: ApiOrderStatus) => {
    if (!selected || inFlight.current) return;
    inFlight.current = true; setPending(true); setActionError(null); setSaved(false);
    try { await changeOrderStatus(selected.order_number, status, transitionNote, status === 'CANCELLED' && selected.status_code === 'IN_TRANSIT' ? restock : undefined); setConfirmCancel(false); setTransitionNote(''); await Promise.all([loadDetail(selected.order_number), loadOrders()]); }
    catch (cause) {
      setActionError(cause);
      if (cause instanceof ApiError && cause.code === 'INVALID_TRANSITION') await Promise.all([loadDetail(selected.order_number), loadOrders()]);
    } finally { inFlight.current = false; setPending(false); }
  };
  const requestTransition = (status: ApiOrderStatus) => { if (status === 'CANCELLED') { setActionError(null); setRestock(false); setConfirmCancel(true); } else void transition(status); };
  const saveNote = async () => {
    if (!selected || inFlight.current) return;
    inFlight.current = true; setPending(true); setActionError(null); setSaved(false);
    try { await saveAdminOrderNote(selected.order_number, adminNote); setSelected({ ...selected, admin_note: adminNote || null }); setSaved(true); }
    catch (cause) { setActionError(cause); }
    finally { inFlight.current = false; setPending(false); }
  };
  const offset = Number(query.offset ?? 0);
  const pageSize = Number(query.limit);
  return { orders, total, counts, loading, error, reload: () => void loadOrders(), filters, setFilters, submitFilters, selectStatus, resetFilters, status: query.status ?? '', offset, pageSize,
    page: Math.floor(offset / pageSize),
    setPage: (page: number) => setQuery({ ...queryRef.current, offset: String(Math.max(0, Math.min(10000, page * pageSize))) }),
    setPageSize: (size: number) => setQuery({ ...queryRef.current, limit: String(size), offset: '0' }),
    selected, selectedNumber, detailLoading, detailError, retryDetail: () => void loadDetail(selectedNumber), openOrder,
    closeOrder: () => { if (inFlight.current) return; detailVersion.current++; setSelected(null); setSelectedNumber(''); setDetailError(null); setDetailLoading(false); },
    adminNote, setAdminNote, transitionNote, setTransitionNote, actionError, pending, saved, saveNote,
    transitions: selected ? allowedAdminTransitions(selected.status_code) : [], requestTransition, confirmCancel, setConfirmCancel,
    restock, setRestock, confirmCancellation: () => void transition('CANCELLED') };
}
export type AdminApiOrdersModel = ReturnType<typeof useAdminApiOrders>;
