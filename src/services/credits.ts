import { pool } from '../db';

export interface CreditAllocation {
  id: number;
  amount: number;
  used: number;
  balance: number;
  valid_from: string;
  valid_until: string | null;
  source: string;
  note: string | null;
}

export interface CoachCredits {
  balance: number;
  allocations: CreditAllocation[];
}

export async function getCoachCredits(coachId: number): Promise<CoachCredits> {
  const result = await pool.query<CreditAllocation & { amount: number; used: number }>(
    `SELECT id, amount, used,
            (amount - used) AS balance,
            valid_from, valid_until, source, note
     FROM credit_allocation
     WHERE coach_id = $1
       AND valid_from <= NOW()
       AND (valid_until IS NULL OR valid_until > NOW())
     ORDER BY valid_from ASC`,
    [coachId]
  );

  const allocations = result.rows;
  const balance = allocations.reduce((sum, a) => sum + a.balance, 0);
  return { balance, allocations };
}

/** Atomically consume one credit (FIFO). Returns the allocation id used, or null if no credits. */
export async function consumeCredit(coachId: number): Promise<number | null> {
  const result = await pool.query<{ id: number }>(
    `UPDATE credit_allocation
     SET used = used + 1
     WHERE id = (
       SELECT id FROM credit_allocation
       WHERE coach_id = $1
         AND used < amount
         AND valid_from <= NOW()
         AND (valid_until IS NULL OR valid_until > NOW())
       ORDER BY valid_from ASC
       LIMIT 1
     )
     RETURNING id`,
    [coachId]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function addAllocation(
  coachId: number,
  amount: number,
  validUntil: Date | null,
  source: string,
  note?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO credit_allocation (coach_id, amount, valid_until, source, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [coachId, amount, validUntil, source, note ?? null]
  );
}
