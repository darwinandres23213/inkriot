import { lazy, Suspense, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalDialog } from '../../../shared/hooks/useModalDialog.js';
import { MAX_LAYERS, useArtworkLayers } from '../hooks/useArtworkLayers.js';
import { DEFAULT_FIT } from '../helpers/fitOptions.js';
import FitControls from './FitControls.jsx';
import ArtworkControls from './ArtworkControls.jsx';
import PresetPicker from './PresetPicker.jsx';

function PreviewNotice({ failed = false }) {
  return (
    <section className="designer-stage designer-stage--notice" aria-label="Vista de la camiseta" aria-busy={!failed}>
      {failed ? <>
        <p role="alert">No se pudo descargar el visor 3D.</p>
        <button type="button" className="designer-small" onClick={() => window.location.reload()}>Recargar la página</button>
      </> : <p role="status">Cargando camiseta…</p>}
    </section>
  );
}

const ShirtPreview = lazy(() => import('./ShirtPreview.jsx').catch(() => ({
  default: () => <PreviewNotice failed />,
})));

const palette = [
  ['Blanco', '#ffffff'], ['Negro', '#202023'], ['Rojo', '#ae1727'],
  ['Arena', '#cdbb9e'], ['Azul', '#3d5371'], ['Verde', '#566653'],
];

export default function ShirtDesignerDialog({ open, onDismiss }) {
  const dialog = useModalDialog(open);
  const sceneRef = useRef(null);
  const [fit, setFit] = useState(DEFAULT_FIT);
  const [color, setColor] = useState('#ffffff');
  const [side, setSide] = useState('front');
  const [modeMove, setMove] = useState(false);
  const [source, setSource] = useState('upload');
  const [selected, select] = useState(null);
  const { layers, busy, error, addFiles, cancelUpload, updateLayer, removeLayer } = useArtworkLayers();
  const visibleLayers = layers.filter((layer) => layer.side === side);
  const active = visibleLayers.find((layer) => layer.id === selected) ?? visibleLayers.at(-1);
  const colorName = palette.find(([, value]) => value === color)?.[0] || color.toUpperCase();

  function dismiss() {
    cancelUpload();
    onDismiss();
  }
  function showSide(next) {
    setSide(next);
    sceneRef.current?.showSide(next);
  }
  async function applyFiles(files) {
    const id = await addFiles(files, side);
    if (id !== null) {
      showSide(side);
      select(id);
      setMove(true);
      setSource('upload');
    }
  }
  function upload(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    return applyFiles(files);
  }

  return createPortal(
    <dialog ref={dialog} className="designer-dialog" aria-labelledby="designer-title"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => { if (event.target === dialog.current) dismiss(); }}>
      <div className="designer-shell">
        <header className="designer-head">
          <h2 id="designer-title">Personaliza <em>tu camiseta</em></h2>
          <button type="button" className="designer-close" aria-label="Cerrar visualizador" onClick={dismiss}>×</button>
        </header>
        <div className="designer-layout">
          {open && <Suspense fallback={<PreviewNotice />}>
            <ShirtPreview sceneRef={sceneRef} fit={fit} color={color} layers={layers} side={side} showSide={showSide}
              onOrbit={setSide} active={active} move={Boolean(active && modeMove)} setMove={setMove}
              onPosition={(position) => active && updateLayer(active.id, position)} />
          </Suspense>}
          <section className="designer-panel" aria-label="Menú de edición">
            <div className="designer-fields">
              <FitControls fit={fit} onChange={setFit} />
              <fieldset className="designer-colors">
                <legend>Color de la camiseta</legend>
                <div className="designer-swatches">
                  {palette.map(([label, hex]) => <button key={hex} type="button" className="designer-swatch"
                    style={{ '--swatch': hex }} aria-label={label} title={label} aria-pressed={color === hex} onClick={() => setColor(hex)} />)}
                  <label className="designer-custom" title="Elegir otro color">+
                    <input aria-label="Elegir otro color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
                  </label>
                </div>
                <p className="designer-color-name">{colorName}</p>
              </fieldset>
              <h3>Diseño</h3>
              <div className="designer-sources" role="group" aria-label="Origen del diseño">
                <button type="button" aria-pressed={source === 'upload'} onClick={() => setSource('upload')}>Mis imágenes</button>
                <button type="button" aria-pressed={source === 'presets'} onClick={() => setSource('presets')}>Predeterminados</button>
              </div>
              {source === 'presets' ? open && <PresetPicker disabled={busy || layers.length >= MAX_LAYERS} apply={applyFiles} /> : <>
                <label className="designer-upload">
                  <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true" />
                  <strong>{busy ? 'Procesando imagen…' : 'Cargar imágenes'}</strong>
                  <span>PNG, JPG o WebP · Máx. 8 MiB por imagen</span>
                  <input type="file" aria-label="Cargar imágenes" accept="image/png,image/jpeg,image/webp" multiple
                    disabled={busy || layers.length >= MAX_LAYERS} onChange={upload} />
                </label>
                {layers.length >= MAX_LAYERS && <p className="designer-note">Se alcanzó el límite de seis imágenes.</p>}
                {active && <ArtworkControls layers={visibleLayers} active={active} onSelect={select}
                  onUpdate={(changes) => updateLayer(active.id, changes)} onRemove={() => removeLayer(active.id)} />}
              </>}
              {error && <p className="designer-error" role="alert">{error}</p>}
            </div>
            <div className="designer-checkout">
              <a className="btn designer-buy" href="/login">QUE CHIMBA DE CAMISETA! LA QUIERO <span aria-hidden="true">→</span></a>
            </div>
          </section>
        </div>
      </div>
    </dialog>, document.body,
  );
}
