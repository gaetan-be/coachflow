-- Magazine-style HTML report generated alongside the DOCX, stored as BYTEA.
-- Existing reports keep html_data IS NULL; the UI hides the HTML button for them.

ALTER TABLE coachee_report ADD COLUMN IF NOT EXISTS html_data BYTEA;
