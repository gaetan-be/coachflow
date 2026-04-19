import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../setup/app';
import { setupTestDb, truncateAll, seedCoach } from '../setup/db';

const app = buildTestApp();

beforeAll(async () => { await setupTestDb(); });
beforeEach(async () => { await truncateAll(); });

describe('POST /api/login', () => {
  it('returns 200 and sets session cookie on valid credentials', async () => {
    const coach = await seedCoach();
    const res = await request(app)
      .post('/api/login')
      .send({ email: coach.email, password: coach.password });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    await seedCoach();
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'coach@test.be', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'unknown@test.be', password: 'irrelevant' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: 'testpassword123' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'coach@test.be' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/logout', () => {
  it('destroys session and returns ok', async () => {
    const coach = await seedCoach();
    const agent = request.agent(app);
    await agent.post('/api/login').send({ email: coach.email, password: coach.password });

    const res = await agent.post('/api/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('Protected route guards', () => {
  it('redirects GET /backoffice to /coach without session', async () => {
    const res = await request(app).get('/backoffice');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/coach');
  });

  it('redirects GET /api/coachees to /coach without session', async () => {
    const res = await request(app).get('/api/coachees');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/coach');
  });

  it('redirects GET /api/coachee/:id to /coach without session', async () => {
    const res = await request(app).get('/api/coachee/1');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/coach');
  });

  it('allows access to /backoffice after login', async () => {
    const coach = await seedCoach();
    const agent = request.agent(app);
    await agent.post('/api/login').send({ email: coach.email, password: coach.password });

    const res = await agent.get('/backoffice');
    expect(res.status).toBe(200);
  });
});
