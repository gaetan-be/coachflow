/**
 * Quick report generation script for testing.
 *
 * Usage:  npx ts-node src/scripts/generate-report.ts <coachee_id>
 *
 * Outputs:  ./output_report.docx and ./output_report.html
 */

import fs from 'fs';
import path from 'path';
import { pool } from '../db';
import { renderDocxWithClaude } from '../services/report';

async function main() {
  const coacheeId = parseInt(process.argv[2] || '', 10);

  if (!coacheeId || isNaN(coacheeId)) {
    console.error('Usage: npx ts-node src/scripts/generate-report.ts <coachee_id>');
    process.exit(1);
  }

  console.log(`Fetching coachee ${coacheeId}...`);
  const result = await pool.query('SELECT c.* FROM coachee c WHERE c.id = $1', [coacheeId]);
  if (result.rows.length === 0) {
    console.error(`Coachee ${coacheeId} not found.`);
    process.exit(1);
  }

  const data = result.rows[0];
  console.log(`Coachee: ${data.prenom} ${data.nom}`);
  console.log(`  MBTI: ${data.mbti || '—'}  Ennea: ${data.ennea_base || '—'}  RIASEC: ${data.riasec || '—'}`);

  console.log('\nGenerating report via Claude CLI pipeline...');
  const { docx, html } = await renderDocxWithClaude(data);

  const docxPath = path.join(process.cwd(), 'output_report.docx');
  const htmlPath = path.join(process.cwd(), 'output_report.html');
  fs.writeFileSync(docxPath, docx);
  fs.writeFileSync(htmlPath, html);

  console.log(`\nDone! Reports written to:`);
  console.log(`  ${docxPath}`);
  console.log(`  ${htmlPath}`);
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
