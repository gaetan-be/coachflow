import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';
import { getCoachCredits, consumeCredit } from '../services/credits';
import { getCoachPlan } from '../services/plans';

export const backofficeRoutes = Router();

async function assertOwnership(coacheeId: string, coachId: number, res: Response): Promise<boolean> {
  const check = await pool.query('SELECT id FROM coachee WHERE id = $1 AND coach_id = $2', [coacheeId, coachId]);
  if (check.rows.length === 0) { res.status(404).json({ error: 'Coachee non trouvé.' }); return false; }
  return true;
}

// All backoffice routes require auth
backofficeRoutes.use('/backoffice', requireAuth);
backofficeRoutes.use('/api/coachee', requireAuth);
backofficeRoutes.use('/api/coachees', requireAuth);
backofficeRoutes.use('/api/coach', requireAuth);

// NOTE: /backoffice pages are now served by React SPA catch-all in index.ts
// The requireAuth middleware still guards all /api/coachee, /api/coachees, /api/coach routes

// API: List all coachees
backofficeRoutes.get('/api/coachees', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.prenom, c.nom, c.created_at,
             (SELECT r.status FROM coachee_report r WHERE r.coachee_id = c.id ORDER BY r.created_at DESC LIMIT 1) as report_status
      FROM coachee c
      WHERE c.coach_id = $1
      ORDER BY c.created_at DESC
    `, [req.session.coachId]);
    res.json(result.rows);
  } catch (err) {
    console.error('List coachees error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// API: Get single coachee
backofficeRoutes.get('/api/coachee/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.coach_id, c.prenom, c.nom, c.date_naissance, c.ecole_nom,
             c.code_postal, c.date_seance, c.loisirs, c.choix,
             c.ennea_base, c.ennea_sous_type, c.mbti, c.riasec,
             c.words_ennea, c.words_mbti, c.words_riasec, c.notes_coach,
             c.valeurs, c.competences, c.besoins, c.words_comp_besoins,
             c.metiers, c.words_metiers, c.plan_action, c.words_plan_action,
             c.created_at, c.updated_at,
             (SELECT r.status FROM coachee_report r WHERE r.coachee_id = c.id ORDER BY r.created_at DESC LIMIT 1) as report_status
      FROM coachee c
      WHERE c.id = $1 AND c.coach_id = $2
    `, [req.params.id, req.session.coachId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Coachee non trouvé.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get coachee error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// API: Update coachee
backofficeRoutes.put('/api/coachee/:id', async (req: Request, res: Response) => {
  try {
    const {
      prenom, nom, date_naissance, ecole_nom, code_postal,
      date_seance, choix, loisirs, ennea_base, ennea_sous_type,
      mbti, riasec, words_ennea, words_mbti, words_riasec, notes_coach,
      valeurs, competences, besoins, words_comp_besoins,
      metiers, words_metiers, plan_action, words_plan_action
    } = req.body;

    await pool.query(`
      UPDATE coachee SET
        prenom = $1, nom = $2, date_naissance = $3, ecole_nom = $4,
        code_postal = $5, date_seance = $6, choix = $7, loisirs = $8,
        ennea_base = $9, ennea_sous_type = $10, mbti = $11, riasec = $12,
        words_ennea = $13, words_mbti = $14, words_riasec = $15,
        notes_coach = $16,
        valeurs = $17, competences = $18, besoins = $19, words_comp_besoins = $20,
        metiers = $21::jsonb, words_metiers = $22,
        plan_action = $23, words_plan_action = $24,
        updated_at = NOW()
      WHERE id = $25 AND coach_id = $26
    `, [
      prenom, nom, date_naissance, ecole_nom || null,
      code_postal || null, date_seance || null, choix || null, loisirs || null,
      ennea_base || null, ennea_sous_type || null, mbti || null, riasec || null,
      words_ennea || 250, words_mbti || 250, words_riasec || 200,
      notes_coach || null,
      valeurs || null, competences || null, besoins || null, words_comp_besoins || 250,
      metiers ? JSON.stringify(metiers) : null, words_metiers || 250,
      plan_action || null, words_plan_action || 200,
      req.params.id, req.session.coachId
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Update coachee error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// API: Queue report
backofficeRoutes.post('/api/coachee/:id/report', async (req: Request, res: Response) => {
  try {
    const coachId = req.session.coachId!;
    if (!await assertOwnership(req.params.id, coachId, res)) return;

    // Check if already queued/processing
    const existing = await pool.query(
      "SELECT id FROM coachee_report WHERE coachee_id = $1 AND status IN ('queued', 'processing')",
      [req.params.id]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Un rapport est déjà en cours de génération.' });
      return;
    }

    // Credit check: coaches without a plan bypass entirely
    const { plan_name } = await getCoachPlan(coachId);
    let allocationId: number | null = null;
    if (plan_name !== null) {
      allocationId = await consumeCredit(coachId);
      if (allocationId === null) {
        res.status(402).json({ error: 'Aucun crédit disponible.' });
        return;
      }
    }

    await pool.query(
      'INSERT INTO coachee_report (coachee_id, status, credit_allocation_id) VALUES ($1, $2, $3)',
      [req.params.id, 'queued', allocationId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Queue report error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

function detectLanguageFromHeader(header: string | undefined): 'fr' | 'nl' {
  if (!header) return 'fr';
  // Accept-Language is a comma-separated list of tags with optional q-values.
  // We only care whether 'nl' appears with a higher q than 'fr'.
  const tags = header.split(',').map(s => {
    const [tag, ...params] = s.trim().split(';');
    const qParam = params.find(p => p.trim().startsWith('q='));
    const q = qParam ? parseFloat(qParam.split('=')[1]) : 1;
    return { lang: tag.toLowerCase().split('-')[0], q: isNaN(q) ? 1 : q };
  });
  const nl = tags.find(t => t.lang === 'nl');
  const fr = tags.find(t => t.lang === 'fr');
  if (nl && (!fr || nl.q > fr.q)) return 'nl';
  return 'fr';
}

// API: Coach identity + plan + credits (used by header dropdown)
backofficeRoutes.get('/api/coach/me', async (req: Request, res: Response) => {
  try {
    const coachId = req.session.coachId!;
    const [coachResult, credits, plan] = await Promise.all([
      pool.query('SELECT name, email, language FROM coach WHERE id = $1', [coachId]),
      getCoachCredits(coachId),
      getCoachPlan(coachId),
    ]);
    const coach = coachResult.rows[0];
    let language: 'fr' | 'nl' = coach.language;
    if (!language) {
      language = detectLanguageFromHeader(req.headers['accept-language']);
      await pool.query('UPDATE coach SET language = $1 WHERE id = $2', [language, coachId]);
    }
    res.json({
      name: coach.name,
      email: coach.email,
      language,
      plan: plan.plan_name,
      plan_display_name: plan.plan_display_name,
      features: plan.features,
      balance: credits.balance,
      allocations: credits.allocations,
    });
  } catch (err) {
    console.error('Get coach/me error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// API: Update coach profile (currently only language; extend with display name, etc. later)
backofficeRoutes.put('/api/coach/profile', async (req: Request, res: Response) => {
  try {
    const { language } = req.body;
    if (language !== 'fr' && language !== 'nl') {
      res.status(400).json({ error: 'Langue invalide.' });
      return;
    }
    await pool.query('UPDATE coach SET language = $1 WHERE id = $2', [language, req.session.coachId]);
    res.json({ ok: true, language });
  } catch (err) {
    console.error('Update coach profile error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// API: Report history across all coachees
backofficeRoutes.get('/api/coach/reports', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.id AS report_id, c.id AS coachee_id, c.prenom, c.nom,
             r.status, r.created_at, r.completed_at, r.error_message
      FROM coachee_report r
      JOIN coachee c ON c.id = r.coachee_id
      WHERE c.coach_id = $1
      ORDER BY r.created_at DESC
    `, [req.session.coachId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get coach/reports error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// API: Change password
backofficeRoutes.put('/api/coach/password', async (req: Request, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 8) {
      res.status(400).json({ error: 'Données invalides.' });
      return;
    }

    const result = await pool.query('SELECT password_hash FROM coach WHERE id = $1', [req.session.coachId]);
    const coach = result.rows[0];
    const valid = await bcrypt.compare(current_password, coach.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE coach SET password_hash = $1 WHERE id = $2', [newHash, req.session.coachId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// API: Get coach credits and plan info
backofficeRoutes.get('/api/coach/credits', async (req: Request, res: Response) => {
  try {
    const coachId = req.session.coachId!;
    const [credits, plan] = await Promise.all([
      getCoachCredits(coachId),
      getCoachPlan(coachId),
    ]);
    res.json({
      plan: plan.plan_name,
      plan_display_name: plan.plan_display_name,
      features: plan.features,
      balance: credits.balance,
      allocations: credits.allocations,
    });
  } catch (err) {
    console.error('Get credits error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// API: Download report
backofficeRoutes.get('/api/coachee/:id/report/download', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.report_data, c.prenom, c.nom
      FROM coachee_report r
      JOIN coachee c ON c.id = r.coachee_id
      WHERE r.coachee_id = $1 AND c.coach_id = $2 AND r.status = 'done' AND r.report_data IS NOT NULL
      ORDER BY r.completed_at DESC
      LIMIT 1
    `, [req.params.id, req.session.coachId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Rapport non trouvé.' });
      return;
    }

    const row = result.rows[0];
    const filename = `Brenso_Rapport_${row.prenom}_${row.nom}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(row.report_data);
  } catch (err) {
    console.error('Download report error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});
