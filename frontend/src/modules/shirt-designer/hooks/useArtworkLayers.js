import { useEffect, useRef, useState } from 'react';
import { normalizeImage } from '../api/normalizeImage.js';
import { createPrintLayer } from '../helpers/printTexture.js';

export const MAX_LAYERS = 6;

export function useArtworkLayers() {
  const [layers, setLayers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const resources = useRef(new Map());
  const sequence = useRef(0);
  const job = useRef(null);

  useEffect(() => {
    const urls = resources.current;
    return () => {
      job.current?.abort();
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  async function addFiles(files, side) {
    if (job.current || !files.length) return null;
    const controller = new AbortController();
    job.current = controller;
    setBusy(true);
    setError('');
    let lastId = null;
    const errors = [];
    try {
      for (const file of files) {
        if (resources.current.size >= MAX_LAYERS) {
          errors.push('Puedes colocar hasta seis imágenes por camiseta.');
          break;
        }
        try {
          const artwork = await normalizeImage(file, controller.signal);
          if (controller.signal.aborted) {
            URL.revokeObjectURL(artwork.url);
            return null;
          }
          const id = ++sequence.current;
          resources.current.set(id, artwork.url);
          const layer = createPrintLayer(id, artwork, side);
          setLayers((current) => [...current, layer]);
          lastId = id;
        } catch (failure) {
          if (controller.signal.aborted) return null;
          errors.push(`${file.name} · ${failure.message}`);
        }
      }
      if (!controller.signal.aborted) setError(errors.join(' '));
    } finally {
      if (job.current === controller && !controller.signal.aborted) {
        job.current = null;
        setBusy(false);
      }
    }
    return controller.signal.aborted ? null : lastId;
  }

  function cancelUpload() {
    job.current?.abort();
    job.current = null;
    setBusy(false);
  }
  function updateLayer(id, changes) {
    setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, ...changes } : layer));
  }
  function removeLayer(id) {
    URL.revokeObjectURL(resources.current.get(id));
    resources.current.delete(id);
    setLayers((current) => current.filter((layer) => layer.id !== id));
    setError('');
  }
  return { layers, busy, error, addFiles, cancelUpload, updateLayer, removeLayer };
}
