import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { lookupOrderSchema } from '../../../../shared/schemas';
import { ApiError } from '@/shared/api/client';
import { lookupOrder } from '../order-api.service';
import type { OrderDetail } from '../order-api.types';
import { useTurnstile } from '@/shared/hooks/useTurnstile';

export function useOrderLookup() {
  const challenge = useTurnstile();
  const [params] = useSearchParams();
  const [orderNumber, updateOrderNumber] = useState(params.get('order') || '');
  const [phone, updatePhone] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const version = useRef(0);
  useEffect(() => () => { version.current++; controllerRef.current?.abort(); }, []);
  const clearResult = () => {
    version.current++; controllerRef.current?.abort(); controllerRef.current = null;
    setOrder(null); setError(null); setLoading(false);
  };
  const search = async () => {
    if (controllerRef.current || !challenge.ready) return;
    const parsed = lookupOrderSchema.safeParse({ order_number: orderNumber, phone });
    setOrder(null); setError(null);
    if (!parsed.success) { setError(new ApiError('VALIDATION_ERROR', 'Check order number and phone.')); return; }
    const requestVersion = ++version.current;
    const controller = new AbortController(); controllerRef.current = controller; setLoading(true);
    try { const result = await lookupOrder({ ...parsed.data, ...(challenge.token ? { turnstile_token: challenge.token } : {}) }, controller.signal); if (requestVersion === version.current) setOrder(result); }
    catch (failure) { if (requestVersion === version.current) setError(failure); }
    finally { challenge.reset(); if (requestVersion === version.current) { controllerRef.current = null; setLoading(false); } }
  };
  return { orderNumber, setOrderNumber: (value: string) => { clearResult(); updateOrderNumber(value); },
    phone, setPhone: (value: string) => { clearResult(); updatePhone(value); }, order, error, loading, search, challenge };
}
export type OrderLookupModel = ReturnType<typeof useOrderLookup>;
