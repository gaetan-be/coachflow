# Project Brief Brenso
A platform for a coach (Bénédicte Vanden Bossche) to gather initial information from young coachees and generate orientation reports.
The coach helps younger people select the right school according to their profile, using 3 methodologies: MBTI, RIASEC, and Enneagram.

The website and backoffice are in French exclusively.

Reference UI files (for visual/UX reference only — implementation is in `public/`):
- `references/brenso-coach-pipeline.html` — backoffice coachee detail page (ignore auto-import and document library sections)
- `references/brenso-questionnaire-jeune.html` — public coachee questionnaire

# Workflow
- The coach sends a fixed link (`/hello`) to the coachee.
- The coachee fills in the questionnaire and submits.
- The coach sees submitted forms in the backoffice list (`/backoffice`).
- The coach opens a coachee's record, sets personality profile data (Enneagram, MBTI, RIASEC, valeurs, compétences, besoins, métiers), adds notes, and clicks "Créer le rapport".
- Clicking the button queues a report generation job (status = `queued`).
- A background cron job processes the queue and delivers the DOCX report by email to the coach.

# Style and colors
Respect the colors, style, fonts, and UI mindset from the reference files scrupulously. The design system is documented in `docs/REDESIGN.md`. CSS custom properties are defined in `public/css/base.css`.

# Project structure

```
src/
  index.ts          — Express app init, session, route mounting, migrations, worker start
  config.ts         — Environment config (DB, SMTP, Anthropic API key, coach credentials)
  db.ts             — PostgreSQL pool, migration runner, coach seeder
  worker.ts         — node-cron job (every 30s), picks queued report, calls processReport()
  routes/
    public.ts       — GET /, /terms, /hello; POST /api/questionnaire (rate-limited 5/hr)
    auth.ts         — GET /coach (login), POST /api/login, POST /api/logout
    backoffice.ts   — Authenticated routes: list, coachee detail, update, queue report, download
  services/
    report.ts       — mapCoacheeToJson(), renderDocxWithClaude(), processReport()
    email.ts        — Nodemailer: sends DOCX to coach (supports BCC via env var)
  middleware/
    auth.ts         — requireAuth(): checks session.coachId, redirects to /coach
    rateLimit.ts    — 5 submissions/hour per IP for questionnaire
  migrations/
    001_init.sql    — Initial schema (coach, coachee, coachee_report, session tables)
    002_v2_pipeline.sql — Extends coachee: ennea_base→VARCHAR, valeurs/compétences/besoins, metiers JSONB, extra word count targets
  scripts/
    generate-report.ts — CLI debug: npx ts-node src/scripts/generate-report.ts <coachee_id>

public/
  css/
    base.css        — CSS custom properties (colors, fonts)
    login.css       — Login page styles
    questionnaire.css — Public questionnaire styles
    backoffice.css  — Backoffice styles (list + pipeline)
  views/            — HTML pages (home, login, questionnaire, list, pipeline, terms)
  js/               — questionnaire.js, pipeline.js

scripts/
  render_report.py  — Python docxtpl renderer (reads JSON from stdin, writes DOCX)
  requirements.txt  — docxtpl

claude-tpl-maker/
  make-docx.sh      — Entrypoint bash script called by renderDocxWithClaude()
  .claude/skills/brenso-word/ — Claude AI skill that generates all report chapters
    SKILL.md        — Skill spec (architecture, word count rules, design system)
    scripts/brenso-rapport.js — Orchestration: calls Claude API per chapter
    references/     — Source docs: enneagramme.md, mbti.md, riasec.md

docs/
  REDESIGN.md       — Design system migration notes (light theme, color palette, fonts)
```

# Tech stack
- **Docker**: `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod with Traefik/HTTPS for brenso.oriado.com)
- **Database**: PostgreSQL 16
- **Frontend**: HTML + CSS + Vanilla JavaScript (no framework)
- **Backend**: Node.js + Express + TypeScript
- **Report generation**: Claude AI (via `brenso-word` skill) + Python docxtpl for final DOCX rendering
- **Email**: Nodemailer (SMTP)
- **Sessions**: connect-pg-simple (PostgreSQL-backed)

# Report generation architecture

1. Coach clicks "Créer le rapport" → `POST /api/coachee/:id/report` inserts `coachee_report` row with `status='queued'`.
2. **`src/worker.ts`** polls every 30s, picks the oldest queued row, sets `status='processing'`.
3. **`src/services/report.ts`** → `processReport()`:
   - Fetches coachee data from DB
   - Calls `renderDocxWithClaude()`: spawns `claude-tpl-maker/make-docx.sh` with coachee JSON via stdin
   - The bash script invokes the `brenso-word` Claude skill (`brenso-rapport.js`), which makes Claude API calls per chapter (Enneagram, MBTI, RIASEC, valeurs/compétences, métiers, plan d'action) with word count constraints (±5%)
   - Returns a DOCX Buffer
4. DOCX is stored as BYTEA in `coachee_report.report_data` (`status='done'`).
5. Email sent to coach with DOCX attachment.

CLI debug: `npx ts-node src/scripts/generate-report.ts <coachee_id>`

# Data model

**`coach`**: id, name, email (unique), password_hash, created_at

**`coachee`** (linked to coach):
- Identity: prenom, nom, date_naissance, code_postal
- Session: ecole_nom, annee_scolaire, orientation_actuelle, loisirs, choix, date_seance
- Assessments: ennea_base (VARCHAR, ranked multi-select), ennea_sous_type, mbti, riasec, valeurs, competences, besoins
- Structured data: metiers (JSONB)
- Coach notes: notes_coach
- Word count targets: words_ennea (250), words_mbti (250), words_riasec (200), words_comp_besoins (250), words_metiers (250), words_plan_action (200)

**`coachee_report`**: id, coachee_id (FK), status ('queued'|'processing'|'done'|'error'), report_data (BYTEA), error_message, created_at, completed_at

**`session`**: connect-pg-simple session store

# Additional documentation
Can be found in the docs/ directory.