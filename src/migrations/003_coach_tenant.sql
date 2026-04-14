-- Multi-coach support: each coach serves on its own domain with custom branding

ALTER TABLE coach
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#3fa8b8',
  ADD COLUMN IF NOT EXISTS logo_letter TEXT NOT NULL DEFAULT 'B',
  ADD COLUMN IF NOT EXISTS brand_name TEXT NOT NULL DEFAULT 'BRENSO';

-- Backfill the seeded coach with the original production domain so the existing
-- deployment keeps working after this migration runs.
UPDATE coach SET domain = 'brenso.oriado.com' WHERE domain IS NULL;

ALTER TABLE coach ALTER COLUMN domain SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_domain_key'
  ) THEN
    ALTER TABLE coach ADD CONSTRAINT coach_domain_key UNIQUE (domain);
  END IF;
END $$;
