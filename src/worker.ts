import cron from 'node-cron';
import { pool } from './db';
import { processReport } from './services/report';

let isProcessing = false;

export async function processQueue(
  processor: (id: number) => Promise<void> = processReport
): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const result = await pool.query(`
      UPDATE coachee_report
      SET status = 'processing'
      WHERE id = (
        SELECT id FROM coachee_report WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1
      )
      RETURNING id
    `);

    if (result.rows.length === 0) {
      return;
    }

    const reportId = result.rows[0].id;
    console.log(`Processing report ${reportId}...`);

    try {
      await processor(reportId);
      console.log(`Report ${reportId} completed.`);
    } catch (err) {
      console.error(`Report ${reportId} failed:`, err);
      const message = err instanceof Error ? err.message : String(err);
      await pool.query(
        'UPDATE coachee_report SET status = $1, error_message = $2 WHERE id = $3',
        ['error', message, reportId]
      );
    }
  } finally {
    isProcessing = false;
  }
}

export async function startWorker(): Promise<void> {
  await pool.query("UPDATE coachee_report SET status = 'queued' WHERE status = 'processing'");
  cron.schedule('*/30 * * * * *', () => processQueue());
  console.log('Report worker started (every 30s).');
}
