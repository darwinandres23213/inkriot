import logo from '../../../../assets/icons/logo-nav.png';
import { printNumber } from '../helpers/albumPages.js';

export default function AlbumPage({ page, looks, onSelect, status = 'ready', onRetry }) {
  const { kind, look, lookIndex } = page;

  if (kind === 'paper') return <div className="album-page" />;
  if (kind === 'endpaper') {
    return <div className="album-page album-endpaper"><img src={logo} alt="" /></div>;
  }
  if (kind === 'index') {
    return (
      <div className="album-page album-index">
        <h3 className="album-title">Índice</h3>
        {status === 'loading' && <p className="album-index__message" role="status">Cargando el álbum…</p>}
        {status === 'error' && <div className="album-index__message">
          <p role="alert">No se pudo cargar el lookbook.</p>
          <button className="album-index__retry" type="button" onClick={onRetry}>Reintentar</button>
        </div>}
        {status === 'ready' && (looks.length ? <ol className="album-index__list">
          {looks.map((item, index) => (
            <li key={item.id}>
              <button type="button" onClick={() => onSelect(index)} aria-label={`Abrir ${item.title}`}>
                <span className="album-index__number">{printNumber(index + 1)}</span>
                <img className="album-index__thumb" src={item.imageUrl} alt="" loading="lazy" draggable="false" />
                <span>{item.title}</span><span aria-hidden="true">↗</span>
              </button>
            </li>
          ))}
        </ol> : <p className="album-index__message" role="status">Todavía no hay looks publicados.</p>)}
      </div>
    );
  }
  if (kind === 'photo') {
    return (
      <figure className="album-page album-photo">
        <div className="album-photo__mount">
          <img src={look.imageUrl} alt={look.imageAlt} draggable="false" />
        </div>
        <figcaption><span>Look {printNumber(lookIndex + 1)}</span>{look.title}</figcaption>
      </figure>
    );
  }
  const detail = look.detail;
  return (
    <article className="album-page album-notes">
      <div className="album-notes__number">Look {printNumber(lookIndex + 1)}</div>
      <h3 className="album-title">{look.title}</h3>
      <p className="album-notes__description">{look.description}</p>
      {detail && (
        <figure className="album-detail">
          <div className="album-detail__crop">
            <img src={look.imageUrl} alt="" draggable="false" style={{
              objectPosition: `${detail.x}% ${detail.y}%`,
              transformOrigin: `${detail.x}% ${detail.y}%`,
            }} />
          </div>
          <figcaption>{detail.caption}</figcaption>
        </figure>
      )}
    </article>
  );
}
