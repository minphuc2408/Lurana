import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Motion 12's hook snapshots this preference; Home also responds to live changes. */
export function useLandingReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
}
