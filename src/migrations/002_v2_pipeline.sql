-- V2 Pipeline: multi-select enneagramme + new sections

-- Change ennea_base from SMALLINT to VARCHAR(20) for ranked multi-select
ALTER TABLE coachee DROP CONSTRAINT IF EXISTS coachee_ennea_base_check;
ALTER TABLE coachee ALTER COLUMN ennea_base TYPE VARCHAR(20) USING ennea_base::VARCHAR;

-- New columns for sections 05-08
ALTER TABLE coachee ADD COLUMN IF NOT EXISTS valeurs TEXT;
ALTER TABLE coachee ADD COLUMN IF NOT EXISTS competences TEXT;
ALTER TABLE coachee ADD COLUMN IF NOT EXISTS besoins TEXT;
ALTER TABLE coachee ADD COLUMN IF NOT EXISTS words_comp_besoins INT NOT NULL DEFAULT 250;
ALTER TABLE coachee ADD COLUMN IF NOT EXISTS metiers JSONB;
ALTER TABLE coachee ADD COLUMN IF NOT EXISTS words_metiers INT NOT NULL DEFAULT 250;
ALTER TABLE coachee ADD COLUMN IF NOT EXISTS plan_action TEXT;
ALTER TABLE coachee ADD COLUMN IF NOT EXISTS words_plan_action INT NOT NULL DEFAULT 200;
