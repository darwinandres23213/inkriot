import AlbumPage from './AlbumPage.jsx';

// Each section hinges on its neighbour to carry the curve from spine to fore-edge.
const panels = 4;

function PaperPanel({ index, front, back, looks, onFinish }) {
  function face(side, page, offset) {
    return (
      <div className={`album-leaf__face album-leaf__face--${side}`}
        style={{ '--offset': offset, '--shade-position': `${offset * 100 / (panels - 1)}%` }}>
        <div className="album-leaf__slice">
          <AlbumPage page={page} looks={looks} />
        </div>
      </div>
    );
  }
  return (
    <div className="album-leaf__panel" onAnimationEnd={index === 0 ? (event) => {
      if (event.target === event.currentTarget) onFinish();
    } : undefined}>
      {face('front', front, index)}
      {face('back', back, panels - 1 - index)}
      {index < panels - 1 && <PaperPanel index={index + 1} {...{ front, back, looks, onFinish }} />}
    </div>
  );
}

export default function TurningLeaf({ front, back, looks, backward, onFinish }) {
  return (
    <div className="album-leaf" style={{ '--panels': panels }} data-backward={backward} inert aria-hidden="true">
      <PaperPanel index={0} {...{ front, back, looks, onFinish }} />
    </div>
  );
}
