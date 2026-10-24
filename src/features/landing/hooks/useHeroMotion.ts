import { useEffect, useRef } from 'react';
import { inView, stagger, useAnimate, type AnimationPlaybackControls } from 'motion/react';
import { landingMotion } from '../landing-motion';
import { useLandingReducedMotion } from './useLandingReducedMotion';

/** Enhance visible content once; never gate the copy or LCP image on image loading. */
export function useHeroMotion() {
  const [scope, animate] = useAnimate<HTMLElement>();
  const reducedMotion = useLandingReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    const frame = scope.current;
    const picture = frame?.querySelector('picture');
    const photo = frame?.querySelector('img');
    if (!frame || !picture || !photo || reducedMotion || started.current || typeof IntersectionObserver === 'undefined') return;
    let active = true;
    const controls: AnimationPlaybackControls[] = [];
    const reveal = () => {
      if (!active || !photo.naturalWidth) return;
      const transition = { duration: landingMotion.heroImage, ease: landingMotion.ease };
      controls.push(
        animate(picture, { scale: [1.035, 1] }, transition),
      );
    };
    const stopObserving = inView(frame, () => {
      if (!active || started.current) return;
      started.current = true;
      controls.push(animate('[data-hero-copy] > *', { opacity: [0, 1], y: [18, 0] }, {
        duration: landingMotion.text, delay: stagger(0.1), ease: landingMotion.ease,
      }));
      if (photo.complete) reveal();
      else photo.addEventListener('load', reveal, { once: true });
    }, landingMotion.viewportOnce);
    return () => {
      active = false;
      stopObserving();
      photo.removeEventListener('load', reveal);
      // Flush final MotionValues before stopping, so no queued partial opacity survives cleanup.
      controls.forEach(control => { control.complete(); control.stop(); });
      picture.style.removeProperty('transform');
      frame.querySelectorAll<HTMLElement>('[data-hero-copy] > *').forEach(element => {
        for (const property of ['opacity', 'transform']) element.style.removeProperty(property);
      });
    };
  }, [animate, reducedMotion, scope]);

  return scope;
}
