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
    res.redirect('/login');
  }
}
