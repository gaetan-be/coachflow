import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import { config } from './config';
import { pool, runMigrations } from './db';
import { publicRoutes } from './routes/public';
import { authRoutes } from './routes/auth';
import { backofficeRoutes } from './routes/backoffice';
import { resolveCoach } from './middleware/coach';
import { startWorker } from './worker';

export function createApp(): express.Application {
  const app = express();
  const PgStore = connectPgSimple(session);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public', 'dist')));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.set('trust proxy', 1);

app.use(
  session({
    store: new PgStore({ pool, tableName: 'session' }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24h
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// Resolve the coach tenant from the Host header for every request
app.use(resolveCoach);

  app.use('/', publicRoutes);
  app.use('/', authRoutes);
  app.use('/', backofficeRoutes);

  // SPA fallback: serve React's index.html for all non-API, non-asset routes
  app.get('*', (_req: express.Request, res: express.Response) => {
    const spaIndex = path.join(__dirname, '..', 'public', 'dist', 'index.html');
    res.sendFile(spaIndex, (err) => {
      if (err) {
        res.status(404).send('Not found');
      }
    });
  });

  return app;
}

async function start() {
  await runMigrations();
  await startWorker();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Brenso running on http://localhost:${config.port}`);
  });
}

if (!process.env.VITEST) {
  start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}
