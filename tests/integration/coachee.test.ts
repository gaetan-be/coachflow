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

describe('GET /api/coachees', () => {
  it('returns list of coachees for authenticated coach', async () => {
    const coach = await seedCoach();
    await seedCoachee(coach.id);
    const agent = await loginAgent(coach);

    const res = await agent.get('/api/coachees');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].prenom).toBe('Alice');
    expect(res.body[0].report_status).toBeNull();
  });

  it('does not return coachees belonging to another coach', async () => {
    const coach1 = await seedCoach({ email: 'coach1@test.be' });
    const coach2 = await seedCoach({ email: 'coach2@test.be' });
    await seedCoachee(coach2.id);
    const agent = await loginAgent(coach1);

    const res = await agent.get('/api/coachees');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('GET /api/coachee/:id', () => {
  it('returns full coachee data for owner', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const agent = await loginAgent(coach);

    const res = await agent.get(`/api/coachee/${coachee.id}`);
    expect(res.status).toBe(200);
    expect(res.body.prenom).toBe('Alice');
    expect(res.body.nom).toBe('Dupont');
    expect(res.body.report_status).toBeNull();
  });

  it('returns 404 for coachee belonging to another coach', async () => {
    const coach1 = await seedCoach({ email: 'coach1@test.be' });
    const coach2 = await seedCoach({ email: 'coach2@test.be' });
    const coachee = await seedCoachee(coach2.id);
    const agent = await loginAgent(coach1);

    const res = await agent.get(`/api/coachee/${coachee.id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent coachee', async () => {
    const coach = await seedCoach();
    const agent = await loginAgent(coach);

    const res = await agent.get('/api/coachee/99999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/coachee/:id', () => {
  const updatePayload = {
    prenom: 'Alicia',
    nom: 'Martin',
    date_naissance: '2005-06-15',
    ecole_nom: 'IHECS',
    code_postal: '1000',
    date_seance: '2025-04-01',
    choix: 'Communication',
    loisirs: 'Musique',
    ennea_base: '3,6',
    ennea_sous_type: 'SP',
    mbti: 'ENFP',
    riasec: 'ASE',
    words_ennea: 300,
    words_mbti: 280,
    words_riasec: 220,
    notes_coach: 'Bonne séance',
    valeurs: 'liberté,créativité',
    competences: 'communication',
    besoins: 'reconnaissance',
    words_comp_besoins: 260,
    metiers: [{ nom: 'Journaliste' }],
    words_metiers: 270,
    plan_action: 'Visiter 2 écoles',
    words_plan_action: 210,
  };

  it('updates coachee data and returns ok', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const agent = await loginAgent(coach);

    const res = await agent.put(`/api/coachee/${coachee.id}`).send(updatePayload);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('persists updated fields in the database', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const agent = await loginAgent(coach);

    await agent.put(`/api/coachee/${coachee.id}`).send(updatePayload);

    const row = await testPool.query('SELECT * FROM coachee WHERE id = $1', [coachee.id]);
    expect(row.rows[0].prenom).toBe('Alicia');
    expect(row.rows[0].mbti).toBe('ENFP');
    expect(row.rows[0].notes_coach).toBe('Bonne séance');
  });

  it('persists metiers as JSONB and round-trips correctly', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const agent = await loginAgent(coach);

    await agent.put(`/api/coachee/${coachee.id}`).send(updatePayload);

    const getRes = await agent.get(`/api/coachee/${coachee.id}`);
    expect(getRes.body.metiers).toEqual([{ nom: 'Journaliste' }]);
  });

  it('does not update coachee belonging to another coach', async () => {
    const coach1 = await seedCoach({ email: 'coach1@test.be' });
    const coach2 = await seedCoach({ email: 'coach2@test.be' });
    const coachee = await seedCoachee(coach2.id);
    const agent = await loginAgent(coach1);

    await agent.put(`/api/coachee/${coachee.id}`).send(updatePayload);

    const row = await testPool.query('SELECT prenom FROM coachee WHERE id = $1', [coachee.id]);
    expect(row.rows[0].prenom).toBe('Alice'); // unchanged
  });
});
