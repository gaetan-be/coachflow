# Ansible — Brenso ops

Two playbooks live here:

- `deploy.yml` — sync code and (re)build the Docker stack on `core`.
- `add-coach.yml` — onboard a new coach tenant.

Inventory: `inventory.ini` (single host: `core`, user `ubuntu`, sudo).
Secrets: `vars.yml` (gitignored — copy from `vars.example.yml`).
Cert/router config in `docker-compose.prod.yml`; Traefik runs separately on `core`.

---

## Prerequisites

- Ansible installed locally (`pip install ansible` or `brew install ansible`).
- SSH access to `ubuntu@core` (key-based; `host_key_checking` is disabled in `ansible.cfg`).
- The `community.docker` collection:
  ```bash
  ansible-galaxy collection install community.docker
  ```
- A populated `ansible/vars.yml` (see `vars.example.yml`).

---

## Deploy

```bash
cd ansible
ansible-playbook -i inventory.ini deploy.yml
```

What it does:

1. Ensures `/srv` is `0755` and creates `/srv/brenso{,/pgdata,/app}` owned by `ubuntu`.
2. `rsync` the project to `/srv/brenso/app` (excludes `node_modules`, `dist`, `.git`, `.venv`, `ansible`, `.env`).
3. Renders `/srv/brenso/app/.env` from `templates/env.j2` using `vars.yml`.
4. Ensures the external Docker `proxy` network exists (shared with Traefik).
5. `docker compose -f docker-compose.prod.yml up --build`.

The backend runs DB migrations on startup; the cron worker runs in-process.

### After deploy

```bash
curl -sI https://brenso.oriado.com/        # 200, served via *.oriado.com wildcard cert
curl -sI https://nope.oriado.com/          # 404 from resolveCoach (unknown tenant)
```

If a domain doesn't 404 on unknown hosts, the tenant middleware isn't seeing the right `Host` header — re-check `app.set('trust proxy', 1)` and Traefik labels.

---

## Add a coach

`add-coach.yml` wraps `src/scripts/add-coach.ts` inside the running `brenso-backend` container. Coach row + optional initial credit allocation go in one transaction.

### Required

```bash
ansible-playbook -i inventory.ini add-coach.yml \
  -e email=marie@oriado.com \
  -e password='SuperSecret' \
  -e name='Marie Coach' \
  -e domain=marie.oriado.com \
  -e brand=MARIE \
  -e letter=M \
  -e color='#d97b45'
```

| Var | Notes |
|---|---|
| `email` | Unique. Coach logs in with this on their domain. |
| `password` | Plain text; bcrypt-hashed before insert. `no_log: true` is set on the exec task. |
| `name` | Display name. |
| `domain` | Lowercased on insert. Must resolve to `core` (covered by `*.oriado.com` wildcard A). |
| `brand` | Wordmark in header (e.g. `MARIE`). |
| `letter` | Single character for the circled logo. |
| `color` | Hex `#rrggbb`. Becomes `--teal` CSS variable on branded pages. |

### Optional

| Var | Effect |
|---|---|
| `plan` | `plan.name` (`a_la_piece`, `starter`, `plus`, `super`). Omitted → no plan → unlimited reports. With a plan, every report consumes a credit; without an allocation the coach gets HTTP 402. |
| `language` | `fr` or `nl`. Omitted → auto-detected from `Accept-Language` on the first `/api/coach/me` and persisted. |
| `credits` | Positive integer. Inserts a `credit_allocation` row (source `manual`). |
| `validity_days` | Days before the allocation expires. Requires `credits`. Omit for no expiry. |
| `restart_backend` | `true` to restart the backend container after insert (flushes the 60s `resolveCoach` cache). |

### Examples

Coach on a paid plan with their first month of credits:

```bash
ansible-playbook -i inventory.ini add-coach.yml \
  -e email=marie@oriado.com -e password='...' \
  -e name='Marie Coach' -e domain=marie.oriado.com \
  -e brand=MARIE -e letter=M -e color='#d97b45' \
  -e plan=starter -e credits=3 -e validity_days=30 \
  -e restart_backend=true
```

Free / unlimited internal account:

```bash
ansible-playbook -i inventory.ini add-coach.yml \
  -e email=test@oriado.com -e password='...' \
  -e name='Test' -e domain=test.oriado.com \
  -e brand=TEST -e letter=T -e color='#3fa8b8'
```

### Verifying

```bash
# On core
sudo docker exec brenso-postgres psql -U brenso -d brenso -c \
  "SELECT id, email, domain, plan_id, language FROM coach ORDER BY id;"

sudo docker exec brenso-postgres psql -U brenso -d brenso -c \
  "SELECT coach_id, amount, used, valid_until, source FROM credit_allocation;"
```

Then in a browser: `https://<domain>/` should render with the new brand/letter/color, `/coach` should let the coach log in.

---

## Common ops not (yet) automated

- **Rotating the coach password** — the seeder is insert-only, so changing `coach_password` in `vars.yml` doesn't update existing rows. To rotate:
  ```bash
  ssh ubuntu@core 'sudo docker exec brenso-backend node -e "
    const bcrypt=require(\"bcrypt\");const{Pool}=require(\"pg\");
    const p=new Pool({connectionString:process.env.DATABASE_URL});
    bcrypt.hash(process.env.COACH_PASSWORD,10)
      .then(h=>p.query(\"UPDATE coach SET password_hash=\$1 WHERE email=\$2\",[h,process.env.COACH_EMAIL]))
      .then(r=>{console.log(\"updated\",r.rowCount);process.exit(0)});
  "'
  ```
- **Granting more credits later** — insert a `credit_allocation` row directly, or extend `add-coach.yml` into a more general `grant-credits.yml`.
- **External (non-`*.oriado.com`) domains** — the wildcard cert won't cover them. Add a second Traefik router with `Host(\`their.tld\`)` + `letsencrypt-tls` (TLS-ALPN-01 resolver).
