-- Adult onboarding questionnaire support: distinguish young vs adult coachees
-- and store the adult-specific public-questionnaire fields.

ALTER TABLE coachee
  ADD COLUMN IF NOT EXISTS profile_type VARCHAR(20) NOT NULL DEFAULT 'young',
  ADD COLUMN IF NOT EXISTS entreprise   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS role         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS situation    TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coachee_profile_type_check'
  ) THEN
    ALTER TABLE coachee
      ADD CONSTRAINT coachee_profile_type_check
      CHECK (profile_type IN ('young', 'adult'));
  END IF;
END $$;
