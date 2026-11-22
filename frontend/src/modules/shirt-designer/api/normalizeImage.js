export async function normalizeImage(file, signal) {
  if (!file.size) throw new Error('El archivo está vacío.');
  if (file.size > 8 * 1024 * 1024) throw new Error('El archivo supera los 8 MiB.');
  let response;
  try {
    response = await fetch('/api/shirt-designer/images', {
      method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file, signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error('No se pudo conectar con el servicio de imágenes.');
  }
  if (!response.ok) {
    const message = await response.json().catch(() => ({}));
    throw new Error(message.error || 'No se pudo procesar la imagen.');
  }
  if (response.headers.get('content-type') !== 'image/png') throw new Error('Se esperaba una imagen PNG.');
  const url = URL.createObjectURL(await response.blob());
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    signal.throwIfAborted();
    return { image, url, name: (file.name.replace(/\.[^.]+$/, '') || 'diseño') + '.png' };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
