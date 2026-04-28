-- Multi-language support: store coach UI preference and questionnaire submission language
-- coach.language is nullable so the first /api/coach/me read can derive it from Accept-Language and persist
ALTER TABLE coach
  ADD COLUMN IF NOT EXISTS language VARCHAR(2)
  CHECK (language IS NULL OR language IN ('fr', 'nl'));

-- coachee.language captures which questionnaire URL was used (/hello = fr, /welkom = nl)
ALTER TABLE coachee
  ADD COLUMN IF NOT EXISTS language VARCHAR(2) NOT NULL DEFAULT 'fr'
  CHECK (language IN ('fr', 'nl'));
