import 'dotenv/config';
import next from 'next';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mountApiRoutes } from './server/apiApp';
import { pustRepo } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dev = process.env.NODE_ENV !== 'production';

async function startServer() {
  await pustRepo.init();

  const nextApp = next({ dev, dir: __dirname });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Serve generated campus photography assets reliably in Next.js + Express
  app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));

  // Mount all Express /api and /api/portal routes
  mountApiRoutes(app);

  // Delegate all Next.js pages and _next static assets to Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `PUST Next.js + Express server listening on http://0.0.0.0:${PORT} (storage: ${pustRepo.getStorageBackend()})`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start PUST server:', err);
  process.exit(1);
});
