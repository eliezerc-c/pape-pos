import express from 'express';
import { env } from './config/env';
import { prisma } from './config/database';
import { corsConfig, limiter, securityHeaders } from './shared/middleware/validation';
import { errorHandler } from './shared/middleware/error-handler';
import { router } from './routes/index';
import path from 'path';

const app = express();

app.use(securityHeaders);
app.use(corsConfig);
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, '../../storage/products')));
app.use('/api', router);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function start() {
  try {
    await prisma.$connect();
    console.log('[DB] Conectado a PostgreSQL');
    app.listen(env.port, () => {
      console.log(`[SERVER] Papeleria POS corriendo en puerto ${env.port}`);
    });
  } catch (err) {
    console.error('[DB] Error de conexion:', err);
    process.exit(1);
  }
}

start();
