import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createShirtScene } from '../helpers/shirtScene.js';
import { printPosition } from '../helpers/printTexture.js';

export default function ShirtPreview({ sceneRef, fit, color, layers, side, showSide, onOrbit, active, move, setMove, onPosition }) {
  const canvas = useRef(null);
  const drag = useRef(null);
  const initialSide = useRef(side);
  const [modelState, setModelState] = useState('loading');

  useLayoutEffect(() => {
    let mounted = true;
    try {
      const scene = createShirtScene(canvas.current);
      sceneRef.current = scene;
      if (initialSide.current === 'back') scene.showSide('back');
      scene.ready.then(
        () => { if (mounted) setModelState('ready'); },
        () => { if (mounted) setModelState('load-error'); },
      );
      return () => { mounted = false; sceneRef.current = null; scene.dispose(); };
    } catch {
      setModelState('webgl-error');
    }
  }, [sceneRef]);
  useLayoutEffect(() => { sceneRef.current?.setFit(fit); }, [fit, sceneRef]);
  useEffect(() => { sceneRef.current?.paint(color, layers); }, [color, layers, sceneRef]);

  function place(event) {
    const point = sceneRef.current?.pointOnFabric(event.clientX, event.clientY, side);
    if (point) onPosition(printPosition(point.x, point.y));
  }
  function start(event) {
    if (!event.isPrimary || event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (move) place(event);
  }
  function track(event) {
    const previous = drag.current;
    if (!previous || previous.id !== event.pointerId || !sceneRef.current) return;
    if (move) place(event);
    else onOrbit(sceneRef.current.orbit(event.clientX - previous.x, event.clientY - previous.y));
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  function key(event) {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!delta || !sceneRef.current) return;
    event.preventDefault();
    if (move && active) onPosition(printPosition(active.x + delta[0], active.y + delta[1]));
    else onOrbit(sceneRef.current.orbit(delta[0] * 12, delta[1] * 12));
  }
  return (
    <section className="designer-stage" aria-label="Vista de la camiseta">
      <div className="designer-views" role="group" aria-label="Cara de la camiseta">
        <button type="button" aria-pressed={side === 'front'} onClick={() => showSide('front')}>Frente</button>
        <button type="button" aria-pressed={side === 'back'} onClick={() => showSide('back')}>Espalda</button>
      </div>
      <div className="designer-model" aria-busy={modelState === 'loading'}>
        <canvas ref={canvas} className={move ? 'is-moving' : ''} tabIndex={modelState === 'ready' ? 0 : -1}
          aria-hidden={modelState !== 'ready'} aria-label={`Camiseta 3D, modelo ${fit.model.toLowerCase()}, talla ${fit.size}`}
          aria-describedby="designer-gesture" onPointerDown={start} onPointerMove={track}
          onLostPointerCapture={() => { drag.current = null; }} onKeyDown={key} />
        {modelState === 'loading' && <p role="status">Cargando camiseta…</p>}
        {modelState === 'load-error' && <p role="alert">No se pudo cargar la camiseta. Vuelve a abrir el editor para reintentar.</p>}
        {modelState === 'webgl-error' && <p role="alert">La vista 3D necesita WebGL 2. Activa la aceleración gráfica y vuelve a abrir el editor.</p>}
      </div>
      <div className="designer-stage-tools">
        <p id="designer-gesture">{move ? 'Arrastra sobre la tela para colocar tu imagen.' : 'Arrastra o usa las flechas para girar.'}</p>
        {active && <div className="designer-modes" role="group" aria-label="Herramienta del visor">
          <button type="button" aria-pressed={!move} onClick={() => setMove(false)}>Girar modelo</button>
          <button type="button" aria-pressed={move} onClick={() => setMove(true)}>Mover imagen</button>
        </div>}
      </div>
    </section>
  );
}
