import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { inputInteger } from '../admin-api.adapters';
import { getDeliveryZones, saveDeliveryZone, deleteAdminZone } from '../admin-api.service';
import { useAdminListQuery } from './useAdminListQuery';
import type { DeliveryZone, ZoneForm } from '../admin-api.types';
import { canonicalWardName, type AdministrativeProvince } from '../../../../shared/delivery-areas';
import { ApiError } from '@/shared/api/client';

const toForm = (zone?: DeliveryZone): ZoneForm => ({ province_name: zone?.province_name ?? '', ward_name: canonicalWardName(zone?.ward_name ?? ''), fee: String(zone?.fee ?? 0),
  free_from_amount: zone?.free_from_amount == null ? '' : String(zone.free_from_amount), eta_minutes: zone?.eta_minutes == null ? '' : String(zone.eta_minutes), is_active: zone?.is_active ?? true });
export function useAdminDeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const list = useAdminListQuery(10);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ all: 0, active: 0, inactive: 0 });
  const [deletingZone, setDeletingZone] = useState<DeliveryZone | null>(null);
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const [deletePending, setDeletePending] = useState(false);
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
    try {
      const result = await getDeliveryZones(list.queryRef.current, signal);
      if (!signal?.aborted && revision === generation.current) {
        if (!result.counts || !Number.isSafeInteger(result.total)) throw new ApiError('BAD_RESPONSE', 'Missing zone pagination metadata.');
        if (list.clamp(result.total)) return;
        setZones(result.items); setTotal(result.total); setCounts(result.counts); setProvinces(result.provinces);
      }
    }
    catch (cause) { if (!signal?.aborted && revision === generation.current) setError(cause); }
    finally { if (!signal?.aborted && revision === generation.current) setLoading(false); }
  }, [list.query]);
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
      setDialogOpen(false); await load();
    } catch (cause) { setFormError(cause); }
    finally { inFlight.current = false; setPending(false); }
  };
  const toggle = async (zone: DeliveryZone) => {
    if (inFlight.current) return;
    inFlight.current = true; setToggleId(zone.id); setError(null);
    generation.current++;
    try { await saveDeliveryZone(zone.id, { ...zone, is_active: !zone.is_active }); await load(); }
    catch (cause) { setError(cause); }
    finally { inFlight.current = false; setToggleId(null); }
  };
  const confirmDeleteZone = async () => {
    if (!deletingZone || inFlight.current) return;
    inFlight.current = true; setDeletePending(true); setDeleteError(null);
    try { await deleteAdminZone(deletingZone.id); setDeletingZone(null); await load(); }
    catch (cause) { setDeleteError(cause); }
    finally { inFlight.current = false; setDeletePending(false); }
  };
  const wards = provinces.find(province => province.province_name === form.province_name)?.wards || [];
  const validAddress = wards.some(ward => ward.ward_name === form.ward_name);
  return { zones, total, counts, list, provinces, wards, validAddress, loading, error, reload: () => void load(), dialogOpen, setDialogOpen, editingId, form, setForm, formError, pending, toggleId, openCreate, openEdit, save, toggle,
    deletingZone, deleteError, deletePending, confirmDeleteZone, requestDeleteZone: (zone: DeliveryZone | null) => { if (!deletePending) { setDeleteError(null); setDeletingZone(zone); } },
    selectProvince: (value: string) => setForm(previous => ({ ...previous, province_name: value, ward_name: '' })),
    selectWard: (value: string) => setForm(previous => ({ ...previous, ward_name: value })),
  };
}
export type AdminDeliveryZonesModel = ReturnType<typeof useAdminDeliveryZones>;
