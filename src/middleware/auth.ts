import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    coachId?: number;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session.coachId) {
    next();
  } else {
    // Return 401 JSON for API routes (consumed by React SPA)
    // The SPA handles the redirect to /coach via its RequireAuth component
    res.status(401).json({ error: 'Non authentifié.' });
  }
}
