import { MAX_ADVANCE_DAYS, MIN_PREPARATION_MINUTES, SAME_DAY_CUTOFF, TIME_SLOTS, TIME_ZONE } from '../config.ts';
import { methodCodeSchema } from '../../shared/schemas.ts';
import { AppError } from './errors.ts';
import { parseSchema } from './validate.ts';

function vnParts(now: Date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(part => [part.type, part.value]));
}
export function todayInVN(now = new Date()): string {
  const p = vnParts(now);
  return `${p.year}-${p.month}-${p.day}`;
}
export function toIso(sqliteTs: string): string {
  const value = sqliteTs.includes('T') ? sqliteTs : sqliteTs.replace(' ', 'T') + 'Z';
  return new Date(value).toISOString();
}

// Pure clock-injected guard for Phase 3; quote itself does not accept a date or slot.
export function validateDeliverySlot(date: string, slot: string, method: string, now = new Date()): void {
  const methodCode = parseSchema(methodCodeSchema, method);
  const fail = () => { throw new AppError('INVALID_DELIVERY_SLOT', 422, 'Ngày hoặc khung giờ giao hàng không hợp lệ.'); };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail();
  const deliveryDay = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(deliveryDay) || new Date(deliveryDay).toISOString().slice(0, 10) !== date) return fail();
  const today = todayInVN(now);
  const daysAhead = (deliveryDay - Date.parse(`${today}T00:00:00Z`)) / 86400000;
  if (daysAhead < 0 || daysAhead > MAX_ADVANCE_DAYS || !TIME_SLOTS.some(value => value === slot)) return fail();
  const p = vnParts(now);
  const minute = Number(p.hour) * 60 + Number(p.minute) + Number(p.second) / 60 + now.getUTCMilliseconds() / 60000;
  if (methodCode !== 'STANDARD') {
    const [hour, min] = SAME_DAY_CUTOFF.split(':').map(Number);
    if (daysAhead !== 0 || minute >= hour * 60 + min) return fail();
  }
  if (daysAhead === 0) {
    const [hour, min] = slot.split('-')[0].split(':').map(Number);
    const preparation = methodCode === 'STANDARD' ? 0 : MIN_PREPARATION_MINUTES;
    if (hour * 60 + min < minute + preparation) return fail();
  }
}
