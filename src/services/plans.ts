import { pool } from '../db';

export interface PlanFeatures {
  word_download: boolean;
  pptx: boolean;
  audio: boolean;
  sections: string[];
  [key: string]: unknown;
}

export interface CoachPlan {
  plan_name: string | null;
  plan_display_name: string | null;
  features: PlanFeatures | null;
}

export async function getCoachPlan(coachId: number): Promise<CoachPlan> {
  const result = await pool.query(
    `SELECT p.name AS plan_name, p.display_name AS plan_display_name, p.features
     FROM coach c
     LEFT JOIN plan p ON p.id = c.plan_id
     WHERE c.id = $1`,
    [coachId]
  );

  if (result.rows.length === 0) {
    return { plan_name: null, plan_display_name: null, features: null };
  }

  return result.rows[0];
}

/** Returns true if the coach's plan has the given feature flag enabled. Bypasses if no plan assigned. */
export async function hasFeature(coachId: number, feature: keyof PlanFeatures): Promise<boolean> {
  const { features } = await getCoachPlan(coachId);
  if (features === null) return true; // no plan = bypass
  return Boolean(features[feature]);
}
