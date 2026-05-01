import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import os from 'os';
import { pool } from '../db';
import { sendReportEmail } from './email';
import { mapCoacheeToJson } from './reportUtils';

const CLAUDE_TPL_DIR = path.join(__dirname, '..', '..', 'claude-tpl-maker');
const MAKE_DOCX_SCRIPT = path.join(CLAUDE_TPL_DIR, 'make-docx.sh');

export interface RenderedReport {
  docx: Buffer;
  html: Buffer;
}

/** Generate a BRENSO report via Claude CLI (make-docx.sh). Returns DOCX + HTML buffers. */
export function renderDocxWithClaude(data: any): Promise<RenderedReport> {
  return new Promise((resolve, reject) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brenso-'));
    const jsonPath = path.join(tmpDir, 'questionnaire.json');
    const docxPath = path.join(tmpDir, 'brenso-raport.docx');
    const htmlPath = path.join(tmpDir, 'brenso-raport.html');

    const questionnaireJson = mapCoacheeToJson(data);
    fs.writeFileSync(jsonPath, JSON.stringify(questionnaireJson, null, 2));

    execFile('bash', [MAKE_DOCX_SCRIPT, jsonPath, docxPath, htmlPath], {
      cwd: tmpDir,
      timeout: 5 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env },
    }, (err, stdout, stderr) => {
      if (err) {
        console.error('[make-docx] stdout:', stdout);
        console.error('[make-docx] stderr:', stderr);
        try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
        reject(new Error(`Claude report generation failed: ${stderr || stdout || err.message}`));
        return;
      }

      try {
        const docx = fs.readFileSync(docxPath);
        const html = fs.readFileSync(htmlPath);
        fs.rmSync(tmpDir, { recursive: true });
        resolve({ docx, html });
      } catch (readErr) {
        try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
        reject(new Error(`Failed to read generated report: ${readErr}`));
      }
    });
  });
}

export async function processReport(reportId: number): Promise<void> {
  const reportResult = await pool.query(`
    SELECT r.id, r.coachee_id, c.*, coach.email as coach_email,
           coach.name as coach_name, coach.brand_name as coach_brand_name,
           coach.telephone as coach_telephone, coach.website as coach_website
    FROM coachee_report r
    JOIN coachee c ON c.id = r.coachee_id
    JOIN coach ON coach.id = c.coach_id
    WHERE r.id = $1
  `, [reportId]);

  if (reportResult.rows.length === 0) {
    throw new Error(`Report ${reportId} not found`);
  }

  const data = reportResult.rows[0];

  // Delegate AI chapter generation + docx assembly to Claude CLI
  const { docx, html } = await renderDocxWithClaude(data);

  // Store in DB
  await pool.query(
    'UPDATE coachee_report SET report_data = $1, html_data = $2, status = $3, completed_at = NOW() WHERE id = $4',
    [docx, html, 'done', reportId]
  );

  // Send email
  try {
    await sendReportEmail(data.coach_email, `${data.prenom} ${data.nom}`, docx, html);
    console.log(`Report ${reportId} emailed to ${data.coach_email}`);
  } catch (emailErr) {
    console.error(`Report ${reportId} generated but email failed:`, emailErr);
  }
}
