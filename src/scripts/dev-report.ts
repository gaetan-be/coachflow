/**
 * Dev iteration script for visual style work on the report.
 *
 * Usage:
 *   npx ts-node src/scripts/dev-report.ts <coachee_id> [--regen] [--open]
 *
 * First run hits the AI pipeline once (~60s) and caches the chapter JSON to
 * `.dev-chapters-<coachee_id>.json`. Subsequent runs reuse the cache, so only
 * the buildDocument/buildHtml assembly runs (~1s) — exactly what you want when
 * iterating on visual style.
 *
 * Flags:
 *   --regen   wipe the cache and re-run the AI pipeline
 *   --open    open the rendered HTML in the default browser when done
 *
 * Outputs: ./output_report.docx and ./output_report.html in cwd.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { pool } from '../db';
import { renderDocxWithClaude } from '../services/report';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const regen = args.includes('--regen');
  const open = args.includes('--open');
  const coacheeId = parseInt(args.find((a) => /^\d+$/.test(a)) || '', 10);

  if (!coacheeId || isNaN(coacheeId)) {
    console.error('Usage: npx ts-node src/scripts/dev-report.ts <coachee_id> [--regen] [--open]');
    process.exit(1);
  }

  const cachePath = path.resolve(process.cwd(), `.dev-chapters-${coacheeId}.json`);
  if (regen && fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
    console.log(`🗑️  Cache supprimé : ${cachePath}`);
  }

  console.log(`Fetching coachee ${coacheeId}...`);
  const result = await pool.query(
    `SELECT c.*, coach.email as coach_email,
            coach.name as coach_name, coach.brand_name as coach_brand_name,
            coach.telephone as coach_telephone, coach.website as coach_website
     FROM coachee c
     JOIN coach ON coach.id = c.coach_id
     WHERE c.id = $1`,
    [coacheeId],
  );
  if (result.rows.length === 0) {
    console.error(`Coachee ${coacheeId} not found.`);
    process.exit(1);
  }

  const data = result.rows[0];
  console.log(`Coachee: ${data.prenom} ${data.nom}`);
  console.log(`  MBTI: ${data.mbti || '—'}  Ennea: ${data.ennea_base || '—'}  RIASEC: ${data.riasec || '—'}`);
  console.log(
    fs.existsSync(cachePath)
      ? `♻️  Using cached chapters (${cachePath})`
      : `🔄 No cache — running full AI pipeline (this is the slow run)`,
  );

  process.env.BRENSO_CHAPTERS_CACHE = cachePath;

  const t0 = Date.now();
  const { docx, html } = await renderDocxWithClaude(data);
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  const docxOut = path.join(process.cwd(), 'output_report.docx');
  const htmlOut = path.join(process.cwd(), 'output_report.html');
  fs.writeFileSync(docxOut, docx);
  fs.writeFileSync(htmlOut, html);

  console.log(`\n✅ Done in ${dt}s`);
  console.log(`   ${docxOut}`);
  console.log(`   ${htmlOut}`);

  if (open) {
    try {
      execSync(`open "${htmlOut}"`, { stdio: 'ignore' });
    } catch {
      // open is macOS-only; ignore on other platforms
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
