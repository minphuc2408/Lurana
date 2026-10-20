import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router';

/** Route navigation starts at the top; explicit in-page anchors keep their destination. */
export function useRouteScroll() {
  const { key, hash, state } = useLocation();
  const navigationType = useNavigationType();
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useLayoutEffect(() => {
    if (navigationType === 'REPLACE' && state?.preserveScroll) return;
    const scroll = () => {
      let target: HTMLElement | null = null;
      try { target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; } catch { /* Invalid anchors fall back to the page top. */ }
      const headerHeight = document.querySelector('[data-storefront-header]')?.getBoundingClientRect().height || 0;
      target?.focus({ preventScroll: true });
      window.scrollTo({ left: 0, top: target ? Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerHeight - 24) : 0, behavior: 'instant' });
    };
    scroll();
    // Menu portals restore focus after commit; settle the scroll after they close.
    const frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [key, hash, state, navigationType]);
}
