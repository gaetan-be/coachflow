/**
 * Add a new coach tenant.
 *
 * Usage:
 *   npx ts-node src/scripts/add-coach.ts \
 *     --email marie@example.com \
 *     --password SuperSecret \
 *     --name "Marie Coach" \
 *     --domain marie.example.com \
 *     --brand "MARIE" \
 *     --letter "M" \
 *     --color "#d97b45" \
 *     [--plan starter] \
 *     [--language fr|nl] \
 *     [--credits 3] \
 *     [--validity-days 30]
 *
 * Notes on credits + plans:
 *   - No --plan: coach has unlimited reports (credit checks bypassed in /api/coachee/:id/report).
 *   - --plan set: each report consumes one credit_allocation row; without an allocation the coach gets 402.
 *   - --credits N grants an initial allocation (source=manual). --validity-days D sets expiry; omit for no expiry.
 *   - The two flags are independent — you can grant credits without a plan (will sit unused) or assign a plan
 *     without credits (coach will be locked out until allocations are added separately).
 */
import bcrypt from 'bcrypt';
import { pool } from '../db';

interface Args {
  email: string;
  password: string;
  name: string;
  domain: string;
  brand: string;
  letter: string;
  color: string;
  plan?: string;
  language?: 'fr' | 'nl';
  credits?: number;
  validityDays?: number;
}

function parseArgs(): Args {
  const raw: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    const value = argv[i + 1];
    if (!value) throw new Error(`Missing value for --${key}`);
    raw[key] = value;
  }

  const required = ['email', 'password', 'name', 'domain', 'brand', 'letter', 'color'];
  for (const k of required) {
    if (!raw[k]) throw new Error(`Missing required arg --${k}`);
  }

  if (raw.letter.length !== 1) {
    throw new Error('--letter must be a single character');
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(raw.color)) {
    throw new Error('--color must be a hex color like #3fa8b8');
  }
  if (raw.language !== undefined && raw.language !== 'fr' && raw.language !== 'nl') {
    throw new Error('--language must be "fr" or "nl"');
  }

  const args: Args = {
    email: raw.email,
    password: raw.password,
    name: raw.name,
    domain: raw.domain,
    brand: raw.brand,
    letter: raw.letter,
    color: raw.color,
  };

  if (raw.plan) args.plan = raw.plan;
  if (raw.language) args.language = raw.language as 'fr' | 'nl';

  if (raw.credits !== undefined) {
    const n = parseInt(raw.credits, 10);
    if (!Number.isFinite(n) || n <= 0) throw new Error('--credits must be a positive integer');
    args.credits = n;
  }
  if (raw['validity-days'] !== undefined) {
    const d = parseInt(raw['validity-days'], 10);
    if (!Number.isFinite(d) || d <= 0) throw new Error('--validity-days must be a positive integer');
    args.validityDays = d;
  }
  if (args.validityDays !== undefined && args.credits === undefined) {
    throw new Error('--validity-days requires --credits');
  }

  return args;
}

async function main(): Promise<void> {
  const a = parseArgs();
  const hash = await bcrypt.hash(a.password, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let planId: number | null = null;
    if (a.plan) {
      const p = await client.query<{ id: number }>('SELECT id FROM plan WHERE name = $1', [a.plan]);
      if (p.rows.length === 0) throw new Error(`Unknown plan "${a.plan}"`);
      planId = p.rows[0].id;
    }

    const coachRes = await client.query<{ id: number }>(
      `INSERT INTO coach (name, email, password_hash, domain, brand_name, logo_letter, accent_color, plan_id, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [a.name, a.email, hash, a.domain.toLowerCase(), a.brand, a.letter, a.color, planId, a.language ?? null],
    );
    const coachId = coachRes.rows[0].id;

    let allocationNote: string | null = null;
    if (a.credits !== undefined) {
      const validUntil = a.validityDays !== undefined
        ? new Date(Date.now() + a.validityDays * 24 * 60 * 60 * 1000)
        : null;
      await client.query(
        `INSERT INTO credit_allocation (coach_id, amount, valid_until, source, note)
         VALUES ($1, $2, $3, 'manual', $4)`,
        [coachId, a.credits, validUntil, 'Initial allocation via add-coach'],
      );
      allocationNote = `${a.credits} credits${validUntil ? ` (valid until ${validUntil.toISOString()})` : ' (no expiry)'}`;
    }

    await client.query('COMMIT');

    const summary = [
      `Coach created: id=${coachId} domain=${a.domain} email=${a.email}`,
      a.plan ? `  plan: ${a.plan} (id=${planId})` : '  plan: none (unlimited reports)',
      a.language ? `  language: ${a.language}` : '  language: auto-detect on first /api/coach/me',
      allocationNote ? `  initial allocation: ${allocationNote}` : '  initial allocation: none',
    ].join('\n');
    console.log(summary);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
