import { Router, Request, Response } from 'express';
import path from 'path';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

export const backofficeRoutes = Router();

// All backoffice routes require auth
backofficeRoutes.use('/backoffice', requireAuth);
backofficeRoutes.use('/api/coachee', requireAuth);
backofficeRoutes.use('/api/coachees', requireAuth);

// List page
backofficeRoutes.get('/backoffice', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'views', 'list.html'));
});

// Pipeline page
backofficeRoutes.get('/backoffice/coachee/:id', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'views', 'pipeline.html'));
});

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
      SELECT c.*,
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
      mbti, riasec, words_ennea, words_mbti, words_riasec, notes_coach
    } = req.body;

    await pool.query(`
      UPDATE coachee SET
        prenom = $1, nom = $2, date_naissance = $3, ecole_nom = $4,
        code_postal = $5, date_seance = $6, choix = $7, loisirs = $8,
        ennea_base = $9, ennea_sous_type = $10, mbti = $11, riasec = $12,
        words_ennea = $13, words_mbti = $14, words_riasec = $15,
        notes_coach = $16, updated_at = NOW()
      WHERE id = $17 AND coach_id = $18
    `, [
      prenom, nom, date_naissance, ecole_nom || null,
      code_postal || null, date_seance || null, choix || null, loisirs || null,
      ennea_base || null, ennea_sous_type || null, mbti || null, riasec || null,
      words_ennea || 250, words_mbti || 250, words_riasec || 200,
      notes_coach || null, req.params.id, req.session.coachId
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
    // Verify coachee belongs to coach
    const check = await pool.query(
      'SELECT id FROM coachee WHERE id = $1 AND coach_id = $2',
      [req.params.id, req.session.coachId]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Coachee non trouvé.' });
      return;
    }

    // Check if already queued/processing
    const existing = await pool.query(
      "SELECT id FROM coachee_report WHERE coachee_id = $1 AND status IN ('queued', 'processing')",
      [req.params.id]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Un rapport est déjà en cours de génération.' });
      return;
    }

    await pool.query(
      'INSERT INTO coachee_report (coachee_id, status) VALUES ($1, $2)',
      [req.params.id, 'queued']
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Queue report error:', err);
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
