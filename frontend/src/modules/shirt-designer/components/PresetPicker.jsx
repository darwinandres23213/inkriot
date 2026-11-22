import { useEffect, useRef, useState } from 'react';
import { getPresetFile, getPresets } from '../api/presets.js';

export default function PresetPicker({ disabled, apply }) {
  const [presets, setPresets] = useState(null);
  const [error, setError] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);
  const request = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    getPresets(controller.signal).then(setPresets).catch(() => {
      if (!controller.signal.aborted) setError('No se pudo cargar el catálogo de diseños.');
    });
    return () => controller.abort();
  }, []);

  async function select(preset) {
    const { signal } = request.current;
    setLoadingImage(true);
    setError('');
    try {
      const file = await getPresetFile(preset, signal);
      if (!signal.aborted) await apply([file]);
    } catch {
      if (!signal.aborted) setError('No se pudo cargar la imagen del diseño.');
    } finally {
      if (!signal.aborted) setLoadingImage(false);
    }
  }
  if (error) return <p className="designer-error" role="alert">{error}</p>;
  if (!presets) return <p className="designer-note" role="status">Cargando diseños…</p>;
  if (!presets.length) return <p className="designer-empty">Todavía no hay diseños predeterminados.</p>;
  return (
    <div className="designer-presets">
      {presets.map((preset) => <button key={preset.id} type="button" disabled={disabled || loadingImage} onClick={() => select(preset)}>
        <img src={preset.imageUrl} alt="" loading="lazy" /><span>{preset.name}</span>
      </button>)}
    </div>
  );
}
