# Testing Guide

## Overview

Brenso uses two test layers:

- **Unit + Integration**: Vitest + Supertest against a real PostgreSQL test database
- **E2E**: Playwright against a running server

The guiding principles:
- Test behavior and HTTP contracts, not implementation details
- Use a real test database — never mock the DB pool
- Only mock what you don't own: the Claude shell script (`make-docx.sh`), SMTP, and `child_process`
- Tests serve as living documentation of the system's contracts and survive architectural refactors

---

## Quick start

```bash
# 1. Start the test database
npm run test:db:start

# 2. Run all unit + integration tests
npm test

# 3. Watch mode during development
npm run test:watch

# 4. Coverage report
npm run test:coverage

# 5. E2E tests (requires a running server on port 3001)
npm run test:e2e

# 6. Stop the test database
npm run test:db:stop
```

---

## Test database

The test database is a PostgreSQL 16 instance on port **5433** (production runs on 5432). It uses a `tmpfs` mount so data is ephemeral and resets on container restart.

```bash
docker compose -f docker-compose.test.yml up -d postgres-test
```

Connection string (set in `.env.test`):
```
DATABASE_URL=postgresql://brenso:brenso@localhost:5433/brenso_test
```

Migrations run automatically via `setupTestDb()` in the test setup. Each test file calls `truncateAll()` in `beforeEach` to start from a clean slate.

---

## Environment

`.env.test` holds all test-environment variables. It is loaded by `vitest.config.ts` via `dotenv` before any test module is imported — this ensures the PostgreSQL pool connects to the test DB rather than the dev DB.

Key values:
| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://brenso:brenso@localhost:5433/brenso_test` |
| `SESSION_SECRET` | `test-secret-not-for-production` |
| `PORT` | `3001` |
| `SMTP_HOST` | _(empty — disables email sending)_ |

---

## Project structure

```
tests/
  setup/
    db.ts          — DB helpers: setupTestDb, truncateAll, seedCoach, seedCoachee
    app.ts         — buildTestApp(): Express app without server or worker
  unit/
    mapCoacheeToJson.test.ts
    requireAuth.test.ts
    rateLimit.test.ts
  integration/
    auth.test.ts
    questionnaire.test.ts
    coachee.test.ts
    report-queue.test.ts
    worker.test.ts
  e2e/
    login.spec.ts
    questionnaire.spec.ts
    pipeline.spec.ts

vitest.config.ts
playwright.config.ts
docker-compose.test.yml
.env.test
```

---

## Setup helpers (`tests/setup/`)

### `db.ts`

| Export | Description |
|---|---|
| `testPool` | `pg.Pool` connected to test DB |
| `setupTestDb()` | Runs all migrations once (idempotent) |
| `truncateAll()` | `TRUNCATE coach, coachee, coachee_report, session CASCADE` |
| `seedCoach(overrides?)` | Inserts a coach row, returns `{ id, email, password }` |
| `seedCoachee(coachId, overrides?)` | Inserts a coachee row, returns `{ id, coachId, prenom, nom }` |

bcrypt rounds are set to **1** in seeds (fastest, not for production).

### `app.ts`

`buildTestApp()` calls `createApp()` from `src/index.ts` and returns the Express application without:
- binding a port (`app.listen`)
- starting the cron worker (`startWorker`)

---

## Unit tests

Pure tests with zero database or network dependency. Run in under 200ms total.

### `mapCoacheeToJson` — `tests/unit/mapCoacheeToJson.test.ts`

Covers the transformation between a raw DB coachee row and the JSON payload sent to the Claude skill. This is the highest-priority unit because it is the contract between the database schema and the report generator.

| Scenario |
|---|
| All scalar fields map correctly |
| Age calculated from `date_naissance` (mocked date) |
| Age is 0 when `date_naissance` is absent |
| Birthday already passed vs. not yet reached this year |
| `ennea_base` comma string splits to array |
| `valeurs`, `competences`, `besoins` split to arrays |
| All three return `[]` for null inputs |
| `metiers` passes through when already an array |
| `metiers` returns `[]` for null or non-array |
| Provided word count targets are used |
| Default word counts apply when fields are absent |

