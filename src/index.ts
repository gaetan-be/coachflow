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

const app = express();
const PgStore = connectPgSimple(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Routes
app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', backofficeRoutes);

async function start() {
  await runMigrations();
  startWorker();
  app.listen(config.port, () => {
    console.log(`Brenso running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
