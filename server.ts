import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { securityHeaders, requestLogger, errorHandler } from './server/middleware/security';
import { globalLimiter } from './server/middleware/rateLimit';
import { registerApiRoutes } from './server/routes';

dotenv.config();

async function createApp() {
  const app = express();

  app.use(express.json({ limit: '5mb' }));
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(globalLimiter);

  registerApiRoutes(app);

  app.use(errorHandler);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// For local development: start the server
// For Vercel: export the app (see api/index.ts)
const isVercel = process.env.VERCEL === '1';

createApp().then(app => {
  if (!isVercel) {
    const PORT = 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AI Fitness OS server running on http://0.0.0.0:${PORT}`);
    });
  }
}).catch((err) => {
  console.error('Failed to start server:', err);
});
