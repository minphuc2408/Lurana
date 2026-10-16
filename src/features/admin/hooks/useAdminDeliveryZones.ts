import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { inputInteger } from '../admin-api.adapters';
import { getDeliveryZones, saveDeliveryZone } from '../admin-api.service';
import type { DeliveryZone, ZoneForm } from '../admin-api.types';
import { canonicalWardName, type AdministrativeProvince } from '../../../../shared/delivery-areas';
import { ApiError } from '@/shared/api/client';

const toForm = (zone?: DeliveryZone): ZoneForm => ({ province_name: zone?.province_name ?? '', ward_name: canonicalWardName(zone?.ward_name ?? ''), fee: String(zone?.fee ?? 0),
  free_from_amount: zone?.free_from_amount == null ? '' : String(zone.free_from_amount), eta_minutes: zone?.eta_minutes == null ? '' : String(zone.eta_minutes), is_active: zone?.is_active ?? true });
export function useAdminDeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [provinces, setProvinces] = useState<AdministrativeProvince[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ZoneForm>(toForm());
  const [formError, setFormError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [toggleId, setToggleId] = useState<number | null>(null);
  const inFlight = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    const revision = ++generation.current;
    setLoading(true); setError(null);
    try { const result = await getDeliveryZones(signal); if (!signal?.aborted && revision === generation.current) { setZones(result.items); setProvinces(result.provinces); } }
    catch (cause) { if (!signal?.aborted && revision === generation.current) setError(cause); }
    finally { if (!signal?.aborted && revision === generation.current) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => { controller.abort(); generation.current++; }; }, [load]);
  const openCreate = () => { setEditingId(null); setForm(toForm()); setFormError(null); setDialogOpen(true); };
  const openEdit = (zone: DeliveryZone) => { setEditingId(zone.id); setForm(toForm(zone)); setFormError(null); setDialogOpen(true); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (inFlight.current) return;
    if (!validAddress) { setFormError(new ApiError('VALIDATION_ERROR', 'Select a catalog address.')); return; }
    inFlight.current = true; setPending(true); setFormError(null);
    generation.current++;
    try {
      const saved = await saveDeliveryZone(editingId, { ...form, fee: inputInteger(form.fee), free_from_amount: form.free_from_amount === '' ? null : inputInteger(form.free_from_amount), eta_minutes: form.eta_minutes === '' ? null : inputInteger(form.eta_minutes) });
      setZones(current => editingId == null ? [...current, saved] : current.map(zone => zone.id === saved.id ? saved : zone)); setDialogOpen(false);
    } catch (cause) { setFormError(cause); }
    finally { inFlight.current = false; setPending(false); }
  };
  const toggle = async (zone: DeliveryZone) => {
    if (inFlight.current) return;
    inFlight.current = true; setToggleId(zone.id); setError(null);
    generation.current++;
    try { const saved = await saveDeliveryZone(zone.id, { ...zone, is_active: !zone.is_active }); setZones(current => current.map(item => item.id === saved.id ? saved : item)); }
    catch (cause) { setError(cause); }
    finally { inFlight.current = false; setToggleId(null); }
  };
  const wards = provinces.find(province => province.province_name === form.province_name)?.wards || [];
  const validAddress = wards.some(ward => ward.ward_name === form.ward_name);
  return { zones, provinces, wards, validAddress, loading, error, reload: () => void load(), dialogOpen, setDialogOpen, editingId, form, setForm, formError, pending, toggleId, openCreate, openEdit, save, toggle,
    selectProvince: (value: string) => setForm(previous => ({ ...previous, province_name: value, ward_name: '' })),
    selectWard: (value: string) => setForm(previous => ({ ...previous, ward_name: value })),
  };
}
export type AdminDeliveryZonesModel = ReturnType<typeof useAdminDeliveryZones>;
