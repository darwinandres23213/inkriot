export async function getPresets(signal) {
  const response = await fetch('/api/shirt-designer/presets', { signal });
  if (!response.ok) throw new Error('No se pudo cargar el catálogo de diseños.');
  const records = await response.json();
  return records.map(({ id, name, imageUrl }) => {
    const url = new URL(imageUrl, window.location.origin);
    if (url.origin !== window.location.origin || !name || !imageUrl) throw new Error('El diseño no está disponible.');
    return { id, name, imageUrl: url.href };
  });
}

export async function getPresetFile(preset, signal) {
  const response = await fetch(preset.imageUrl, { signal, mode: 'same-origin' });
  if (!response.ok) throw new Error('No se pudo cargar la imagen del diseño.');
  const blob = await response.blob();
  return new File([blob], preset.name + '.png', { type: blob.type });
}
