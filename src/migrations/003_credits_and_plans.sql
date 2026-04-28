-- Plans: define tiers and feature flags
CREATE TABLE IF NOT EXISTS plan (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',
  price_monthly_cents INT,
  credits_per_month INT,
  credit_validity_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit ledger: each row is an allocation with its own validity window
CREATE TABLE IF NOT EXISTS credit_allocation (
  id SERIAL PRIMARY KEY,
  coach_id INT NOT NULL REFERENCES coach(id),
  amount INT NOT NULL CHECK (amount > 0),
  used INT NOT NULL DEFAULT 0 CHECK (used >= 0 AND used <= amount),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  source VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coach ADD COLUMN IF NOT EXISTS plan_id INT REFERENCES plan(id);
ALTER TABLE coachee_report ADD COLUMN IF NOT EXISTS credit_allocation_id INT REFERENCES credit_allocation(id);

-- Seed plans (idempotent)
INSERT INTO plan (name, display_name, features, price_monthly_cents, credits_per_month, credit_validity_days)
VALUES
  ('a_la_piece', 'À la pièce', '{"word_download":true,"pptx":false,"audio":false,"sections":["ennea","mbti","riasec","valeurs","metiers","plan_action"]}', null, null, null),
  ('starter',    'Starter',    '{"word_download":true,"pptx":false,"audio":false,"sections":["ennea","mbti","riasec","valeurs","metiers","plan_action"]}', 6900,  3,  30),
  ('plus',       'Plus',       '{"word_download":true,"pptx":true, "audio":false,"sections":["ennea","mbti","riasec","valeurs","metiers","plan_action"]}', 12900, 7,  30),
  ('super',      'Super',      '{"word_download":true,"pptx":true, "audio":true, "sections":["ennea","mbti","riasec","valeurs","metiers","plan_action"]}', 21900, 15, 30)
ON CONFLICT (name) DO NOTHING;
