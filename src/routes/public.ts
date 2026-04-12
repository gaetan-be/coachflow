import { Router, Request, Response } from 'express';
import path from 'path';
import { pool } from '../db';
import { questionnaireRateLimit } from '../middleware/rateLimit';

export const publicRoutes = Router();

// Serve questionnaire page
publicRoutes.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'views', 'questionnaire.html'));
});

// Submit questionnaire
publicRoutes.post('/api/questionnaire', questionnaireRateLimit, async (req: Request, res: Response) => {
  try {
    const { prenom, nom, date_naissance, ecole_nom, annee_scolaire, orientation_actuelle, loisirs, choix } = req.body;

    if (!prenom || !nom || !date_naissance) {
      res.status(400).json({ error: 'Prénom, nom et date de naissance sont requis.' });
      return;
    }

    // Get the single coach
    const coachResult = await pool.query('SELECT id FROM coach LIMIT 1');
    if (coachResult.rows.length === 0) {
      res.status(500).json({ error: 'Aucun coach configuré.' });
      return;
    }
    const coachId = coachResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO coachee (coach_id, prenom, nom, date_naissance, ecole_nom, annee_scolaire, orientation_actuelle, loisirs, choix)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [coachId, prenom.trim(), nom.trim(), date_naissance, ecole_nom || null, annee_scolaire || null, orientation_actuelle || null, loisirs || null, choix || null]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Questionnaire submit error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});
