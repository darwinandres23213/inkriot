import { Router } from 'express';

export const shirtDesigner = Router();
const origin = process.env.SHIRT_SERVICE_URL || `http://127.0.0.1:${process.env.SHIRT_SERVICE_PORT || 3001}`;

async function forward(request, response) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  response.on('close', () => controller.abort());
  response.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  try {
    const options = { method: request.method, signal: controller.signal, redirect: 'error' };
    if (request.method === 'POST') {
      const headers = { 'content-type': request.get('content-type') || 'application/octet-stream' };
      if (request.get('content-length')) headers['content-length'] = request.get('content-length');
      if (request.get('content-encoding')) headers['content-encoding'] = request.get('content-encoding');
      Object.assign(options, { headers, body: request, duplex: 'half' });
    }
    const upstream = await fetch(new URL(request.route.path, origin), options);
    const bytes = Buffer.from(await upstream.arrayBuffer());
    response.status(upstream.status).set('Content-Type', upstream.headers.get('content-type')).send(bytes);
  } catch {
    if (!response.destroyed) response.status(503).json({ error: 'El servicio de imágenes no está disponible. Inténtalo de nuevo.' });
  } finally {
    clearTimeout(timeout);
  }
}

shirtDesigner.get('/presets', forward);
shirtDesigner.post('/images', forward);
