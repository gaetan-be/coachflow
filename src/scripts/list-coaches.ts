/**
 * List all coaches with their last login timestamp, most-recent first.
 *
 * Usage:
 *   npm run coaches:list
 *
 * Outputs a table to stdout. NULL last_login_at = never logged in since the
 * column was added (migration 008).
 */

import 'dotenv/config';
import { pool } from '../db';

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
}

async function main(): Promise<void> {
  const result = await pool.query<{
    id: number;
    name: string;
    email: string;
    domain: string;
    last_login_at: Date | null;
    created_at: Date;
  }>(`
    SELECT id, name, email, domain, last_login_at, created_at
    FROM coach
    ORDER BY last_login_at DESC NULLS LAST, id ASC
  `);

  const rows = result.rows;
  if (rows.length === 0) {
    console.log('No coaches.');
    await pool.end();
    return;
  }

  const header = ['id', 'name', 'email', 'domain', 'last login', 'created'];
  const widths = header.map((h) => h.length);
  const data = rows.map((r) => [
    String(r.id),
    r.name || '—',
    r.email || '—',
    r.domain || '—',
    formatDate(r.last_login_at),
    formatDate(r.created_at),
  ]);
  for (const row of data) {
    row.forEach((cell, i) => { widths[i] = Math.max(widths[i], cell.length); });
  }

  const printRow = (cells: string[]) =>
    console.log(cells.map((c, i) => c.padEnd(widths[i])).join('  '));

  printRow(header);
  printRow(widths.map((w) => '─'.repeat(w)));
  data.forEach(printRow);

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
