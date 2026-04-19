# Credits, Plans & Coach Profile

## Overview

Coaches have a limited number of reports they can generate per billing period. Rather than a simple counter, Brenso uses a **credit ledger**: each grant of credits is its own row with an independent expiry date. This makes it trivial to implement:

- Monthly subscription credits (3/month, valid 30 days)
- Promotional offers ("20 credits valid 1 year")
- Manual top-ups without touching other allocations

Plans control which features are available (Word download, future PPTX, audio). Coaches without a plan assigned bypass all credit checks — useful during onboarding or for internal accounts.

---

## Data Model

Migration: `src/migrations/003_credits_and_plans.sql`

### `plan` — tier definitions

```sql
id               SERIAL PRIMARY KEY
name             VARCHAR(50) UNIQUE       -- 'a_la_piece' | 'starter' | 'plus' | 'super'
display_name     VARCHAR(100)             -- shown in UI
features         JSONB                    -- feature flags (see below)
price_monthly_cents INT                   -- NULL for pay-per-use
credits_per_month   INT                   -- NULL for pay-per-use
credit_validity_days INT                  -- how long monthly credits last
```

### `credit_allocation` — the credit ledger

```sql
id           SERIAL PRIMARY KEY
coach_id     INT REFERENCES coach(id)
amount       INT CHECK (amount > 0)       -- total credits granted
used         INT DEFAULT 0               -- credits consumed so far
valid_from   TIMESTAMPTZ DEFAULT NOW()
valid_until  TIMESTAMPTZ                  -- NULL = never expires
source       VARCHAR(50)                  -- 'subscription' | 'promo' | 'manual' | 'purchase'
note         TEXT                         -- human-readable label, e.g. "Starter — mai 2026"
```

**Key design decisions:**
- Each row is independent — multiple active allocations can coexist
- FIFO consumption: oldest `valid_from` is debited first
- `valid_until IS NULL` means the credits never expire
- `used < amount` is enforced at query time, never in code

### Schema additions to existing tables

```sql
coach.plan_id INT REFERENCES plan(id)
-- NULL = no plan = bypass all credit checks

coachee_report.credit_allocation_id INT REFERENCES credit_allocation(id)
-- Records which allocation was debited when the report was queued
-- NULL for reports generated before this feature, or for bypass coaches
```

---

## Services

### `src/services/credits.ts`

| Function | Returns | Notes |
|----------|---------|-------|
| `getCoachCredits(coachId)` | `{ balance, allocations[] }` | Only active (non-expired, `used < amount`) allocations |
| `consumeCredit(coachId)` | `number \| null` | Atomic `UPDATE … RETURNING id`; returns null if no credits left |
| `addAllocation(coachId, amount, validUntil, source, note?)` | `void` | The only way to grant credits |

`consumeCredit` uses a single atomic `UPDATE … WHERE id = (SELECT … LIMIT 1) RETURNING id` — safe under concurrent requests without explicit locking.

### `src/services/plans.ts`

| Function | Returns | Notes |
|----------|---------|-------|
| `getCoachPlan(coachId)` | `{ plan_name, plan_display_name, features }` | Null fields if no plan assigned |
| `hasFeature(coachId, feature)` | `boolean` | Returns `true` (bypass) if coach has no plan |

---

## API Routes

