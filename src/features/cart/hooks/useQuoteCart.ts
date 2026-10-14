import { useEffect, useState } from 'react';
import { useCart } from './useCart';
import { useCatalog } from '@/features/shop';
import { getDeliveryOptions, requestQuote, type CartQuote, type DeliveryData, type MethodCode } from '../quote.service';
export function useQuoteCart() {
  const cart = useCart(); const catalog = useCatalog();
  const [options, setOptions] = useState<DeliveryData | null>(null);
  const [optionsError, setOptionsError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [method, setMethod] = useState<MethodCode>('STANDARD');
  const [result, setResult] = useState<{ key: string; data?: CartQuote; error?: unknown } | null>(null);
  useEffect(() => {
    const controller = new AbortController(); let active = true; setOptionsError(null);
    getDeliveryOptions(controller.signal).then(data => {
      if (!active) return; setOptions(data);
      setProvince(previous => previous || data.provinces[0]?.province_name || '');
      setWard(previous => previous || data.provinces[0]?.wards[0]?.ward_name || '');
    }).catch(error => { if (active) { setOptions(null); setOptionsError(error); } });
    return () => { active = false; controller.abort(); };
  }, [version]);
  const key = JSON.stringify([cart.items.map(item => [item.variantId, item.qty]), province, ward.trim(), method, version]);
  useEffect(() => {
    if (!cart.items.length || !province || !ward.trim() || !options) return;
    const controller = new AbortController(); let active = true;
    requestQuote(cart.items, province, ward, method, controller.signal).then(data => { if (active) setResult({ key, data }); })
      .catch(error => { if (active) setResult({ key, error }); });
    return () => { active = false; controller.abort(); };
  }, [key, options]);
  const quote = result?.key === key ? result.data || null : null;
  const quoteError = result?.key === key ? result.error : null;
  const displayItems = cart.items.map(item => {
    const line = quote?.lines.find(line => line.variant_id === item.variantId);
    return line ? { ...item, name: line.name_en, name_en: line.name_en, name_vi: line.name_vi, price: line.unit_price, image: line.image_url || '' } : item;
  });
  const changeProvince = (value: string) => { setProvince(value); setWard(options?.provinces.find(item => item.province_name === value)?.wards[0]?.ward_name || ''); };
  return { ...cart, items: displayItems, quote, quoteError, options, optionsError, province, setProvince: changeProvince, ward, setWard, method, setMethod,
    catalogLoading: catalog.loading || (!catalog.error && cart.loading), catalogError: catalog.error, reloadCatalog: catalog.reload,
    quoteLoading: Boolean(cart.items.length && province && ward.trim() && options && !quote && !quoteError),
    retry: () => setVersion(previous => previous + 1) };
}
export type QuoteCartModel = ReturnType<typeof useQuoteCart>;
