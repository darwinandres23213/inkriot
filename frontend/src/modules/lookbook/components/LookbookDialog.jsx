import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalDialog } from '../../../shared/hooks/useModalDialog.js';
import { useCoverMotion } from '../hooks/useCoverMotion.js';
import LookbookAlbum from './LookbookAlbum.jsx';

export default function LookbookDialog({ origin, catalog, onDismiss }) {
  const dialog = useModalDialog(true);
  const { phase, requestClose, book, rightPage, jacket } = useCoverMotion(dialog, origin, onDismiss);
  const buttonTap = useRef(null);

  function beginButtonTap(event) {
    const button = event.target.closest('button');
    const touch = event.touches[0];
    buttonTap.current = button && event.touches.length === 1
      ? { button, id: touch.identifier, x: touch.clientX, y: touch.clientY }
      : null;
  }

  function finishButtonTap(event) {
    const start = buttonTap.current;
    buttonTap.current = null;
    if (!start || event.defaultPrevented || !event.cancelable) return;
    const touch = event.changedTouches[0];
    if (touch.identifier !== start.id || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 10) return;
    if (!start.button.contains(document.elementFromPoint(touch.clientX, touch.clientY))) return;
    // A mobile browser can suppress the compatibility click on the first tap after a swipe.
    event.preventDefault();
    if (!start.button.matches(':disabled, [aria-disabled="true"]')) {
      start.button.focus({ preventScroll: true });
      start.button.click();
    }
  }

  return createPortal(
    <dialog ref={dialog} className="lookbook-reader" data-phase={phase} aria-labelledby="lookbook-reader-title"
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onTouchStart={beginButtonTap} onTouchEnd={finishButtonTap} onTouchCancel={() => { buttonTap.current = null; }}
      onClick={(event) => { if (event.target === dialog.current) requestClose(); }}>
      <div className="lookbook-reader__desk">
        <header className="lookbook-reader__header">
          <h2 id="lookbook-reader-title">Lookbook</h2>
          <button type="button" className="lookbook-reader__close" aria-label="Cerrar el lookbook"
            aria-disabled={phase === 'closing'} onClick={requestClose}>
            Cerrar <span aria-hidden="true">×</span>
          </button>
        </header>
        <LookbookAlbum catalog={catalog} phase={phase} book={book} rightPage={rightPage} jacket={jacket} />
      </div>
    </dialog>, document.body,
  );
}
