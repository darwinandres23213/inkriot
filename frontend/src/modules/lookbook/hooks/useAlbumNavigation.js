import { useEffect, useState } from 'react';

const narrowScreen = '(max-width: 700px)';
const reducedMotion = '(prefers-reduced-motion: reduce)';

export function useAlbumNavigation(lookCount) {
  const [singlePage, setSinglePage] = useState(() => window.matchMedia(narrowScreen).matches);
  // A photo and its notes keep the same positions when the book changes width.
  const [leaf, setLeaf] = useState(0);
  const [destination, setDestination] = useState(null);
  const toView = (position) => singlePage ? position : Math.ceil(position / 2);
  const current = toView(leaf);
  const target = destination === null ? null : toView(destination);
  const last = singlePage ? lookCount * 2 : lookCount;

  useEffect(() => {
    const width = window.matchMedia(narrowScreen);
    const motion = window.matchMedia(reducedMotion);
    function update() {
      setSinglePage(width.matches);
      if (destination !== null) {
        setLeaf(destination);
        setDestination(null);
      }
    }
    width.addEventListener('change', update);
    motion.addEventListener('change', update);
    return () => {
      width.removeEventListener('change', update);
      motion.removeEventListener('change', update);
    };
  }, [destination]);

  function finishTurn() {
    if (destination !== null) {
      setLeaf(destination);
      setDestination(null);
    }
  }

  function goTo(view) {
    if (destination !== null || view === current || view < 0 || view > last) return;
    const nextLeaf = singlePage || view === 0 ? view : view * 2 - 1;
    if (window.matchMedia(reducedMotion).matches) setLeaf(nextLeaf);
    else setDestination(nextLeaf);
  }

  return { singlePage, current, target, last, goTo, finishTurn };
}
