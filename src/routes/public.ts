import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { questionnaireRateLimit } from '../middleware/rateLimit';
import { renderBranded } from '../util/renderBranded';

export const publicRoutes = Router();

// Front page
publicRoutes.get('/', (req: Request, res: Response) => {
  renderBranded(req, res, 'views/home.html');
});

// Terms & GDPR page
publicRoutes.get('/terms', (req: Request, res: Response) => {
  renderBranded(req, res, 'views/terms.html');
});

// Serve questionnaire page
publicRoutes.get('/hello', (req: Request, res: Response) => {
  renderBranded(req, res, 'views/questionnaire.html');
});

// Submit questionnaire — tenant comes from the Host header via resolveCoach
publicRoutes.post('/api/questionnaire', questionnaireRateLimit, async (req: Request, res: Response) => {
  try {
    if (!req.coach) {
      res.status(500).json({ error: 'Aucun coach configuré.' });
      return;
    }

    const { prenom, nom, date_naissance, ecole_nom, annee_scolaire, orientation_actuelle, loisirs, choix } = req.body;

    if (!prenom || !nom || !date_naissance) {
      res.status(400).json({ error: 'Prénom, nom et date de naissance sont requis.' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO coachee (coach_id, prenom, nom, date_naissance, ecole_nom, annee_scolaire, orientation_actuelle, loisirs, choix)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [req.coach.id, prenom.trim(), nom.trim(), date_naissance, ecole_nom || null, annee_scolaire || null, orientation_actuelle || null, loisirs || null, choix || null]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Questionnaire submit error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});
