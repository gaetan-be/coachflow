import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';

export interface CoachBranding {
  id: number;
  brand_name: string;
  logo_letter: string;
  accent_color: string;
  domain: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      coach?: CoachBranding;
    }
  }
}

// Simple in-process cache to avoid a DB hit on every request.
const cache = new Map<string, { value: CoachBranding; at: number }>();
const TTL_MS = 60_000;

export async function resolveCoach(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const host = (req.hostname || '').toLowerCase();

  const cached = cache.get(host);
  if (cached && Date.now() - cached.at < TTL_MS) {
    req.coach = cached.value;
    next();
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, brand_name, logo_letter, accent_color, domain FROM coach WHERE domain = $1',
      [host],
    );
    if (rows.length === 0) {
      res.status(404).send('Unknown domain');
      return;
    }
    const coach = rows[0] as CoachBranding;
    cache.set(host, { value: coach, at: Date.now() });
    req.coach = coach;
    next();
  } catch (err) {
    console.error('resolveCoach error:', err);
    res.status(500).send('Server error');
  }
}

export function invalidateCoachCache(): void {
  cache.clear();
}
