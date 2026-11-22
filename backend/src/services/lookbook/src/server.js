import express from 'express';
import { lookbook } from './routes/lookbook.js';

const app = express();
app.disable('x-powered-by');
app.use(lookbook);
app.use((_error, _request, response, _next) => {
  response.status(500).json({ error: 'No se pudo cargar el lookbook.' });
});

const host = process.env.LOOKBOOK_SERVICE_HOST || '127.0.0.1';
const port = Number(process.env.LOOKBOOK_SERVICE_PORT || 3002);
const server = app.listen(port, host, () => {
  console.log(`Servicio de lookbook en http://${host}:${server.address().port}`);
});
