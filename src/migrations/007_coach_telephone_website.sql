-- Add coach contact fields exposed on the report cover/footer pages.
-- Both nullable: existing coaches keep working; the report skips lines that are empty.

ALTER TABLE coach
  ADD COLUMN IF NOT EXISTS telephone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;
