import express from 'express';
import { designer } from './routes/designer.js';
import { ImageInputError } from './helpers/imageFormat.js';

const app = express();
app.disable('x-powered-by');
app.use((_request, response, next) => {
  response.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  next();
});
app.use(designer);
app.use((error, _request, response, _next) => {
  if (error instanceof ImageInputError) return response.status(error.status).json({ error: error.message });
  if (error.status === 413) return response.status(413).json({ error: 'El archivo supera los 8 MiB.' });
  if (error.status === 415) return response.status(415).json({ error: 'Codificación de archivo no admitida.' });
  response.status(500).json({ error: 'No se pudo procesar la imagen.' });
});

const host = process.env.SHIRT_SERVICE_HOST || '127.0.0.1';
const port = Number(process.env.SHIRT_SERVICE_PORT || 3001);
const server = app.listen(port, host, () => {
  console.log(`Servicio de imágenes en http://${host}:${server.address().port}`);
});
