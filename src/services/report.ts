import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import os from 'os';
import { pool } from '../db';
import {
  generateEnneagrammeChapter, generateMbtiChapter, generateRiasecChapter,
  generateCompetencesBesoinsChapter, generateMetiersChapter, generatePlanActionChapter
} from './ai';
import { sendReportEmail } from './email';

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'templates', 'report-template.docx');
const PYTHON_SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'render_report.py');
const VENV_PYTHON = path.join(__dirname, '..', '..', '.venv', 'bin', 'python3');
const PYTHON_BIN = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
const MBTI_TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'MBTI');

const MBTI_TEMPLATE_FILES: Record<string, string> = {
  'INTJ': 'INTJ Stratège.md',
  'INTP': 'INTP Concepteur.md',
  'ENTJ': 'ENTJ Meneur.md',
  'ENTP': 'ENTP Innovateur.md',
  'INFJ': 'INFJ Visionnaire.md',
  'INFP': 'INFP Idéaliste.md',
  'ENFJ': 'ENFJ Animateur.md',
  'ENFP': 'ENFP Communicateur.md',
  'ISTJ': 'ISTJ Administrateur.md',
  'ISFJ': 'ISFJ Protecteur.md',
  'ESTJ': 'ESTJ Organisateur.md',
  'ESFJ': 'ESFJ Nourricier.md',
  'ISTP': 'ISTP Practicien.md',
  'ISFP': 'ISFP Conciliateur.md',
  'ESTP': 'ESTP Negociateur.md',
  'ESFP': 'ESFP Facilitateur.md',
};

const RIASEC_TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'RIASEC');

const RIASEC_TEMPLATE_FILES: Record<string, string> = {
  'R': 'R_REALISTE.md',
  'I': 'I_INVESTIGATEUR.md',
  'A': 'A_ARTISTIQUE.md',
  'S': 'S_SOCIAL.md',
  'E': 'E_ENTREPRENANT.md',
  'C': 'C_CONVENTIONNEL.md',
};

function loadRiasecTemplates(codes: string[]): string | null {
  const parts: string[] = [];
  for (const code of codes) {
    const filename = RIASEC_TEMPLATE_FILES[code.toUpperCase()];
    if (!filename) continue;
    const filePath = path.join(RIASEC_TEMPLATES_DIR, filename);
    if (fs.existsSync(filePath)) {
      parts.push(fs.readFileSync(filePath, 'utf-8'));
    }
  }
  return parts.length > 0 ? parts.join('\n\n---\n\n') : null;
}

function loadMbtiTemplate(mbtiCode: string): string | null {
  const filename = MBTI_TEMPLATE_FILES[mbtiCode.toUpperCase()];
  if (!filename) {
    console.warn(`No MBTI template found for code: ${mbtiCode}`);
    return null;
  }
  const filePath = path.join(MBTI_TEMPLATES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`MBTI template file missing: ${filePath}`);
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function csvToList(csv: string | null): Array<{ val: string }> {
  if (!csv) return [];
  return csv.split(',').filter(Boolean).map(v => ({ val: v.trim() }));
}

function formatMetiers(metiers: any): Array<{ nom: string; motscles: string; formations: Array<{ ecole: string; ville: string }> }> {
  if (!metiers || !Array.isArray(metiers)) return [];
  return metiers.map(m => ({
    nom: m.nom || '',
    motscles: m.motscles || '',
    formations: Array.isArray(m.formations) ? m.formations.map((f: any) => ({
      ecole: f.ecole || '',
      ville: f.ville || '',
    })) : [],
  }));
}

function calculateAge(dateNaissance: string): number {
  const bd = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

/** Build the template context object from coachee data + AI chapters. */
export function buildTemplateContext(
  data: any,
  enneaText: string, mbtiText: string, riasecText: string,
  compBesoinsText: string, metiersText: string, planActionText: string,
): Record<string, any> {
  const age = data.date_naissance ? calculateAge(data.date_naissance) : '';
  return {
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
    valeurs: data.valeurs || '',
    valeurs_list: csvToList(data.valeurs),
    competences: data.competences || '',
    competences_list: csvToList(data.competences),
    besoins: data.besoins || '',
    besoins_list: csvToList(data.besoins),
    metiers: formatMetiers(data.metiers),
    plan_action: data.plan_action || '',
    chapitre_enneagramme: enneaText,
    chapitre_mbti: mbtiText,
    chapitre_riasec: riasecText,
    chapitre_competences_besoins: compBesoinsText,
    chapitre_metiers: metiersText,
    chapitre_plan_action: planActionText,
    notes_coach: data.notes_coach || '',
  };
}

/** Call the Python docxtpl renderer. Returns the docx as a Buffer. */
export function renderDocxWithPython(
  templatePath: string,
  context: Record<string, any>,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tmpOut = path.join(os.tmpdir(), `brenso_report_${Date.now()}.docx`);
    const input = JSON.stringify({ template_path: templatePath, output_path: tmpOut, ...context });

    const proc = execFile(PYTHON_BIN, [PYTHON_SCRIPT], { maxBuffer: 10 * 1024 * 1024 }, (err, _stdout, stderr) => {
      if (err) {
        // Clean up temp file on error
        try { fs.unlinkSync(tmpOut); } catch {}
        reject(new Error(`Python render failed: ${stderr || err.message}`));
        return;
      }
      try {
        const buf = fs.readFileSync(tmpOut);
        fs.unlinkSync(tmpOut);
        resolve(buf);
      } catch (readErr) {
        reject(new Error(`Failed to read rendered report: ${readErr}`));
      }
    });

    proc.stdin!.write(input);
    proc.stdin!.end();
  });
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
      ? generateEnneagrammeChapter(profile, String(data.ennea_base).split(',').filter(Boolean), data.ennea_sous_type, data.words_ennea || 250)
      : Promise.resolve(''),
    data.mbti
      ? generateMbtiChapter(profile, data.mbti, data.words_mbti || 250, loadMbtiTemplate(data.mbti))
      : Promise.resolve(''),
    data.riasec
      ? generateRiasecChapter(profile, data.riasec.split(','), data.words_riasec || 200, loadRiasecTemplates(data.riasec.split(',')))
      : Promise.resolve(''),
    data.competences || data.besoins
      ? generateCompetencesBesoinsChapter(
          profile,
          (data.competences || '').split(',').filter(Boolean),
          (data.besoins || '').split(',').filter(Boolean),
          data.words_comp_besoins || 250
        )
      : Promise.resolve(''),
    data.metiers && Array.isArray(data.metiers) && data.metiers.length > 0
      ? generateMetiersChapter(profile, data.metiers, data.words_metiers || 250)
      : Promise.resolve(''),
    data.plan_action
      ? generatePlanActionChapter(profile, data.plan_action, data.words_plan_action || 200)
      : Promise.resolve(''),
  ]);

  const [enneaText, mbtiText, riasecText, compBesoinsText, metiersText, planActionText] = chapters;

  // Build Word document
  let docBuffer: Buffer;

  if (fs.existsSync(TEMPLATE_PATH)) {
    const context = buildTemplateContext(data, enneaText, mbtiText, riasecText, compBesoinsText, metiersText, planActionText);
    docBuffer = await renderDocxWithPython(TEMPLATE_PATH, context);
  } else {
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
      '=== COMPÉTENCES & BESOINS ===',
      compBesoinsText || '(Non renseigné)',
      '',
      '=== MÉTIERS & FORMATIONS ===',
      metiersText || '(Non renseigné)',
      '',
      '=== PLAN D\'ACTION ===',
      planActionText || '(Non renseigné)',
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
  }
}
