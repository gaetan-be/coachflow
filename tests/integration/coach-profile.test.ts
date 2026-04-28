import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../setup/app';
import { setupTestDb, truncateAll, seedCoach, testPool } from '../setup/db';

const app = buildTestApp();

beforeAll(async () => { await setupTestDb(); });
beforeEach(async () => { await truncateAll(); });

async function login() {
  const coach = await seedCoach();
  const agent = request.agent(app);
  await agent.post('/api/login').send({ email: coach.email, password: coach.password });
  return { agent, coach };
}

describe('GET /api/coach/me — language', () => {
  it('defaults to fr when language is null and no Accept-Language header', async () => {
    const { agent, coach } = await login();
    const res = await agent.get('/api/coach/me');
    expect(res.status).toBe(200);
    expect(res.body.language).toBe('fr');

    const row = await testPool.query('SELECT language FROM coach WHERE id = $1', [coach.id]);
    expect(row.rows[0].language).toBe('fr');
  });

  it('derives nl from Accept-Language header and persists it', async () => {
    const { agent, coach } = await login();
    const res = await agent.get('/api/coach/me').set('Accept-Language', 'nl-BE,nl;q=0.9,en;q=0.5');
    expect(res.status).toBe(200);
    expect(res.body.language).toBe('nl');

    const row = await testPool.query('SELECT language FROM coach WHERE id = $1', [coach.id]);
    expect(row.rows[0].language).toBe('nl');
  });

  it('returns the persisted language regardless of Accept-Language on subsequent calls', async () => {
    const { agent } = await login();
    await agent.get('/api/coach/me').set('Accept-Language', 'nl');
    const res = await agent.get('/api/coach/me').set('Accept-Language', 'fr');
    expect(res.body.language).toBe('nl');
  });
});

describe('PUT /api/coach/profile', () => {
  it('updates the coach language and reflects it in /me', async () => {
    const { agent, coach } = await login();
    const put = await agent
      .put('/api/coach/profile')
      .send({ language: 'nl' });
    expect(put.status).toBe(200);
    expect(put.body).toEqual({ ok: true, language: 'nl' });

    const row = await testPool.query('SELECT language FROM coach WHERE id = $1', [coach.id]);
    expect(row.rows[0].language).toBe('nl');

    const me = await agent.get('/api/coach/me');
    expect(me.body.language).toBe('nl');
  });

  it('rejects invalid language with 400', async () => {
    const { agent } = await login();
    const res = await agent
      .put('/api/coach/profile')
      .send({ language: 'de' });
    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .put('/api/coach/profile')
      .send({ language: 'nl' });
    expect(res.status).toBe(401);
  });
});