### `requireAuth` — `tests/unit/requireAuth.test.ts`

| Scenario |
|---|
| `session.coachId` set → `next()` called |
| `session.coachId` absent → `res.redirect('/coach')`, `next()` not called |

### `rateLimit` — `tests/unit/rateLimit.test.ts`

Tests the exported constants `QUESTIONNAIRE_MAX_REQUESTS` (5) and `QUESTIONNAIRE_WINDOW_MS` (3 600 000). These are config-as-documentation tests — they catch accidental changes to the rate limit during refactoring.

---

## Integration tests

Each test file:
- Calls `setupTestDb()` in `beforeAll` (runs migrations)
- Calls `truncateAll()` in `beforeEach` (clean slate per test)
- Uses Supertest against `buildTestApp()`
- Uses `request.agent(app)` to persist session cookies across requests

### `auth.test.ts`

| Test | Expected |
|---|---|
| Valid login | 200, `{ ok: true }`, `Set-Cookie` header |
| Wrong password | 401 |
| Unknown email | 401 |
| Missing email | 400 |
| Missing password | 400 |
| Logout | 200, `{ ok: true }` |
| `GET /backoffice` without session | 302 → `/coach` |
| `GET /api/coachees` without session | 302 → `/coach` |
| `GET /api/coachee/:id` without session | 302 → `/coach` |
| `GET /backoffice` after login | 200 |

### `questionnaire.test.ts`

Rate limiting uses `X-Forwarded-For` headers (Express `trust proxy: 1` is set) so each test group uses a distinct fake IP to avoid cross-test contamination.

| Test | Expected |
|---|---|
| Valid submission | 200, `{ id: number }` |
| DB row inserted with correct data | coachee row present |
| `prenom`/`nom` trimmed | no leading/trailing whitespace stored |
| Missing `prenom` | 400 |
| Missing `nom` | 400 |
| Missing `date_naissance` | 400 |
| No coach in DB | 500 |
| 6th request from same IP | 429 |
| Different IP is not blocked | 200 |

### `coachee.test.ts`

