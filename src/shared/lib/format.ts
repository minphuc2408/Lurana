export function formatVND(amount: number, locale: 'en'|'vi' = 'vi') {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}
export function formatMoney(amount: number) { return formatVND(amount); }
