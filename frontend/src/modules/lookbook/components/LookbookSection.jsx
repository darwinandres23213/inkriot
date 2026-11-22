import { useCallback, useRef, useState } from 'react';
import { useLooks } from '../hooks/useLooks.js';
import BookCover from './BookCover.jsx';
import LookbookDialog from './LookbookDialog.jsx';
import '../styles/lookbook.css';
import '../styles/cover.css';
import '../styles/reader.css';

export default function LookbookSection() {
  const catalog = useLooks();
  const cover = useRef(null);
  const [origin, setOrigin] = useState(null);
  const dismiss = useCallback(() => setOrigin(null), []);
  const firstLook = catalog.looks?.[0];

  function openBook(event) {
    event.currentTarget.focus({ preventScroll: true });
    setOrigin({ cover: cover.current, bounds: cover.current.getBoundingClientRect() });
  }

  return (
    <section className="lookbook torn" id="lookbook" aria-labelledby="lookbook-title">
      <div className="lookbook__inner">
        <header className="lookbook__heading">
          <h2 className="script" id="lookbook-title">Look<em>book</em></h2>
          {firstLook && <p className="lookbook__feature"><span>En portada</span>{firstLook.title}</p>}
        </header>
        <button className="album-launch" type="button" aria-haspopup="dialog" aria-expanded={Boolean(origin)}
          aria-label="Abrir el lookbook" onClick={openBook}>
          <span className="album-launch__art" ref={cover}>
            <span className="closed-book-stack"><BookCover look={firstLook} /></span>
          </span>
          <span className="album-launch__action">Abrir el lookbook <span aria-hidden="true">↗</span></span>
        </button>
      </div>
      {origin && <LookbookDialog origin={origin} catalog={catalog} onDismiss={dismiss} />}
    </section>
  );
}
