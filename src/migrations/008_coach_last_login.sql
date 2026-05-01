-- Track when each coach last successfully authenticated (POST /api/login).
-- Nullable: existing coaches read NULL until their next login.

ALTER TABLE coach
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
