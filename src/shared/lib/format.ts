export function formatVND(amount: number, locale: 'en'|'vi' = 'vi') {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}
export function formatMoney(amount: number) { return formatVND(amount); }
export function formatVietnamDate(value: string, locale: 'en'|'vi' = 'en') {
  const date = new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'short', day: 'numeric',
    ...(value.length === 10 ? {} : { hour: '2-digit', minute: '2-digit' }),
  }).format(date);
}
export function vietnamDate(offsetDays = 0) {
  return new Date(Date.now() + 7 * 60 * 60 * 1000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
}
