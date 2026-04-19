import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from '../../src/middleware/auth';
import type { Request, Response, NextFunction } from 'express';

function makeReq(coachId?: number): Request {
  return { session: { coachId } } as unknown as Request;
}

function makeRes(): { redirect: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> } {
  return { redirect: vi.fn(), status: vi.fn() };
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

  it('redirects to /coach when session has no coachId', () => {
    const req = makeReq(undefined);
    const res = makeRes() as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/coach');
    expect(next).not.toHaveBeenCalled();
  });
});
