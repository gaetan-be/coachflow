# Project Brief Brenso
A platform for a coach to gather initial information from young coachees and generate orientation reports.
The coach helps younger people select the right school according to their profile, using 3 methodologies: MBTI, RIASEC, and Enneagram.

The website and backoffice are in French exclusively.

Reference UI files (for visual/UX reference only — implementation lives in `client/`):
- `references/brenso-coach-pipeline-v2.html` — backoffice coachee detail page
- `references/brenso-questionnaire-jeune.html` — public coachee questionnaire
- `references/genius-*.html` — shared light-theme design system reference

# Workflow
- The coach sends a fixed link (`/hello`) to the coachee.
- The coachee fills in the questionnaire and submits.
- The coach sees submitted forms in the backoffice list (`/backoffice`).
- The coach opens a coachee's record, sets personality profile data (Enneagram, MBTI, RIASEC, valeurs, compétences, besoins, métiers), adds notes, and clicks "Créer le rapport".
- Clicking the button consumes a credit (if the coach's plan requires it) and queues a report generation job (status = `queued`).
- A background cron job processes the queue and delivers the DOCX report by email to the coach.

# Style and colors
Respect the colors, style, fonts, and UI mindset from the reference files scrupulously. The design system is documented in `docs/REDESIGN.md`. Design tokens live as Tailwind v4 `@theme` variables in `client/src/index.css`.

# Project structure

```
src/                  — Express backend (TypeScript)
  index.ts            — App init, sessions, mounts routes, serves public/dist (React build) + SPA catch-all
  config.ts           — Environment config (DB, SMTP, Anthropic API key, coach credentials)
  db.ts               — PostgreSQL pool, migration runner, coach seeder
  worker.ts           — node-cron job (every 30s), picks queued report, calls processReport()
  routes/
    public.ts         — POST /api/questionnaire (rate-limited 5/hr)
    auth.ts           — POST /api/login, POST /api/logout
    backoffice.ts     — Authenticated API: coachees, coachee detail/update, queue report,
                        coach/me, coach/reports, coach/credits, password, report download
  services/
    report.ts         — renderDocxWithClaude(), processReport()
    reportUtils.ts    — mapCoacheeToJson()
    credits.ts        — Credit ledger: getCoachCredits(), consumeCredit()
    plans.ts          — Plan lookup + feature flags: getCoachPlan()
    email.ts          — Nodemailer: sends DOCX to coach (supports BCC via env var)
  middleware/
    auth.ts           — requireAuth(): returns 401 JSON when unauthenticated (SPA handles redirect)
    rateLimit.ts      — 5 submissions/hour per IP for questionnaire
  migrations/
    001_init.sql      — Initial schema (coach, coachee, coachee_report, session tables)
    002_v2_pipeline.sql — Extends coachee: ennea_base→VARCHAR, valeurs/compétences/besoins,
                          metiers JSONB, extra word count targets
    003_credits_and_plans.sql — plan + credit_allocation tables, coach.plan_id,
                                coachee_report.credit_allocation_id, seeds plans
  scripts/
    generate-report.ts — CLI debug: npx ts-node src/scripts/generate-report.ts <coachee_id>

client/               — React SPA (served by Express from public/dist in prod)
  index.html          — Shell (lang=fr, Google Fonts)
  vite.config.ts      — Vite 8 (proxies /api and /img to :3000, builds to ../public/dist)
  public/             — Static assets served by Vite in dev (favicon, icons, preamble)
  src/
    main.tsx, App.tsx — BrowserRouter + AuthContext + routes
    index.css         — Tailwind v4 @theme tokens, global styles
    hooks/useAuth.ts  — AuthContext, useAuthState(), CoachMe
    lib/utils.ts      — cn(), formatDate()
    components/
      ui/             — Shadcn primitives: button, badge, input, textarea
      layout/         — BackofficeHeader, RequireAuth (redirects to /coach on 401)
      pipeline/       — PipelineSection, WordDial, TagInput, MetierBlocks, types
    pages/
      HomePage.tsx, TermsPage.tsx, QuestionnairePage.tsx, LoginPage.tsx
      backoffice/     — ListPage, PipelinePage, ProfilePage

public/dist/          — Vite build output (served by Express in prod)

tests/
  unit/               — Vitest: mapCoacheeToJson, rateLimit, requireAuth
  integration/        — Vitest + Supertest against real PG (auth, coachee, questionnaire,
                        report-queue, worker)
  e2e/                — Playwright: login, pipeline, questionnaire
  setup/              — app.ts, db.ts test harness

scripts/
  render_report.py    — Python docxtpl renderer (reads JSON from stdin, writes DOCX)
  requirements.txt    — docxtpl

claude-tpl-maker/
  make-docx.sh        — Entrypoint bash script called by renderDocxWithClaude()
  .claude/skills/brenso-word/ — Claude AI skill that generates all report chapters
    SKILL.md          — Skill spec (architecture, word count rules, design system)
    scripts/brenso-rapport.js — Orchestration: calls Claude API per chapter
    references/       — Source docs: enneagramme.md, mbti.md, riasec.md

docs/
  REDESIGN.md           — Design system (light theme, palette, fonts)
  REACT_MIGRATION.md    — Frontend migration notes (HTML/JS → React SPA)
  CREDITS_AND_PLANS.md  — Credit ledger + plan tiers + feature flags
  TESTING.md            — Test layers, harness, conventions
```

# Tech stack
- **Docker**: `docker-compose.yml` (dev, exposes 3000 and 5173), `docker-compose.prod.yml` (prod with Traefik/HTTPS for brenso.oriado.com), `docker-compose.test.yml` (PG 16 on 5433 with tmpfs for tests)
- **Database**: PostgreSQL 16
- **Frontend**: React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4 + Shadcn/UI (Radix) + React Router 7 + TanStack Query
- **Backend**: Node.js + Express 4 + TypeScript
- **Report generation**: Claude AI (via `brenso-word` skill) + Python docxtpl for final DOCX rendering
- **Email**: Nodemailer (SMTP)
- **Sessions**: connect-pg-simple (PostgreSQL-backed); `requireAuth` returns 401 JSON, React client handles redirect
- **Testing**: Vitest + Supertest (unit/integration), Playwright (E2E)

# Dev and build
- `npm run dev` — concurrently runs `tsc -w`, `nodemon dist/index.js`, and Vite dev server on port 5173 (HMR, proxies `/api` and `/img` to Express on :3000)
- `npm run build` — `tsc` (backend → `dist/`) + `vite build` (client → `public/dist/`)
- `npm start` — production `node dist/index.js`
- `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run test:e2e`
- `npm run test:db:start` / `test:db:stop` — test PG container

Express serves the SPA from `public/dist/` with a catch-all `GET *` for client-side routing. API lives under `/api/*`.

# Report generation architecture

1. Coach clicks "Créer le rapport" → `POST /api/coachee/:id/report`:
   - Rejects if a report is already queued/processing.
   - If the coach has a plan, `consumeCredit()` reserves a credit; coaches without a plan bypass credit checks entirely.
   - Inserts a `coachee_report` row (`status='queued'`, `credit_allocation_id` set when credit consumed).
2. `src/worker.ts` polls every 30s, picks the oldest queued row, sets `status='processing'`.
3. `src/services/report.ts` → `processReport()`:
   - Fetches coachee data from DB, maps it via `mapCoacheeToJson()` (`reportUtils.ts`).
   - Calls `renderDocxWithClaude()`: spawns `claude-tpl-maker/make-docx.sh` with the JSON written to a temp file.
   - The bash script invokes the `brenso-word` Claude skill (`brenso-rapport.js`), which makes Claude API calls per chapter (Enneagram, MBTI, RIASEC, valeurs/compétences, métiers, plan d'action) with word count constraints (±5%).
   - Returns a DOCX Buffer.
4. DOCX is stored as BYTEA in `coachee_report.report_data` (`status='done'`).
5. Email sent to coach with DOCX attachment.

CLI debug: `npx ts-node src/scripts/generate-report.ts <coachee_id>`

# Data model

**`coach`**: id, name, email (unique), password_hash, plan_id (FK → plan), created_at

**`coachee`** (linked to coach):
- Identity: prenom, nom, date_naissance, code_postal
- Session: ecole_nom, annee_scolaire, orientation_actuelle, loisirs, choix, date_seance
- Assessments: ennea_base (VARCHAR, ranked multi-select), ennea_sous_type, mbti, riasec, valeurs, competences, besoins
- Structured data: metiers (JSONB), plan_action
- Coach notes: notes_coach
- Word count targets: words_ennea (250), words_mbti (250), words_riasec (200), words_comp_besoins (250), words_metiers (250), words_plan_action (200)

**`coachee_report`**: id, coachee_id (FK), status ('queued'|'processing'|'done'|'error'), report_data (BYTEA), error_message, credit_allocation_id (FK → credit_allocation), created_at, completed_at

**`plan`**: id, name, display_name, features (JSONB feature flags), price_monthly_cents, credits_per_month, credit_validity_days

**`credit_allocation`**: id, coach_id (FK), amount, used, valid_from, valid_until, source ('subscription'|'promo'|'manual'|'purchase'), note, created_at

**`session`**: connect-pg-simple session store

# Additional documentation
See `docs/` for REDESIGN, REACT_MIGRATION, CREDITS_AND_PLANS, and TESTING.
