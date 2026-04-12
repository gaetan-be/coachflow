import { Router, Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import { pool } from '../db';

export const authRoutes = Router();

authRoutes.get('/login', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'views', 'login.html'));
});

authRoutes.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis.' });
      return;
    }

    const result = await pool.query('SELECT id, password_hash FROM coach WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Identifiants incorrects.' });
      return;
    }

    const coach = result.rows[0];
    const valid = await bcrypt.compare(password, coach.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Identifiants incorrects.' });
      return;
    }

    req.session.coachId = coach.id;
    res.json({ ok: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

authRoutes.post('/api/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});
