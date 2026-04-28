import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { questionnaireRateLimit } from '../middleware/rateLimit';
import { renderBranded } from '../util/renderBranded';

export const publicRoutes = Router();

// NOTE: /, /terms, /hello are now handled by the React SPA catch-all in index.ts
// These routes only exist for the API endpoints below.

publicRoutes.get('/api/branding', (req: Request, res: Response) => {
  if (!req.coach) {
    res.status(404).json({ error: 'Unknown tenant.' });
    return;
  }
  res.json({
    brand_name: req.coach.brand_name,
    logo_letter: req.coach.brand_name.charAt(0).toUpperCase(),
    accent_color: req.coach.accent_color,
  });
});

// Submit questionnaire — tenant comes from the Host header via resolveCoach
publicRoutes.post('/api/questionnaire', questionnaireRateLimit, async (req: Request, res: Response) => {
  try {
    const {
      prenom, nom, date_naissance,
      ecole_nom, annee_scolaire, orientation_actuelle, choix,
      entreprise, role, situation,
      loisirs, language, profile_type,
    } = req.body;

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

    let ptype: 'young' | 'adult' = 'young';
    if (profile_type !== undefined) {
      if (profile_type !== 'young' && profile_type !== 'adult') {
        res.status(400).json({ error: 'Type de profil invalide.' });
        return;
      }
      ptype = profile_type;
    }

    // Adult multi-select arrives as string[]; persist as comma-separated to match
    // the convention used by ennea_base / riasec.
    const situationStr = Array.isArray(situation)
      ? situation.filter((s): s is string => typeof s === 'string').join(',') || null
      : (typeof situation === 'string' ? situation : null);

    // Coach is resolved from the Host header by resolveCoach middleware
    if (!req.coach) {
      res.status(500).json({ error: 'Aucun coach configuré.' });
      return;
    }
    const coachId = req.coach.id;

    const result = await pool.query(
      `INSERT INTO coachee (coach_id, prenom, nom, date_naissance,
         ecole_nom, annee_scolaire, orientation_actuelle, choix,
         entreprise, role, situation,
         loisirs, language, profile_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        coachId, prenom.trim(), nom.trim(), date_naissance,
        ecole_nom || null, annee_scolaire || null, orientation_actuelle || null, choix || null,
        entreprise || null, role || null, situationStr,
        loisirs || null, lang, ptype,
      ]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Questionnaire submit error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});
