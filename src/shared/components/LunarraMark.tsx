import type { SVGProps } from 'react';

/** Flower mark retained for unavailable-feature notices; the header uses favicon.svg. */
export function LunarraMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-lunarra-mark {...props}>
    <path d="M20 28C16 33 11 38 8 43" stroke="var(--lunara-rose)" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 31C13 30 8 32 6 35C9 37 15 36 17 31Z" fill="var(--lunara-accent-tertiary)" stroke="var(--lunara-rose-strong)" strokeWidth="0.8" />
    <path d="M13 36C12 40 14 43 17 44C19 41 18 37 13 36Z" fill="var(--lunara-accent-tertiary)" stroke="var(--lunara-rose-strong)" strokeWidth="0.8" />
    <path d="M24 16C18 8 13 14 15 22C17 29 23 30 25 28C27 25 29 22 24 16Z" fill="var(--lunara-accent-secondary)" stroke="var(--lunara-rose)" strokeWidth="0.75" />
    <path d="M24 16C31 8 36 14 34 22C32 29 26 30 24 28C22 25 20 22 24 16Z" fill="var(--lunara-accent-secondary)" stroke="var(--lunara-rose)" strokeWidth="0.75" />
    <path d="M14 20C10 23 11 29 17 29C22 29 23 25 21 21C19 18 16 18 14 20Z" fill="var(--lunara-accent-secondary)" stroke="var(--lunara-rose)" strokeWidth="0.75" />
    <path d="M34 20C38 23 37 29 31 29C26 29 25 25 27 21C29 18 32 18 34 20Z" fill="var(--lunara-accent-secondary)" stroke="var(--lunara-rose)" strokeWidth="0.75" />
    <path d="M24 12C20 16 20 24 24 26C28 24 28 16 24 12Z" fill="var(--lunara-rose)" fillOpacity="0.9" stroke="var(--lunara-rose-strong)" strokeWidth="0.75" />
    <path d="M22 17C23 15 25 15 26 17C27 20 25 23 24 24C23 23 21 20 22 17Z" fill="var(--lunara-rose-strong)" />
    <path d="M21 27C23 29 25 29 27 27C26 30 22 30 21 27Z" fill="var(--lunara-rose-strong)" />
  </svg>;
}
