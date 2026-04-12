import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { pool } from '../db';
import { generateEnneagrammeChapter, generateMbtiChapter, generateRiasecChapter } from './ai';
import { sendReportEmail } from './email';

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'templates', 'report-template.docx');

function calculateAge(dateNaissance: string): number {
  const bd = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

export async function processReport(reportId: number): Promise<void> {
  // Get report + coachee data
  const reportResult = await pool.query(`
    SELECT r.id, r.coachee_id, c.*, coach.email as coach_email
    FROM coachee_report r
    JOIN coachee c ON c.id = r.coachee_id
    JOIN coach ON coach.id = c.coach_id
    WHERE r.id = $1
  `, [reportId]);

  if (reportResult.rows.length === 0) {
    throw new Error(`Report ${reportId} not found`);
  }

  const data = reportResult.rows[0];
  const profile = {
    prenom: data.prenom,
    nom: data.nom,
    ecole_nom: data.ecole_nom,
    loisirs: data.loisirs,
    choix: data.choix,
    notes_coach: data.notes_coach,
  };

  // Generate AI chapters in parallel
  const chapters = await Promise.all([
    data.ennea_base
      ? generateEnneagrammeChapter(profile, data.ennea_base, data.ennea_sous_type, data.words_ennea || 250)
      : Promise.resolve(''),
    data.mbti
      ? generateMbtiChapter(profile, data.mbti, data.words_mbti || 250)
      : Promise.resolve(''),
    data.riasec
      ? generateRiasecChapter(profile, data.riasec.split(','), data.words_riasec || 200)
      : Promise.resolve(''),
  ]);

  const [enneaText, mbtiText, riasecText] = chapters;

  // Build Word document
  let docBuffer: Buffer;

  if (fs.existsSync(TEMPLATE_PATH)) {
    // Use user-provided template
    const templateContent = fs.readFileSync(TEMPLATE_PATH, 'binary');
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const age = data.date_naissance ? calculateAge(data.date_naissance) : '';

    doc.render({
      prenom: data.prenom || '',
      nom: data.nom || '',
      date_naissance: data.date_naissance ? new Date(data.date_naissance).toLocaleDateString('fr-BE') : '',
      age: age.toString(),
      ecole: data.ecole_nom || '',
      annee_scolaire: data.annee_scolaire || '',
      orientation: data.orientation_actuelle || '',
      code_postal: data.code_postal || '',
      loisirs: data.loisirs || '',
      choix: data.choix || '',
      date_seance: data.date_seance ? new Date(data.date_seance).toLocaleDateString('fr-BE') : '',
      ennea_base: data.ennea_base ? data.ennea_base.toString() : '',
      ennea_sous_type: data.ennea_sous_type || '',
      mbti: data.mbti || '',
      riasec: data.riasec || '',
      chapitre_enneagramme: enneaText,
      chapitre_mbti: mbtiText,
      chapitre_riasec: riasecText,
      notes_coach: data.notes_coach || '',
    });

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    docBuffer = buf;
  } else {
    // No template — generate a minimal placeholder
    console.warn('No report template found at', TEMPLATE_PATH);
    console.warn('Please provide a .docx template. Storing raw text as fallback.');

    const fallbackText = [
      `RAPPORT D'ORIENTATION — ${data.prenom} ${data.nom}`,
      '',
      '=== ENNÉAGRAMME ===',
      enneaText || '(Non renseigné)',
      '',
      '=== MBTI ===',
      mbtiText || '(Non renseigné)',
      '',
      '=== RIASEC ===',
      riasecText || '(Non renseigné)',
      '',
      '=== NOTES DU COACH ===',
      data.notes_coach || '(Aucune)',
    ].join('\n');

    docBuffer = Buffer.from(fallbackText, 'utf-8');
  }

  // Store in DB
  await pool.query(
    'UPDATE coachee_report SET report_data = $1, status = $2, completed_at = NOW() WHERE id = $3',
    [docBuffer, 'done', reportId]
  );

  // Send email
  try {
    await sendReportEmail(data.coach_email, `${data.prenom} ${data.nom}`, docBuffer);
    console.log(`Report ${reportId} emailed to ${data.coach_email}`);
  } catch (emailErr) {
    console.error(`Report ${reportId} generated but email failed:`, emailErr);
    // Don't fail the report — it's still downloadable
  }
}
