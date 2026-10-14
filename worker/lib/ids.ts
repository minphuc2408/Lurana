import { todayInVN } from './datetime.ts';

// Excludes 0, O, 1, I and L to keep order numbers easy to read aloud.
const ORDER_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const RANDOM_BYTE_LIMIT = 256 - (256 % ORDER_ALPHABET.length);

export function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && value.length === 36
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function newOrderNumber(now = new Date()): string {
  let suffix = '';
  const bytes = new Uint8Array(16);
  while (suffix.length < 6) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      // Rejection sampling avoids modulo bias for the 31-character alphabet.
      if (byte >= RANDOM_BYTE_LIMIT) continue;
      suffix += ORDER_ALPHABET[byte % ORDER_ALPHABET.length];
      if (suffix.length === 6) break;
    }
  }
  return `LNR-${todayInVN(now).slice(2).replaceAll('-', '')}-${suffix}`;
}
