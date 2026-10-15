/** An intent survives ambiguous network failures; editing its payload creates a new intent. */
export interface CheckoutIntent { fingerprint: string; key: string }
export function checkoutIntent(payload: unknown, previous: CheckoutIntent | null): CheckoutIntent {
  const fingerprint = JSON.stringify(payload);
  return previous?.fingerprint === fingerprint ? previous : { fingerprint, key: crypto.randomUUID() };
}
