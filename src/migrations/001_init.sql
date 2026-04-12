-- Brenso schema

CREATE TABLE IF NOT EXISTS coach (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coachee (
  id SERIAL PRIMARY KEY,
  coach_id INT NOT NULL REFERENCES coach(id),
  prenom VARCHAR(255) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  date_naissance DATE NOT NULL,
  ecole_nom VARCHAR(255),
  annee_scolaire VARCHAR(255),
  orientation_actuelle VARCHAR(255),
  loisirs TEXT,
  choix TEXT,
  code_postal VARCHAR(20),
  date_seance DATE,
  ennea_base SMALLINT CHECK (ennea_base BETWEEN 1 AND 9),
  ennea_sous_type VARCHAR(50),
  mbti VARCHAR(4),
  riasec VARCHAR(20),
  words_ennea INT NOT NULL DEFAULT 250,
  words_mbti INT NOT NULL DEFAULT 250,
  words_riasec INT NOT NULL DEFAULT 200,
  notes_coach TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coachee_report (
  id SERIAL PRIMARY KEY,
  coachee_id INT NOT NULL REFERENCES coachee(id),
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  report_data BYTEA,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Session table for connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
