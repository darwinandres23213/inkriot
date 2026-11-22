import { Router } from 'express';

export const lookbook = Router();
const origin = process.env.LOOKBOOK_SERVICE_URL || `http://127.0.0.1:${process.env.LOOKBOOK_SERVICE_PORT || 3002}`;

lookbook.get('/looks', async (_request, response) => {
  response.set('Cache-Control', 'no-cache');
  try {
    const upstream = await fetch(new URL('/looks', origin), { signal: AbortSignal.timeout(5000) });
    response.status(upstream.status).json(await upstream.json());
  } catch {
    response.status(503).json({ error: 'El lookbook no está disponible. Inténtalo de nuevo.' });
  }
});
