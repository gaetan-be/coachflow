import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { config } from './config';

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function runMigrations(): Promise<void> {
  const migrationDir = path.join(__dirname, 'migrations');

  // In production the compiled JS is in dist/, but migrations are .sql in src/
  // We check both locations
  const dirs = [migrationDir, path.join(__dirname, '..', 'src', 'migrations')];
  let sqlDir = '';
  for (const d of dirs) {
    if (fs.existsSync(d)) { sqlDir = d; break; }
  }
  if (!sqlDir) {
    console.warn('No migrations directory found, skipping.');
    return;
  }

  const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(sqlDir, file), 'utf-8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }

  // Seed coach if none exists
  const { rows } = await pool.query('SELECT id FROM coach LIMIT 1');
  if (rows.length === 0) {
    const hash = await bcrypt.hash(config.coachPassword, 10);
    await pool.query(
      'INSERT INTO coach (name, email, password_hash, domain) VALUES ($1, $2, $3, $4)',
      [config.coachName, config.coachEmail, hash, 'localhost']
    );
    console.log(`Seeded coach: ${config.coachEmail}`);
  }
}
