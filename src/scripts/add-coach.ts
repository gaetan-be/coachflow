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
 *     --color "#d97b45"
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
}

function parseArgs(): Args {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    const value = argv[i + 1];
    if (!value) throw new Error(`Missing value for --${key}`);
    args[key] = value;
  }

  const required = ['email', 'password', 'name', 'domain', 'brand', 'letter', 'color'];
  for (const k of required) {
    if (!args[k]) throw new Error(`Missing required arg --${k}`);
  }

  if (args.letter.length !== 1) {
    throw new Error('--letter must be a single character');
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(args.color)) {
    throw new Error('--color must be a hex color like #3fa8b8');
  }

  return args as unknown as Args;
}

async function main(): Promise<void> {
  const a = parseArgs();
  const hash = await bcrypt.hash(a.password, 10);

  const res = await pool.query(
    `INSERT INTO coach (name, email, password_hash, domain, brand_name, logo_letter, accent_color)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [a.name, a.email, hash, a.domain.toLowerCase(), a.brand, a.letter, a.color],
  );

  console.log(`Coach created: id=${res.rows[0].id} domain=${a.domain} email=${a.email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
