import { useEffect } from 'react';
import { stagger, useAnimate, useInView, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { motionEase, motionTimings } from '@/shared/lib/motion';

/** Enhance visible content once; reduced motion keeps a legible, non-spatial entrance. */
export function useHeroMotion() {
  const [scope, animate] = useAnimate<HTMLElement>();
  const inView = useInView(scope, { once: true, amount: 0.15 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const frame = scope.current;
    const picture = frame?.querySelector('picture');
    const photo = frame?.querySelector('img');
    if (!frame || !picture || !photo || !inView || reducedMotion === null) return;
    let active = true;
    const controls: AnimationPlaybackControls[] = [];
    controls.push(animate('[data-hero-copy] > *', reducedMotion
      ? { opacity: [0.35, 1] }
      : { opacity: [0.2, 1], y: [24, 0], filter: ['blur(6px)', 'blur(0px)'] }, {
      duration: reducedMotion ? 0.6 : 0.72,
      delay: stagger(reducedMotion ? 0.06 : 0.12),
      ease: motionEase,
    }));
    const reveal = () => {
      if (!active || !photo.naturalWidth || reducedMotion) return;
      const transition = { duration: motionTimings.hero, ease: motionEase };
      controls.push(
        animate(picture, { clipPath: ['inset(0% 0% 14% 0%)', 'inset(0% 0% 0% 0%)'], scale: [1.06, 1] }, transition),
      );
    };
    if (photo.complete) reveal();
    else photo.addEventListener('load', reveal, { once: true });
    return () => {
      active = false;
      photo.removeEventListener('load', reveal);
      controls.forEach(control => control.complete());
      picture.style.removeProperty('clip-path');
      picture.style.removeProperty('transform');
      frame.querySelectorAll<HTMLElement>('[data-hero-copy] > *').forEach(element => {
        for (const property of ['opacity', 'transform', 'filter']) element.style.removeProperty(property);
      });
    };
  }, [animate, inView, reducedMotion, scope]);

  return scope;
}
