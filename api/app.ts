import express from 'express';
import dotenv from 'dotenv';
import { securityHeaders, requestLogger, errorHandler } from '../server/middleware/security';
import { globalLimiter } from '../server/middleware/rateLimit';
import { registerApiRoutes } from '../server/routes';

dotenv.config();

let cachedApp: express.Express | null = null;

function createApp(): express.Express {
  if (cachedApp) return cachedApp;

  const app = express();

  app.use(express.json({ limit: '5mb' }));
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(globalLimiter);

  registerApiRoutes(app);

  app.use(errorHandler);

  cachedApp = app;
  return app;
}

export default createApp;
