import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { runMigrations } from '../../src/db';

export const testPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function setupTestDb(): Promise<void> {
  await runMigrations();
}

export async function truncateAll(): Promise<void> {
  await testPool.query('TRUNCATE coach, coachee, coachee_report, session CASCADE');
}

export interface SeededCoach {
  id: number;
  email: string;
  password: string;
}

export async function seedCoach(overrides: Partial<{ name: string; email: string; password: string }> = {}): Promise<SeededCoach> {
  const email = overrides.email ?? 'coach@test.be';
  const password = overrides.password ?? 'testpassword123';
  const name = overrides.name ?? 'Test Coach';
  const hash = await bcrypt.hash(password, 1); // low rounds for speed in tests
  const result = await testPool.query(
    'INSERT INTO coach (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [name, email, hash]
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
