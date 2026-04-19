import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../setup/app';
import { setupTestDb, truncateAll, seedCoach, testPool } from '../setup/db';

const app = buildTestApp();

beforeAll(async () => { await setupTestDb(); });
beforeEach(async () => { await truncateAll(); });

const validBody = {
  prenom: 'Alice',
  nom: 'Dupont',
  date_naissance: '2005-06-15',
  ecole_nom: 'Lycée Test',
  annee_scolaire: 'Terminale',
  loisirs: 'Tennis',
  choix: 'Sciences',
};

describe('POST /api/questionnaire', () => {
  it('returns 200 with coachee id on valid submission', async () => {
    await seedCoach();
    const res = await request(app)
      .post('/api/questionnaire')
      .set('X-Forwarded-For', '10.0.0.1')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.id).toBeTypeOf('number');
  });

  it('inserts a coachee row in the database', async () => {
    await seedCoach();
    const res = await request(app)
      .post('/api/questionnaire')
      .set('X-Forwarded-For', '10.0.0.2')
      .send(validBody);

    const row = await testPool.query('SELECT * FROM coachee WHERE id = $1', [res.body.id]);
    expect(row.rows.length).toBe(1);
    expect(row.rows[0].prenom).toBe('Alice');
    expect(row.rows[0].nom).toBe('Dupont');
  });

  it('trims whitespace from prenom and nom', async () => {
    await seedCoach();
    const res = await request(app)
      .post('/api/questionnaire')
      .set('X-Forwarded-For', '10.0.0.3')
      .send({ ...validBody, prenom: '  Alice  ', nom: '  Dupont  ' });

    const row = await testPool.query('SELECT prenom, nom FROM coachee WHERE id = $1', [res.body.id]);
    expect(row.rows[0].prenom).toBe('Alice');
    expect(row.rows[0].nom).toBe('Dupont');
  });

  it('returns 400 when prenom is missing', async () => {
    await seedCoach();
    const { prenom, ...body } = validBody;
    const res = await request(app)
      .post('/api/questionnaire')
      .set('X-Forwarded-For', '10.0.0.4')
      .send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when nom is missing', async () => {
    await seedCoach();
    const { nom, ...body } = validBody;
    const res = await request(app)
      .post('/api/questionnaire')
      .set('X-Forwarded-For', '10.0.0.5')
      .send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when date_naissance is missing', async () => {
    await seedCoach();
    const { date_naissance, ...body } = validBody;
    const res = await request(app)
      .post('/api/questionnaire')
      .set('X-Forwarded-For', '10.0.0.6')
      .send(body);
    expect(res.status).toBe(400);
  });

  it('returns 500 when no coach exists', async () => {
    const res = await request(app)
      .post('/api/questionnaire')
      .set('X-Forwarded-For', '10.0.0.7')
      .send(validBody);
    expect(res.status).toBe(500);
  });

  describe('rate limiting', () => {
    it('returns 429 after 5 submissions from the same IP', async () => {
      await seedCoach();
      const ip = '10.0.1.1';

      for (let i = 0; i < 5; i++) {
        const r = await request(app)
          .post('/api/questionnaire')
          .set('X-Forwarded-For', ip)
          .send(validBody);
        expect(r.status).toBe(200);
      }

      const blocked = await request(app)
        .post('/api/questionnaire')
        .set('X-Forwarded-For', ip)
        .send(validBody);
      expect(blocked.status).toBe(429);
    });

    it('does not rate-limit a different IP', async () => {
      await seedCoach();
      const ip = '10.0.1.2';

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/questionnaire')
          .set('X-Forwarded-For', ip)
          .send(validBody);
      }

      // Different IP should still pass
      const res = await request(app)
        .post('/api/questionnaire')
        .set('X-Forwarded-For', '10.0.1.3')
        .send(validBody);
      expect(res.status).toBe(200);
    });
  });
});
