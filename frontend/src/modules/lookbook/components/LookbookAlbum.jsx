import { useRef } from 'react';
import { getSpread } from '../helpers/albumPages.js';
import { useAlbumNavigation } from '../hooks/useAlbumNavigation.js';
import AlbumPage from './AlbumPage.jsx';
import BookCover from './BookCover.jsx';
import TurningLeaf from './TurningLeaf.jsx';

export default function LookbookAlbum({ catalog, phase, book, rightPage, jacket }) {
  const looks = catalog.looks ?? [];
  const { singlePage, current, target, last, goTo, finishTurn } = useAlbumNavigation(looks.length);
  const touchStart = useRef(null);
  const closing = phase === 'closing';
  const spread = getSpread(looks, closing ? target ?? current : current, singlePage);
  const turning = target !== null && !closing;
  const next = turning ? getSpread(looks, target, singlePage) : spread;
  const backward = turning && target < current;
  const left = backward ? next.left : spread.left;
  const right = turning && !backward ? next.right : spread.right;
  const sheetBack = singlePage ? { kind: 'paper' } : (backward ? spread.left : next.left);

  function openLook(index) {
    book.current.focus({ preventScroll: true });
    goTo(1 + (singlePage ? index * 2 : index));
  }

  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const destinations = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: last };
    if (Object.hasOwn(destinations, event.key)) {
      event.preventDefault();
      goTo(destinations[event.key]);
    }
  }

  function beginSwipe(event) {
    if (event.pointerType === 'mouse') return;
    touchStart.current = event.isPrimary && !event.target.closest('button')
      ? { x: event.clientX, y: event.clientY }
      : null;
  }

  function endSwipe(event, point) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !point) return;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (event.cancelable) event.preventDefault();
      goTo(current + (dx < 0 ? 1 : -1));
    }
  }

  return (
    <div className="album" role="group" aria-label="Álbum de looks" tabIndex={0} ref={book}
      inert={phase !== 'reading'} onKeyDown={onKeyDown}>
      <div className="album__binding" onPointerDown={beginSwipe}
        onPointerUp={(event) => { if (event.pointerType === 'pen') endSwipe(event, event); }}
        onTouchEnd={(event) => endSwipe(event, event.changedTouches[0])}
        onPointerCancel={() => { touchStart.current = null; }}>
        <div className="album__stage">
          {!singlePage && (
            <div className="album__side album__side--left" inert={turning} aria-hidden={turning || undefined}>
              <AlbumPage page={left} looks={looks} onSelect={openLook} />
            </div>
          )}
          <div className="album__side album__side--right" ref={rightPage} inert={turning} aria-hidden={turning || undefined}>
            <AlbumPage page={right} looks={looks} onSelect={openLook} status={catalog.status} onRetry={catalog.retry} />
          </div>
          {turning && (
            <TurningLeaf front={backward ? next.right : spread.right} back={sheetBack}
              looks={looks} backward={backward} onFinish={finishTurn} />
          )}
        </div>
      </div>
      <div className="album__controls">
        <button type="button" className="album__button" aria-label="Página anterior" aria-disabled={turning || current === 0}
          onClick={() => goTo(current - 1)}><span aria-hidden="true">←</span> Anterior</button>
        <div className="album__position">
          <p className="album__status" role="status" aria-label="Página actual" aria-atomic="true">{spread.label}</p>
          {current > 0 && <button className="album__index-link" type="button" aria-disabled={turning}
            onClick={() => { book.current.focus({ preventScroll: true }); goTo(0); }}>Volver al índice</button>}
        </div>
        <button type="button" className="album__button" aria-label="Página siguiente" aria-disabled={turning || current === last}
          onClick={() => goTo(current + 1)}>Siguiente <span aria-hidden="true">→</span></button>
      </div>
      {phase !== 'reading' && (
        <div ref={jacket} className="album-arrival" inert aria-hidden="true">
          <div className="album-arrival__pose closed-book-stack">
            <div className="album-arrival__lid">
              <BookCover look={looks[0]} />
              <div className="album-arrival__inside">
                <AlbumPage page={left ?? { kind: 'endpaper' }} looks={looks} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
