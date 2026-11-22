import { printArea } from '../helpers/printTexture.js';

function Slider({ label, value, unit, min, max, change }) {
  return (
    <label className="designer-slider">
      <span>{label}</span><output>{value}{unit}</output>
      <input aria-label={label} type="range" min={min} max={max} value={value} onChange={(event) => change(Number(event.target.value))} />
    </label>
  );
}

export default function ArtworkControls({ layers, active, onSelect, onUpdate, onRemove }) {
  return (
    <div className="designer-art-controls">
      <label className="designer-layer-label" htmlFor="designer-layer">Imagen a editar</label>
      <div className="designer-layer-row">
        <select id="designer-layer" value={active.id} onChange={(event) => onSelect(Number(event.target.value))}>
          {layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.name}</option>)}
        </select>
        <button type="button" className="designer-small" onClick={onRemove}>Quitar</button>
      </div>
      <Slider label="Tamaño" unit="%" min={20} max={180} value={active.size} change={(size) => onUpdate({ size })} />
      <Slider label="Rotación" unit="°" min={-180} max={180} value={active.rotation} change={(rotation) => onUpdate({ rotation })} />
      <label className="designer-invert">
        <input type="checkbox" checked={active.inverted} onChange={(event) => onUpdate({ inverted: event.target.checked })} />
        Invertir colores
      </label>
      <details className="designer-position">
        <summary>Ajustar posición</summary>
        <Slider label="Horizontal" unit="%" min={printArea.left} max={printArea.right} value={active.x} change={(x) => onUpdate({ x })} />
        <Slider label="Vertical" unit="%" min={printArea.top} max={printArea.bottom} value={active.y} change={(y) => onUpdate({ y })} />
      </details>
    </div>
  );
}
