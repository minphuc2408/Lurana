import { useEffect, useRef, useState, type FormEvent } from 'react';
import { normalizeAddressSearch } from '../../../../shared/delivery-areas';
import type { AdminProduct, DeliveryZone } from '../admin-api.types';

export function useAdminPagination<T>(source: T[], initialSize = 5, resetKey = '') {
  const [position, setPosition] = useState({ key: resetKey, page: 0, size: initialSize });
  const pageSize = position.key === resetKey ? position.size : initialSize;
  const pageCount = Math.max(1, Math.ceil(source.length / pageSize));
  const page = Math.min(position.key === resetKey ? position.page : 0, pageCount - 1);
  return { items: source.slice(page * pageSize, (page + 1) * pageSize), total: source.length, page, pageSize,
    setPage: (value: number) => setPosition({ key: resetKey, page: Math.max(0, Math.min(value, pageCount - 1)), size: pageSize }),
    setPageSize: (size: number) => setPosition({ key: resetKey, page: 0, size }) };
}
export function useAdminToggle() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen(value => !value) };
}
export function useInventoryPanel(initiallyOpen: boolean) {
  const [open, setOpen] = useState(initiallyOpen);
  return { open, toggle: () => setOpen(value => !value) };
}
export function useInventoryFilters(source: AdminProduct[], search = '') {
  const [filter, setFilter] = useState('all');
  const lowStock = (product: AdminProduct) => product.status === 'ACTIVE' && product.variants.some(variant => variant.is_active && variant.stock_quantity <= variant.low_stock_threshold);
  const filtered = source.filter(product => filter === 'low' ? lowStock(product) : filter === 'hidden' ? product.status !== 'ACTIVE' : true);
  const pagination = useAdminPagination(filtered, 5, `${filter}:${search}`);
  return { filter, setFilter, products: pagination.items, pagination,
    lowStockCount: source.filter(lowStock).length, hiddenCount: source.filter(product => product.status !== 'ACTIVE').length };
}
export function useZoneFilters(source: DeliveryZone[]) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = source.filter(zone => (filter === 'all' || (filter === 'active' ? zone.is_active : !zone.is_active)) && normalizeAddressSearch(`${zone.province_name} ${zone.ward_name}`).includes(normalizeAddressSearch(search)));
  const pagination = useAdminPagination(filtered, 10, `${filter}:${search}`);
  return { search, setSearch, filter, setFilter, zones: pagination.items, pagination, activeCount: source.filter(zone => zone.is_active).length };
}
export type OrderSection = 'overview' | 'products' | 'notes' | 'history' | 'actions';
export function useAdminOrderWorkspace(orderNumber: string) {
  const [section, setSection] = useState<OrderSection>('overview');
  const [showStatusNote, setShowStatusNote] = useState(false);
  useEffect(() => { setSection('overview'); setShowStatusNote(false); }, [orderNumber]);
  return { section, setSection, showStatusNote, toggleStatusNote: () => setShowStatusNote(value => !value) };
}
export function useAdminProductEditor(open: boolean, editingId?: number, formError?: unknown, initialSection = 'general') {
  const [section, setSection] = useState('general');
  const [size, setSize] = useState('S');
  const [invalid, setInvalid] = useState(false);
  const revealingInvalid = useRef(false);
  const focusGallery = () => {
    const input = document.querySelector<HTMLInputElement>('[data-testid="product-image-file"]');
    if (input && !input.disabled) input.focus();
    else document.getElementById('product-tab-images')?.focus();
  };
  useEffect(() => { if (open) { setSection(initialSection); setSize('S'); setInvalid(false); } }, [open, editingId, initialSection]);
  useEffect(() => {
    if (!open || initialSection !== 'images' || section !== 'images') return;
    const frame = requestAnimationFrame(focusGallery);
    return () => cancelAnimationFrame(frame);
  }, [open, initialSection, section]);
  useEffect(() => { if (formError && typeof formError === 'object' && 'code' in formError && ['IMAGE_REQUIRED', 'IMAGE_LIMIT'].includes(String(formError.code))) setSection('images'); }, [formError]);
  const revealInvalid = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (revealingInvalid.current) return;
    revealingInvalid.current = true;
    const target = event.target as HTMLInputElement;
    const form = event.currentTarget;
    setInvalid(true);
    setSection(target.closest<HTMLElement>('[data-product-form-section]')?.dataset.productFormSection ?? 'general');
    const code = target.closest<HTMLElement>('[data-product-size]')?.dataset.productSize;
    if (code) setSize(code);
    requestAnimationFrame(() => {
      revealingInvalid.current = false;
      if (!target.isConnected) return;
      if (target.tagName === 'SELECT') form.querySelector<HTMLElement>(`[data-dropdown-name="${target.name}"]`)?.focus();
      else target.focus();
    });
  };
  const focusOnOpen = (event: Event) => {
    if (initialSection !== 'images') return;
    event.preventDefault();
    requestAnimationFrame(focusGallery);
  };
  return { section, setSection, size, setSize, invalid, revealInvalid, focusOnOpen, clearInvalid: () => setInvalid(false) };
}
export function useAdminCalendar(value: string) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;
  return { open, setOpen, selected: selected && Number.isFinite(selected.getTime()) ? selected : undefined };
}
