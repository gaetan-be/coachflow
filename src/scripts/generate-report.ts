/**
 * Quick report generation script for template iteration.
 *
 * Usage:  npx ts-node src/scripts/generate-report.ts <coachee_id> [--skip-ai]
 *
 * --skip-ai  fills AI chapters with placeholder text so you can test
 *            the docx template without waiting for API calls.
 *
 * Outputs:  ./output_report.docx
 */

import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { pool } from '../db';
import {
  generateEnneagrammeChapter, generateMbtiChapter, generateRiasecChapter,
  generateCompetencesBesoinsChapter, generateMetiersChapter, generatePlanActionChapter
} from '../services/ai';

// ── Re-use helpers from report.ts ──

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'templates', 'report-template.docx');
const MBTI_TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'MBTI');
const RIASEC_TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'RIASEC');

const MBTI_TEMPLATE_FILES: Record<string, string> = {
  'INTJ': 'INTJ Stratège.md', 'INTP': 'INTP Concepteur.md',
  'ENTJ': 'ENTJ Meneur.md',   'ENTP': 'ENTP Innovateur.md',
  'INFJ': 'INFJ Visionnaire.md', 'INFP': 'INFP Idéaliste.md',
  'ENFJ': 'ENFJ Animateur.md', 'ENFP': 'ENFP Communicateur.md',
  'ISTJ': 'ISTJ Administrateur.md', 'ISFJ': 'ISFJ Protecteur.md',
  'ESTJ': 'ESTJ Organisateur.md', 'ESFJ': 'ESFJ Nourricier.md',
  'ISTP': 'ISTP Practicien.md', 'ISFP': 'ISFP Conciliateur.md',
  'ESTP': 'ESTP Negociateur.md', 'ESFP': 'ESFP Facilitateur.md',
};

const RIASEC_TEMPLATE_FILES: Record<string, string> = {
  'R': 'R_REALISTE.md', 'I': 'I_INVESTIGATEUR.md', 'A': 'A_ARTISTIQUE.md',
  'S': 'S_SOCIAL.md', 'E': 'E_ENTREPRENANT.md', 'C': 'C_CONVENTIONNEL.md',
};

function loadMbtiTemplate(code: string): string | null {
  const f = MBTI_TEMPLATE_FILES[code.toUpperCase()];
  if (!f) return null;
  const p = path.join(MBTI_TEMPLATES_DIR, f);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
}

function loadRiasecTemplates(codes: string[]): string | null {
  const parts: string[] = [];
  for (const c of codes) {
    const f = RIASEC_TEMPLATE_FILES[c.toUpperCase()];
    if (!f) continue;
    const p = path.join(RIASEC_TEMPLATES_DIR, f);
    if (fs.existsSync(p)) parts.push(fs.readFileSync(p, 'utf-8'));
  }
  return parts.length > 0 ? parts.join('\n\n---\n\n') : null;
}

function csvToList(csv: string | null): Array<{ val: string }> {
  if (!csv) return [];
  return csv.split(',').filter(Boolean).map(v => ({ val: v.trim() }));
}

function formatMetiers(metiers: any): Array<{ nom: string; motscles: string; formations: Array<{ ecole: string; ville: string }> }> {
  if (!metiers || !Array.isArray(metiers)) return [];
  return metiers.map((m: any) => ({
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

// ── Main ──

async function main() {
  const args = process.argv.slice(2);
  const coacheeId = parseInt(args.find(a => !a.startsWith('--')) || '', 10);
  const skipAi = args.includes('--skip-ai');

  if (!coacheeId || isNaN(coacheeId)) {
    console.error('Usage: npx ts-node src/scripts/generate-report.ts <coachee_id> [--skip-ai]');
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
  console.log(`  Compétences: ${data.competences || '—'}  Besoins: ${data.besoins || '—'}`);
  console.log(`  Métiers: ${data.metiers ? JSON.stringify(data.metiers) : '—'}`);
  console.log(`  Plan d'action: ${data.plan_action ? 'oui' : '—'}`);

  const profile = {
    prenom: data.prenom,
    nom: data.nom,
    ecole_nom: data.ecole_nom,
    loisirs: data.loisirs,
    choix: data.choix,
    notes_coach: data.notes_coach,
  };

  let enneaText = '', mbtiText = '', riasecText = '';
  let compBesoinsText = '', metiersText = '', planActionText = '';

  if (skipAi) {
    console.log('\n--skip-ai: using placeholder text for AI chapters.');
    const placeholder = (label: string) =>
      `[${label}] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`;
    enneaText = data.ennea_base ? placeholder('Ennéagramme') : '';
    mbtiText = data.mbti ? placeholder('MBTI') : '';
    riasecText = data.riasec ? placeholder('RIASEC') : '';
    compBesoinsText = (data.competences || data.besoins) ? placeholder('Compétences & Besoins') : '';
    metiersText = (data.metiers && Array.isArray(data.metiers) && data.metiers.length > 0) ? placeholder('Métiers & Formations') : '';
    planActionText = data.plan_action ? placeholder('Plan d\'action') : '';
  } else {
    console.log('\nGenerating AI chapters (this may take a minute)...');
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
    [enneaText, mbtiText, riasecText, compBesoinsText, metiersText, planActionText] = chapters;
  }

  // Build the docx
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Template not found: ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  console.log('\nRendering Word document...');
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
  });

  const buf = doc.getZip().generate({ type: 'nodebuffer' });
  const outPath = path.join(process.cwd(), 'output_report.docx');
  fs.writeFileSync(outPath, buf);

  console.log(`\nDone! Report written to: ${outPath}`);
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
