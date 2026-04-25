import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from '../../src/middleware/auth';
import type { Request, Response, NextFunction } from 'express';

function makeReq(coachId?: number): Request {
  return { session: { coachId } } as unknown as Request;
}

function makeRes() {
  const res = { redirect: vi.fn(), json: vi.fn(), status: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe('requireAuth', () => {
  it('calls next() when session has coachId', () => {
    const req = makeReq(42);
    const res = makeRes() as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('returns 401 JSON when session has no coachId', () => {
    const req = makeReq(undefined);
    const res = makeRes() as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Non authentifié.' });
    expect(next).not.toHaveBeenCalled();
  });
});
