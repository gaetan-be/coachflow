import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { questionnaireRateLimit } from '../middleware/rateLimit';
import { renderBranded } from '../util/renderBranded';

export const publicRoutes = Router();

// NOTE: /, /terms, /hello are now handled by the React SPA catch-all in index.ts
// These routes only exist for the API endpoints below.

// Submit questionnaire — tenant comes from the Host header via resolveCoach
publicRoutes.post('/api/questionnaire', questionnaireRateLimit, async (req: Request, res: Response) => {
  try {
    const { prenom, nom, date_naissance, ecole_nom, annee_scolaire, orientation_actuelle, loisirs, choix, language } = req.body;

    if (!prenom || !nom || !date_naissance) {
      res.status(400).json({ error: 'Prénom, nom et date de naissance sont requis.' });
      return;
    }

    let lang: 'fr' | 'nl' = 'fr';
    if (language !== undefined) {
      if (language !== 'fr' && language !== 'nl') {
        res.status(400).json({ error: 'Langue invalide.' });
        return;
      }
      lang = language;
    }

    // Get the single coach
    const coachResult = await pool.query('SELECT id FROM coach LIMIT 1');
    if (coachResult.rows.length === 0) {
      res.status(500).json({ error: 'Aucun coach configuré.' });
      return;
    }
    const coachId = coachResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO coachee (coach_id, prenom, nom, date_naissance, ecole_nom, annee_scolaire, orientation_actuelle, loisirs, choix, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [coachId, prenom.trim(), nom.trim(), date_naissance, ecole_nom || null, annee_scolaire || null, orientation_actuelle || null, loisirs || null, choix || null, lang]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Questionnaire submit error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});