All in `src/routes/backoffice.ts`, all require authentication.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/coach/me` | Coach name, email, plan, balance, allocations — used by header dropdown |
| `GET` | `/api/coach/reports` | All `coachee_report` rows for this coach, joined with coachee name |
| `PUT` | `/api/coach/password` | Body: `{ current_password, new_password }`. Returns 401 if current is wrong |
| `GET` | `/backoffice/profile` | Serves `public/views/profile.html` |

### Credit check in report queuing (`POST /api/coachee/:id/report`)

```
1. assertOwnership — coach owns this coachee
2. check no report already queued/processing
3. getCoachPlan — if plan_id is NULL → skip credit check
4. consumeCredit — if returns null → 402 "Aucun crédit disponible."
5. INSERT coachee_report with credit_allocation_id
```

---

## Plan Features

The `plan.features` JSONB column is the extensibility hook. Current keys:

| Key | Type | Status |
|-----|------|--------|
| `word_download` | `boolean` | Active — DOCX download gated by this |
| `pptx` | `boolean` | Seeded, **not yet enforced** — future PowerPoint format |
| `audio` | `boolean` | Seeded, **not yet enforced** — future 3-min audio podcast |
| `sections` | `string[]` | Seeded, **not yet enforced** — future per-plan report section filtering |

Seeded plans:

| Name | Price | Credits/month | Validity | pptx | audio |
|------|-------|--------------|----------|------|-------|
| À la pièce | — (per report) | — | — | ✗ | ✗ |
| Starter | 69 €/month | 3 | 30 days | ✗ | ✗ |
| Plus | 129 €/month | 7 | 30 days | ✓ | ✗ |
| Super | 219 €/month | 15 | 30 days | ✓ | ✓ |

---

## Coach Profile Page

Route: `/backoffice/profile` → `public/views/profile.html` + `public/js/profile.js`

Three sections:

1. **Changer le mot de passe** — calls `PUT /api/coach/password`, inline feedback (no `alert()`)
2. **Historique des rapports** — calls `GET /api/coach/reports`, table with status badges and download links
3. **Mes crédits** — calls `GET /api/coach/me`, one card per allocation with usage bar and expiry date

### Header avatar dropdown

All three backoffice pages (`list.html`, `pipeline.html`, `profile.html`) include a profile avatar (coach initial) in the header. Clicking it opens a popover with plan badge, credit bar, a link to the profile page, and a logout button.

The dropdown JS is duplicated in each page (the project has no templating engine). If a fourth backoffice page is added, copy the `<div class="profile-menu">` block and the `(function() { … })()` script block from any existing page.

CSS classes: `.profile-menu`, `.profile-avatar`, `.profile-popover`, `.popover-*`, `.credit-bar-fill` — all in `public/css/backoffice.css`.

---

## Operational Procedures

No admin UI exists. Use SQL directly against the database.

### Assign a plan to a coach

```sql
UPDATE coach
SET plan_id = (SELECT id FROM plan WHERE name = 'starter')
WHERE email = 'coach@brenso.be';
```

### Grant monthly subscription credits

```sql
INSERT INTO credit_allocation (coach_id, amount, valid_until, source, note)
VALUES (
  (SELECT id FROM coach WHERE email = 'coach@brenso.be'),
  3,
  NOW() + INTERVAL '30 days',
  'subscription',
  'Starter — mai 2026'
);
```

### Grant a promotional allocation

```sql
INSERT INTO credit_allocation (coach_id, amount, valid_until, source, note)
VALUES (
  (SELECT id FROM coach WHERE email = 'coach@brenso.be'),
  20,
  NOW() + INTERVAL '1 year',
  'promo',
  'Offre lancement'
);
```

### Check a coach's current balance

```sql
SELECT amount, used, (amount - used) AS balance, valid_until, source, note
FROM credit_allocation
WHERE coach_id = (SELECT id FROM coach WHERE email = 'coach@brenso.be')
  AND valid_from <= NOW()
  AND (valid_until IS NULL OR valid_until > NOW())
  AND used < amount
ORDER BY valid_from ASC;
```

### Remove a plan (revert to bypass mode)

```sql
UPDATE coach SET plan_id = NULL WHERE email = 'coach@brenso.be';
```

---

## Known Limitations & Next Steps

| Area | Status |
|------|--------|
| Billing / Stripe | Not integrated — allocations are inserted manually |
| Monthly auto-renewal | No cron job — must insert a new allocation each billing period |
| Admin UI | Not built — use the SQL queries above |
| `pptx` format | Feature flag seeded, report generation not implemented |
| `audio` format | Feature flag seeded, report generation not implemented |
| Report section filtering | `sections` key in features JSONB is the hook; `brenso-rapport.js` does not yet read it |
| Multiple coaches | The architecture supports it (all tables are coach-scoped), but the current seeder only creates one coach |
