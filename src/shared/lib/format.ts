const php = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
export function formatMoney(amount: number) { return `₱${php.format(amount)}`; }
