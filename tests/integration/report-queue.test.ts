import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../setup/app';
import { setupTestDb, truncateAll, seedCoach, seedCoachee, testPool } from '../setup/db';

const app = buildTestApp();

beforeAll(async () => { await setupTestDb(); });
beforeEach(async () => { await truncateAll(); });

async function loginAgent(coach: { email: string; password: string }) {
  const agent = request.agent(app);
  await agent.post('/api/login').send({ email: coach.email, password: coach.password });
  return agent;
}

describe('POST /api/coachee/:id/report', () => {
  it('queues a report and returns ok', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const agent = await loginAgent(coach);

    const res = await agent.post(`/api/coachee/${coachee.id}/report`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const row = await testPool.query('SELECT status FROM coachee_report WHERE coachee_id = $1', [coachee.id]);
    expect(row.rows.length).toBe(1);
    expect(row.rows[0].status).toBe('queued');
  });

  it('returns 409 when a report is already queued', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const agent = await loginAgent(coach);

    await agent.post(`/api/coachee/${coachee.id}/report`);
    const res = await agent.post(`/api/coachee/${coachee.id}/report`);
    expect(res.status).toBe(409);
  });

  it('returns 409 when a report is processing', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    await testPool.query(
      "INSERT INTO coachee_report (coachee_id, status) VALUES ($1, 'processing')",
      [coachee.id]
    );
    const agent = await loginAgent(coach);

    const res = await agent.post(`/api/coachee/${coachee.id}/report`);
    expect(res.status).toBe(409);
  });

  it('returns 404 for coachee belonging to another coach', async () => {
    const coach1 = await seedCoach({ email: 'coach1@test.be' });
    const coach2 = await seedCoach({ email: 'coach2@test.be' });
    const coachee = await seedCoachee(coach2.id);
    const agent = await loginAgent(coach1);

    const res = await agent.post(`/api/coachee/${coachee.id}/report`);
    expect(res.status).toBe(404);
  });

  it('allows queuing again after a previous report is done', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    await testPool.query(
      "INSERT INTO coachee_report (coachee_id, status, completed_at) VALUES ($1, 'done', NOW())",
      [coachee.id]
    );
    const agent = await loginAgent(coach);

    const res = await agent.post(`/api/coachee/${coachee.id}/report`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/coachee/:id/report/download', () => {
  it('returns the DOCX binary when status is done', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const fakeDocx = Buffer.from('PK fake docx content');
    await testPool.query(
      "INSERT INTO coachee_report (coachee_id, status, report_data, completed_at) VALUES ($1, 'done', $2, NOW())",
      [coachee.id, fakeDocx]
    );
    const agent = await loginAgent(coach);

    const res = await agent.get(`/api/coachee/${coachee.id}/report/download`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('wordprocessingml.document');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('Alice_Dupont.docx');
    expect(Buffer.from(res.body)).toEqual(fakeDocx);
  });

  it('returns 404 when no done report exists', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const agent = await loginAgent(coach);

    const res = await agent.get(`/api/coachee/${coachee.id}/report/download`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for queued report', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    await testPool.query(
      "INSERT INTO coachee_report (coachee_id, status) VALUES ($1, 'queued')",
      [coachee.id]
    );
    const agent = await loginAgent(coach);

    const res = await agent.get(`/api/coachee/${coachee.id}/report/download`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for another coach\'s coachee', async () => {
    const coach1 = await seedCoach({ email: 'coach1@test.be' });
    const coach2 = await seedCoach({ email: 'coach2@test.be' });
    const coachee = await seedCoachee(coach2.id);
    const fakeDocx = Buffer.from('PK fake');
    await testPool.query(
      "INSERT INTO coachee_report (coachee_id, status, report_data, completed_at) VALUES ($1, 'done', $2, NOW())",
      [coachee.id, fakeDocx]
    );
    const agent = await loginAgent(coach1);

    const res = await agent.get(`/api/coachee/${coachee.id}/report/download`);
    expect(res.status).toBe(404);
  });
});
