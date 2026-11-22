import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { shirtDesigner } from './routes/shirtDesigner.js';

const app = express();
const server = createServer(app);
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

app.use('/api/shirt-designer', shirtDesigner);
app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Ruta de API no disponible.' });
});

// React elige la vista a partir de la URL original del navegador.
app.get('/login', (request, _response, next) => {
  request.url = '/index.html';
  next();
});

if (process.argv.includes('--dev')) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, ws: { server } },
  });
  app.use(vite.middlewares);
} else {
  const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
  app.use(express.static(dist));
}

server.listen(port, host, () => {
  console.log(`INKRIOT disponible en http://${host}:${server.address().port}`);
});
