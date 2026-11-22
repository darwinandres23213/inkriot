import { normalizeArtwork } from '../services/normalizeArtwork.js';

export async function convertImage(request, response) {
  if (!request.is('application/octet-stream')) {
    return response.status(415).json({ error: 'Envía el archivo como datos binarios.' });
  }
  const png = await normalizeArtwork(request.body);
  response.type('png').send(png);
}
