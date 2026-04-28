import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { runMigrations } from '../../src/db';
import { invalidateCoachCache } from '../../src/middleware/coach';

export const testPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function setupTestDb(): Promise<void> {
  await runMigrations();
}

export async function truncateAll(): Promise<void> {
  await testPool.query('TRUNCATE coach, coachee, coachee_report, session CASCADE');
  invalidateCoachCache();
}

export interface SeededCoach {
  id: number;
  email: string;
  password: string;
}

export async function seedCoach(overrides: Partial<{ name: string; email: string; password: string; domain: string }> = {}): Promise<SeededCoach> {
  const email = overrides.email ?? 'coach@test.be';
  const password = overrides.password ?? 'testpassword123';
  const name = overrides.name ?? 'Test Coach';
  // domain must be NOT NULL + UNIQUE since migration 003_coach_tenant. The first
  // coach takes '127.0.0.1' so it matches the Host that supertest sends; any
  // additional coaches in the same test get a unique domain derived from their
  // email (used for cross-tenant boundary assertions, not for HTTP routing).
  let domain = overrides.domain;
  if (!domain) {
    const existing = await testPool.query('SELECT 1 FROM coach LIMIT 1');
    domain = existing.rows.length === 0 ? '127.0.0.1' : email.replace('@', '.');
  }
  const hash = await bcrypt.hash(password, 1); // low rounds for speed in tests
  const result = await testPool.query(
    'INSERT INTO coach (name, email, password_hash, domain) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, hash, domain]
  );
  return { id: result.rows[0].id, email, password };
}

export interface SeededCoachee {
  id: number;
  coachId: number;
  prenom: string;
  nom: string;
}

export async function seedCoachee(coachId: number, overrides: Record<string, any> = {}): Promise<SeededCoachee> {
  const prenom = overrides.prenom ?? 'Alice';
  const nom = overrides.nom ?? 'Dupont';
  const date_naissance = overrides.date_naissance ?? '2005-06-15';
  const result = await testPool.query(
    `INSERT INTO coachee (coach_id, prenom, nom, date_naissance)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [coachId, prenom, nom, date_naissance]
  );
  return { id: result.rows[0].id, coachId, prenom, nom };
}
