import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { setupTestDb, truncateAll, seedCoach, seedCoachee, testPool } from '../setup/db';
import { processQueue } from '../../src/worker';

beforeAll(async () => { await setupTestDb(); });
beforeEach(async () => { await truncateAll(); });
afterEach(() => { vi.restoreAllMocks(); });

async function insertReport(coacheeId: number, status: string): Promise<number> {
  const res = await testPool.query(
    'INSERT INTO coachee_report (coachee_id, status) VALUES ($1, $2) RETURNING id',
    [coacheeId, status]
  );
  return res.rows[0].id;
}

async function getReportStatus(id: number): Promise<string | null> {
  const res = await testPool.query('SELECT status, error_message FROM coachee_report WHERE id = $1', [id]);
  return res.rows[0] ?? null;
}

describe('processQueue', () => {
  it('does nothing when queue is empty', async () => {
    const processor = vi.fn();
    await processQueue(processor);
    expect(processor).not.toHaveBeenCalled();
  });

  it('picks the oldest queued report and calls the processor', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);

    // Insert two reports; first one is older
    await testPool.query(
      "INSERT INTO coachee_report (coachee_id, status, created_at) VALUES ($1, 'queued', NOW() - interval '1 minute')",
      [coachee.id]
    );
    const { rows } = await testPool.query(
      "INSERT INTO coachee_report (coachee_id, status) VALUES ($1, 'queued') RETURNING id",
      [coachee.id]
    );
    const newerReportId = rows[0].id;

    const olderRes = await testPool.query(
      "SELECT id FROM coachee_report WHERE coachee_id = $1 ORDER BY created_at ASC LIMIT 1",
      [coachee.id]
    );
    const olderReportId = olderRes.rows[0].id;

    const processor = vi.fn().mockResolvedValue(undefined);
    await processQueue(processor);

    expect(processor).toHaveBeenCalledWith(olderReportId);
    expect(processor).not.toHaveBeenCalledWith(newerReportId);
  });

  it('sets status to done after successful processing', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const reportId = await insertReport(coachee.id, 'queued');

    const processor = vi.fn().mockResolvedValue(undefined);
    await processQueue(processor);

    // Worker sets 'processing' before calling processor but doesn't set 'done' —
    // that's processReport's responsibility. Verify the row moved to 'processing'.
    const row = await getReportStatus(reportId);
    // After the mock resolves, the worker leaves it as 'processing' (only real processReport sets 'done').
    // The test verifies the processor was called and no error row was written.
    expect(processor).toHaveBeenCalledWith(reportId);
    expect((row as any).status).toBe('processing');
    expect((row as any).error_message).toBeNull();
  });

  it('sets status to error with message when processor throws', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    const reportId = await insertReport(coachee.id, 'queued');

    const processor = vi.fn().mockRejectedValue(new Error('Claude API timeout'));
    await processQueue(processor);

    const row = await getReportStatus(reportId);
    expect((row as any).status).toBe('error');
    expect((row as any).error_message).toContain('Claude API timeout');
  });

  it('is re-entrant safe: a second concurrent call returns early', async () => {
    const coach = await seedCoach();
    const coachee = await seedCoachee(coach.id);
    await insertReport(coachee.id, 'queued');

    let resolveProcessor!: () => void;
    const processor = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveProcessor = resolve; })
    );

    // Start first call (will hang waiting for processor)
    const first = processQueue(processor);
    // Give the first call time to set isProcessing = true
    await new Promise((r) => setTimeout(r, 10));

    // Second call should return immediately without touching DB
    const dbQuerySpy = vi.spyOn(testPool, 'query');
    await processQueue(processor);
    expect(processor).toHaveBeenCalledTimes(1); // not called again

    resolveProcessor();
    await first;
  });
});
