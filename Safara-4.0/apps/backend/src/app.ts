import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { router as api } from './routes/index.js';
import authRoutes from './routes/auths.routes.js';
 import uploadRoutes from './routes/upload.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import {router} from './modules/tourist/tourist.routes.js';
// src/app.ts
import { incidentRouter } from './modules/incident/incident.routes.js';

import { touristRouter } from './modules/authTourist/tourist.routes.js';







import { fileURLToPath } from 'url';


export const buildApp = () => {
  const app = express();
  app.set('trust proxy', true);
 // app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000','http://10.0.12.219:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
 app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
  app.use(helmet());
  app.use(compression());
  //app.use(express.json());
 app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/auths', authRoutes);
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  app.use('/api/v1/upload', uploadRoutes);
  app.use('/api/tourist', router);
  app.use('/api', api);
app.use('/api/incidents', incidentRouter);
app.use('/api/tourists', touristRouter);


  // ... previous middleware and routes
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err); // helpful during dev
  // Map common Mongo duplicate key to 409
  const isDupKey = err?.name === 'MongoServerError' && (err?.code === 11000);
  const status = err?.status || (err?.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const message = err?.message || (isDupKey ? 'Duplicate key' : 'Server Error');
  res.status(status).json({ error: message });
});

  app.use(errorHandler);
  return app;
};
