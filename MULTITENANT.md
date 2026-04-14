# Multi-coach tenancy

Brenso serves multiple coaches from **one backend**. Each coach has:

- their **own domain** (e.g. `brenso.oriado.com`, `marie.example.com`)
- a **custom accent color, logo letter and brand name**
- their own coachees, reports, and login — fully isolated by `coach_id`

The tenant is resolved from the HTTP `Host` header. There is no tenant prefix in URLs and no subdomain wildcard routing inside the app — just "one domain = one coach".

## How requests flow

```
Request → resolveCoach middleware → req.coach = { id, brand_name, logo_letter, accent_color, domain }
          (looks up coach WHERE domain = req.hostname)
                  ↓
         Public / auth / backoffice routes
```

Every request hits [src/middleware/coach.ts](src/middleware/coach.ts):
- Looks up `coach` by `domain = req.hostname` (cached 60s in memory).
- Attaches `req.coach` for downstream handlers.
- Returns **404** if the host is not a registered coach domain.

If you add a new domain without a matching row in `coach`, **everything 404s**. That's intentional — it prevents stray domains from using coach 1's data.

## Data model

The `coach` table owns the tenant. Relevant columns:

| Column | Example | Notes |
|---|---|---|
| `domain` | `brenso.oriado.com` | **UNIQUE, NOT NULL**. Must match `Host` header exactly. |
| `brand_name` | `BRENSO` | Wordmark shown in header/title. |
| `logo_letter` | `B` | Single char in the circled logo. |
| `accent_color` | `#3fa8b8` | Hex. Injected as `--teal` CSS variable. |

See [src/migrations/003_coach_tenant.sql](src/migrations/003_coach_tenant.sql).

`coachee.coach_id` links every coachee to one coach. All backoffice queries in [src/routes/backoffice.ts](src/routes/backoffice.ts) already filter by `req.session.coachId` — **keep it that way** when adding new routes. A missing `WHERE coach_id = $X` is a tenant leak.

## Branding injection (public pages)

Public HTML is templated with a minimal string-replace renderer: [src/util/renderBranded.ts](src/util/renderBranded.ts). Three placeholders:

- `{{brand_name}}`
- `{{logo_letter}}`
- `{{accent_color}}`

In each `<head>` of the branded HTML:

```html
<style>:root { --teal: {{accent_color}}; }</style>
```

This overrides the default `--teal` from [public/css/login.css](public/css/login.css) / [public/css/questionnaire.css](public/css/questionnaire.css). All accent styling already uses `var(--teal)`, so changing the variable restyles the page.

Pages currently branded:
- [public/views/home.html](public/views/home.html) (`/`)
- [public/views/questionnaire.html](public/views/questionnaire.html) (`/hello`)
- [public/views/terms.html](public/views/terms.html) (`/terms`)
- [public/views/login.html](public/views/login.html) (`/coach`)

The **backoffice pages** (`list.html`, `pipeline.html`) are not yet branded. If you want per-coach branding in the backoffice, either extend `renderBranded` usage or expose a `GET /api/branding` endpoint and apply CSS vars client-side.

## Login is domain-scoped

[src/routes/auth.ts](src/routes/auth.ts) `/api/login` requires `email AND domain = req.coach.domain`. This means:

- Marie cannot log into `brenso.oriado.com/coach` even with her valid credentials.
- If a coach changes domain, update `coach.domain` and they'll need to log in from the new URL.

## Onboarding a new coach

### 1. Add the coach row

Use the admin script, **from inside the backend container** (so `DATABASE_URL` resolves to the `postgres` service):

```bash
docker exec -it brenso-backend npx ts-node src/scripts/add-coach.ts \
  --email marie@example.com \
  --password SuperSecretChangeMe \
  --name "Marie Coach" \
  --domain marie.example.com \
  --brand "MARIE" \
  --letter "M" \
  --color "#d97b45"
```

