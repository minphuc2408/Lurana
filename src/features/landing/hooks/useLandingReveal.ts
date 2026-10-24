import { useEffect, useRef } from 'react';
import { inView, useAnimate, type AnimationPlaybackControls } from 'motion/react';
import { landingMotion, type LandingRevealGroup } from '../landing-motion';
import { useLandingReducedMotion } from './useLandingReducedMotion';

/** Visible by default. Observe actual items so late data and tall mobile sections stay safe. */
export function useLandingReveal(groups: readonly LandingRevealGroup[], contentKey = '') {
  const [scope, animate] = useAnimate<HTMLElement>();
  const reducedMotion = useLandingReducedMotion();
  const revealed = useRef(new WeakSet<Element>());

  useEffect(() => {
    const root = scope.current;
    if (!root || reducedMotion !== false || typeof IntersectionObserver === 'undefined') return;
    const controls: AnimationPlaybackControls[] = [];
    const animated: HTMLElement[] = [];
    let active = true;
    const observers = groups.flatMap(group => Array.from(root.querySelectorAll<HTMLElement>(group.selector))
      .map((element, index) => {
        if (revealed.current.has(element)) return () => {};
        return inView(element, () => {
          if (!active || revealed.current.has(element)) return;
          revealed.current.add(element);
          // Never conceal a keyboard target while its parent is arriving.
          if (element.contains(document.activeElement)) return;
          animated.push(element);
          controls.push(animate(element, {
            opacity: [0, 1],
            ...(group.y ? { y: [group.y, 0] } : {}),
            ...(group.scale ? { scale: [group.scale, 1] } : {}),
          }, {
            duration: group.duration,
            delay: Math.min(index * (group.stagger ?? 0), landingMotion.maxDelay),
            ease: landingMotion.ease,
          }));
          // No leave callback: Motion unobserves this element after its first entrance.
        }, landingMotion.viewportOnce);
      }));
    return () => {
      active = false;
      observers.forEach(stop => stop());
      // Complete first: stop() alone schedules Motion's interrupted value for the next frame.
      controls.forEach(control => { control.complete(); control.stop(); });
      animated.forEach(element => {
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
      });
    };
  }, [animate, scope, groups, contentKey, reducedMotion]);

  return scope;
}
