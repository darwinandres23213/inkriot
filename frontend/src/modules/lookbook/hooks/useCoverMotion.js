import { useLayoutEffect, useRef, useState } from 'react';

const reducedMotion = '(prefers-reduced-motion: reduce)';

function coverFlight(element) {
  return element.getAnimations().find((animation) => animation.animationName === 'jacket-approach');
}

export function useCoverMotion(dialog, origin, onDismiss) {
  const book = useRef(null);
  const rightPage = useRef(null);
  const jacket = useRef(null);
  const rewindFrom = useRef(null);
  const [phase, setPhase] = useState(() => window.matchMedia(reducedMotion).matches ? 'reading' : 'opening');

  function requestClose() {
    if (rewindFrom.current !== null) return;
    rewindFrom.current = phase === 'opening'
      ? (coverFlight(jacket.current)?.effect.getComputedTiming().progress ?? 0)
      : 1;
    if (window.matchMedia(reducedMotion).matches || rewindFrom.current === 0) onDismiss();
    else setPhase('closing');
  }

  useLayoutEffect(() => {
    if (phase === 'reading') {
      book.current.focus({ preventScroll: true });
      return;
    }
    const closing = phase === 'closing';
    const cover = closing ? origin.cover.getBoundingClientRect() : origin.bounds;
    const page = rightPage.current.getBoundingClientRect();
    const style = jacket.current.style;
    Object.assign(style, { left: page.left + 'px', top: page.top + 'px', width: page.width + 'px', height: page.height + 'px' });
    style.setProperty('--from-x', (cover.left - page.left) + 'px');
    style.setProperty('--from-y', (cover.top - page.top) + 'px');
    style.setProperty('--from-width', cover.width / page.width);
    style.setProperty('--from-height', cover.height / page.height);

    let active = true;
    function settle() {
      if (!active) return;
      active = false;
      if (closing) onDismiss();
      else if (rewindFrom.current === null) setPhase('reading');
    }
    const motion = window.matchMedia(reducedMotion);
    const flight = coverFlight(jacket.current);
    if (!flight || motion.matches) {
      settle();
      return;
    }
    if (closing) {
      const leftPage = book.current.querySelector('.album__side--left > .album-page');
      if (leftPage?.scrollTop) jacket.current.querySelector('.album-arrival__inside > .album-page').scrollTop = leftPage.scrollTop;
      // The cover, paper and backdrop retrace the same point on the opening timeline.
      for (const animation of dialog.current.getAnimations({ subtree: true })) {
        if (!/^(jacket-|reader-)/.test(animation.animationName)) continue;
        animation.currentTime = rewindFrom.current * animation.effect.getComputedTiming().endTime;
        animation.playbackRate = -1.35;
        animation.play();
      }
    }
    flight.finished.then(settle, settle);
    motion.addEventListener('change', settle);
    window.addEventListener('resize', settle);
    return () => {
      active = false;
      motion.removeEventListener('change', settle);
      window.removeEventListener('resize', settle);
    };
  }, [dialog, origin, onDismiss, phase]);

  return { phase, requestClose, book, rightPage, jacket };
}