| Test | Expected |
|---|---|
| `GET /api/coachees` returns coach's coachees | 200, array |
| Cross-coach coachees not returned | empty array |
| `GET /api/coachee/:id` (owned) | 200, full data |
| `GET /api/coachee/:id` (other coach's) | 404 |
| `GET /api/coachee/99999` | 404 |
| `PUT` updates all fields | 200 `{ ok: true }`, DB updated |
| `PUT` with `metiers` array | JSONB round-trips correctly |
| `PUT` for another coach's coachee | 200 but DB unchanged (silently filtered by `coach_id`) |

### `report-queue.test.ts`

| Test | Expected |
|---|---|
| Queue new report | 200, `coachee_report` row with `status='queued'` |
| Queue while `queued` | 409 |
| Queue while `processing` | 409 |
| Queue while `done` (new report) | 200 (allowed) |
| Queue for another coach's coachee | 404 |
| Download when `done` with data | 200, DOCX content-type, correct binary body |
| Download when no report | 404 |
| Download when `queued` (no data) | 404 |
| Download for another coach's coachee | 404 |

### `worker.test.ts`

The worker's `processQueue` accepts an injectable `processor` function, so the real `processReport` (which spawns Claude) is never called in tests.

| Test | Expected |
|---|---|
| Empty queue | processor not called |
| One queued job | processor called with correct `reportId` |
| Two queued jobs | oldest is picked (FIFO by `created_at`) |
| Processor succeeds | row status is `'processing'` (worker sets this; `processReport` sets `'done'`) |
| Processor throws | row status `'error'`, `error_message` contains error text |
| Re-entrant guard | second concurrent call returns immediately, processor called only once |

> **Note on "done" status:** The worker sets `status='processing'` before calling the processor. It is `processReport`'s responsibility to set `status='done'` after writing the DOCX to the DB. The worker only sets `status='error'` on failure. In worker tests, the mocked processor never sets `'done'`, so the row stays `'processing'` after a successful mock call — this is expected and correct.

---

## E2E tests (Playwright)

E2E tests run against a real server on port 3001. They cover the three critical user journeys from a browser's perspective.

The `playwright.config.ts` automatically starts a server before tests if `E2E_SERVER_URL` is not set. The server is started with migrations already run.

> **Report generation is not tested E2E.** The Claude skill and `make-docx.sh` are intercepted via `page.route()` to avoid real API calls. Status changes are simulated directly against the API or DB.

### `login.spec.ts`

- Wrong credentials → error message visible
- Correct credentials → redirect to `/backoffice`
- Direct navigation to `/backoffice` without session → redirect to `/coach`
- Logout → session cleared, redirect to `/coach`, subsequent nav blocked

### `questionnaire.spec.ts`

- Complete 3-step form → success screen, coachee's name visible
- Attempt to advance with empty required fields → stays on step 1
- localStorage draft restore (conditional: only asserts if the app implements it)

### `pipeline.spec.ts`

- Coachee data pre-populated in form on load
- Save updated `prenom` → persists after page reload
- Click "Créer le rapport" (intercepted) → pending status indicator visible
- Done report state (injected via API mock) → download button visible

---

## What is NOT tested

| Area | Reason |
|---|---|
| `runMigrations()` | `CREATE TABLE IF NOT EXISTS` is idempotent; PostgreSQL guarantees it |
| Static HTML routes (`GET /`, `/hello`) | Playwright covers real page loads |
| `express-rate-limit` library internals | Third-party package; only config values are tested |
| `make-docx.sh` / Claude skill | Non-deterministic, costly, flaky in CI — mock `renderDocxWithClaude` everywhere |
| SMTP delivery internals | Spy that `sendMail` is called with right args; no real SMTP server needed |
| 100% line coverage | Target ~70% on `src/`; behavioral coverage is what matters |
| `pipeline.js` / `questionnaire.js` as unit tests | DOM-manipulation scripts only make sense in a browser; Playwright covers them |

---

## Prerequisite refactors (already done)

Three small changes were made to the source code to enable testability without changing any runtime behavior:

### 1. `src/services/reportUtils.ts` (new file)

`calculateAge` and `mapCoacheeToJson` were extracted from `src/services/report.ts` and exported. They were previously private, unexported functions. `report.ts` now imports them from `reportUtils.ts`.

### 2. `src/worker.ts` — injectable processor

`processQueue` is now exported and accepts an optional `processor` parameter:

```ts
export async function processQueue(
  processor: (id: number) => Promise<void> = processReport
): Promise<void>
```

At runtime, `startWorker` calls `processQueue()` with no arguments (uses the default). In tests, a `vi.fn()` is injected. No runtime behavior changed.

### 3. `src/index.ts` — `createApp()` split from `start()`

`createApp()` is now an exported function that builds and returns the configured Express application. `start()` calls `createApp()`, then `runMigrations()`, `startWorker()`, and `app.listen()`. Tests import `createApp()` directly without triggering any of those side effects.

---

## Adding new tests

When adding a new route or service:

1. Add integration tests in `tests/integration/` — cover happy path, validation errors, and ownership/auth checks
2. If the route involves a new pure transformation, extract it and add a unit test in `tests/unit/`
3. If the route changes a critical user journey, add or extend an E2E spec in `tests/e2e/`
4. Always use `truncateAll()` in `beforeEach` — never let test state leak between tests
5. Never mock `pool` or `testPool` — use the real DB

---

## CI

For GitHub Actions, add a `postgres` service on port 5433 and set `DATABASE_URL` in the environment:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: brenso
      POSTGRES_PASSWORD: brenso
      POSTGRES_DB: brenso_test
    ports:
      - "5433:5432"
    options: >-
      --health-cmd pg_isready
      --health-interval 5s
      --health-timeout 3s
      --health-retries 5
```

Run unit and integration tests on every push. Gate E2E tests to the main branch or PRs targeting main — they require a compiled server and take longer. Never run `make-docx.sh` in CI.
