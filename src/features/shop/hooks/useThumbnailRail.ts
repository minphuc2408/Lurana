import { useLayoutEffect, useRef, useState } from 'react';

export function useThumbnailRail(imageIndex: number, imageCount: number) {
  const railRef = useRef<HTMLElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, atEnd: false });
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const vertical = window.matchMedia('(min-width: 1024px)').matches;
      const extent = vertical ? rail.scrollHeight : rail.scrollWidth;
      const viewport = vertical ? rail.clientHeight : rail.clientWidth;
      const position = vertical ? rail.scrollTop : rail.scrollLeft;
      const next = { overflow: extent > viewport + 1, atEnd: position + viewport >= extent - 2 };
      setScroll(previous => previous.overflow === next.overflow && previous.atEnd === next.atEnd ? previous : next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    rail.addEventListener('scroll', update, { passive: true });
    update();
    return () => { observer.disconnect(); rail.removeEventListener('scroll', update); };
  }, [imageCount]);
  useLayoutEffect(() => {
    const rail = railRef.current;
    const image = rail?.children[imageIndex] as HTMLElement | undefined;
    if (!rail || !image) return;
    const vertical = window.matchMedia('(min-width: 1024px)').matches;
    const start = vertical ? image.offsetTop : image.offsetLeft;
    const size = vertical ? image.offsetHeight : image.offsetWidth;
    const position = vertical ? rail.scrollTop : rail.scrollLeft;
    const viewport = vertical ? rail.clientHeight : rail.clientWidth;
    if (start < position || start + size > position + viewport) {
      rail.scrollTo(vertical ? { top: start } : { left: start });
    }
  }, [imageIndex, imageCount]);
  const scrollMore = () => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({ top: scroll.atEnd ? 0 : rail.scrollTop + rail.clientHeight * 0.8,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  return { railRef, ...scroll, scrollMore };
}