Source: [src/scripts/add-coach.ts](src/scripts/add-coach.ts). `--color` must be a `#rrggbb` hex; `--letter` is exactly one character; `--domain` is stored lowercase.

### 2. DNS

Point the new domain's A/AAAA record at the server running Traefik.

### 3. Traefik router

In [docker-compose.prod.yml](docker-compose.prod.yml), extend the router rule to include the new host:

```yaml
- "traefik.http.routers.brenso.rule=Host(`brenso.oriado.com`) || Host(`marie.example.com`)"
```

Redeploy. Traefik auto-issues the Let's Encrypt cert via the existing `letsencrypt` resolver.

### 4. Verify

```bash
curl -sI https://marie.example.com/         # 200
curl -sI https://marie.example.com/hello    # 200, orange accent, "M" logo
curl -sI https://unknown.example.com/       # 404 "Unknown domain"
```

Submit a questionnaire on `marie.example.com/hello` and verify `coachee.coach_id` in DB = Marie's coach id.

## Testing multiple tenants locally

`localhost` isn't a registered coach domain, so hitting `http://localhost:3000/` returns **404 "Unknown domain"**. To test tenants on your dev machine, use hostnames that resolve to `127.0.0.1`.

### Option 1 — `*.localhost` (recommended)

macOS and Chrome auto-resolve any `*.localhost` to `127.0.0.1` with no `/etc/hosts` edit.

1. Point your coach rows at localhost hostnames:
   ```bash
   # Repoint the seeded coach:
   docker exec -it brenso-postgres psql -U brenso -d brenso \
     -c "UPDATE coach SET domain='brenso.localhost' WHERE domain='brenso.oriado.com';"

   # Or add a second dev coach:
   docker exec -it brenso-backend npx ts-node src/scripts/add-coach.ts \
     --email marie@example.com --password test --name "Marie" \
     --domain marie.localhost --brand "MARIE" --letter "M" --color "#d97b45"
   ```
2. Flush the 60s `resolveCoach` cache:
   ```bash
   docker compose restart backend
   ```
3. In Chrome:
   - `http://brenso.localhost:3000/` → teal / "B"
   - `http://marie.localhost:3000/` → orange / "M"

### Option 2 — fallback if `*.localhost` is hijacked

Some corporate networks intercept `.localhost`. Use a wildcard DNS helper that always resolves to `127.0.0.1`:

- `brenso.lvh.me`
- `marie.127.0.0.1.nip.io`

Set the coach's `domain` to match, then visit `http://brenso.lvh.me:3000/`.

## Gotchas

- **Cache TTL**: `resolveCoach` caches the coach row for 60 seconds. After you change a coach's branding or domain, expect up to a minute of staleness (or restart the backend).
- **HTML file cache**: [renderBranded.ts](src/util/renderBranded.ts) caches parsed templates in-memory. Editing an HTML file in a running container requires a restart.
- **`app.set('trust proxy', 1)`** in [src/index.ts](src/index.ts) is required for `req.hostname` to reflect Traefik's forwarded `Host` header. Don't remove it.
- **`ports: 5532:5432`** on postgres is a convenience for DB tooling. The backend connects internally on 5432.
- **Last-name NOT sent to AI**: see [terms.html](public/views/terms.html) section 4 — enforce this when adding new data to AI prompts in [src/services/ai.ts](src/services/ai.ts). Never add `profile.nom`, `date_naissance`, or `ecole_nom` to prompts.

## Where NOT to hard-code the tenant

Anti-patterns to flag in code review:

- ❌ `SELECT id FROM coach LIMIT 1` — was the pre-tenancy sin. Use `req.coach.id`.
- ❌ Any route handler that reads `pool.query('SELECT ... FROM coachee WHERE id = $1', [id])` without also constraining `AND coach_id = $2`.
- ❌ Serving public HTML via `res.sendFile(...)` — that bypasses `renderBranded`, so the placeholders leak to the user as `{{brand_name}}`.
