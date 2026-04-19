# Migration React

## Contexte

Le frontend de Brenso était initialement en HTML/CSS/JS vanilla, servi directement par Express via `public/views/`. Il a été migré vers une SPA React tout en conservant le backend Express inchangé en tant qu'API.

---

## Stack frontend

| Outil | Version | Rôle |
|---|---|---|
| React | 19 | UI |
| Vite | 8 | Dev server + bundler |
| TypeScript | 6 | Typage |
| Tailwind CSS | 4 | Styles (via `@tailwindcss/vite`) |
| Shadcn/UI + Radix | — | Composants primitifs |
| React Router | 7 | Routing client |
| `@vitejs/plugin-react` | 6 | Babel + Fast Refresh |

---

## Structure

```
client/                          ← Application React
  index.html                     ← Shell HTML (lang=fr, Google Fonts)
  vite.config.ts                 ← Config Vite (proxy, host, outDir)
  public/
    favicon.svg
    icons.svg
    react-refresh-preamble.js    ← Correctif Fast Refresh (voir ci-dessous)
  src/
    index.css                    ← Tokens Tailwind v4 (@theme), styles globaux
    App.tsx                      ← BrowserRouter + AuthContext + routes
    hooks/
      useAuth.ts                 ← useAuthState(), AuthContext, CoachMe
    lib/
      utils.ts                   ← cn(), formatDate(), formatDateLong()
    components/
      ui/
        button.tsx               ← Variants cva : primary, secondary, teal, dark, ghost
        badge.tsx                ← ReportBadge (queued/processing/done/error)
        input.tsx
        textarea.tsx
      layout/
        BackofficeHeader.tsx     ← Header sticky avec logo, slot titre, avatar + dropdown
        RequireAuth.tsx          ← Guard : redirige vers /coach si non authentifié
      pipeline/
        PipelineSection.tsx      ← Section accordéon (accents pink/teal/slate)
        WordDial.tsx             ← Slider avec affichage de valeur
        TagInput.tsx             ← Tags créés à la touche Entrée
        MetierBlocks.tsx         ← Éditeur dynamique métiers + formations
        types.ts                 ← Interfaces PipelineData, Metier, Formation
    pages/
      HomePage.tsx               ← Page marketing (hero, bénéfices, tarifs, calculateur)
      TermsPage.tsx              ← CGU / confidentialité
      QuestionnairePage.tsx      ← Formulaire 3 étapes (persistance localStorage)
      LoginPage.tsx              ← POST /api/login
      backoffice/
        ListPage.tsx             ← Tableau des coachées avec badges statut rapport
        PipelinePage.tsx         ← Fiche coachée (9 sections, MBTI/RIASEC/Ennéagramme)
        ProfilePage.tsx          ← Crédits, historique rapports, mot de passe
```

---

## Routing

Les routes React correspondent aux anciennes routes Express HTML :

| URL | Page |
|---|---|
| `/` | HomePage |
| `/terms` | TermsPage |
| `/hello` | QuestionnairePage |
| `/coach` | LoginPage |
| `/backoffice` | ListPage *(auth requise)* |
| `/backoffice/coachee/:id` | PipelinePage *(auth requise)* |
| `/backoffice/profile` | ProfilePage *(auth requise)* |

Les routes protégées sont enveloppées dans `<RequireAuth>` qui appelle `/api/coach/me` et redirige vers `/coach` si la réponse est 401.

---

## Authentification

Le backend conserve les sessions Express (cookie `connect.sid`). React vérifie l'état de connexion via `GET /api/coach/me` au démarrage. Le middleware `requireAuth` retourne désormais **401 JSON** au lieu d'une redirection HTML — c'est React qui gère la redirection côté client.

---

## Modifications Express

- Les routes GET qui servaient du HTML (`/`, `/hello`, `/backoffice`, etc.) ont été **supprimées** — la SPA les gère.
- `src/index.ts` sert `public/dist/` en premier (build React), puis `public/` (assets statiques), puis un **catch-all** `GET *` qui renvoie `public/dist/index.html` pour le routing React.
- `src/middleware/auth.ts` : `requireAuth()` renvoie `{ error: 'Unauthorized' }` avec status 401 au lieu de `res.redirect('/coach')`.

---

## Build et développement

### Scripts npm (racine)

```bash
npm run build          # tsc (backend) + vite build (client → public/dist/)
npm run dev            # concurrently : tsc -w + nodemon + vite dev server
npm run dev:client     # Vite seul (port 5173, proxy /api et /img → :3000)
npm run dev:server     # tsc -w + nodemon seul
```

### En développement

Ouvrir **`http://localhost:5173`** (Vite dev server, HMR actif).  
`http://localhost:3000` sert le dernier build compilé (pas de HMR).

### En production (Docker)

```bash
docker compose -f docker-compose.prod.yml up
```

Express sert le build React depuis `public/dist/`. Traefik gère HTTPS sur `brenso.oriado.com`.

---

## Docker (développement)

### `docker-compose.yml` — volumes montés pour le hot-reload

```yaml
volumes:
  - ./src:/app/src
  - ./public:/app/public
  - ./client/src:/app/client/src
  - ./client/public:/app/client/public
  - ./client/index.html:/app/client/index.html
  - ./client/vite.config.ts:/app/client/vite.config.ts
```

Le port **5173** est exposé en plus du port 3000 :

```yaml
ports:
  - "3000:3000"
  - "5173:5173"
```

### `Dockerfile` — ajout du build client

```dockerfile
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install --production=false
COPY client/ ./client/
```

---

## Problèmes rencontrés et solutions

### 1. `$RefreshSig$ is not defined`

**Cause** : `@vitejs/plugin-react` v6 utilise la nouvelle API Environments de Vite 8. Son hook `applyToEnvironment` vérifie `env.config.consumer === 'client'` avant d'injecter le preamble React Fast Refresh. Dans le contexte Docker, ce check échoue silencieusement — le transform Babel est appliqué (et émet des appels à `$RefreshSig$`) mais le preamble qui définit la variable n'est jamais injecté.

**Solution** : injection manuelle du preamble dans `client/public/react-refresh-preamble.js`, chargé via `<script type="module" src="/react-refresh-preamble.js">` dans `index.html`.

```js
// client/public/react-refresh-preamble.js
import RefreshRuntime from '/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
```

> Note : une inline `<script type="module">` dans `index.html` provoque une erreur Vite 8 (`MagicString: Cannot overwrite a zero-length range`). Il faut passer par un fichier externe.

### 2. `/img/word.svg` non servi par Vite

**Cause** : en dev, Vite sert uniquement `client/public/` — pas `public/` (dossier Express). Les images comme `/img/word.svg` sont absentes.

**Solution** : proxy Vite vers Express pour `/img` :

```ts
// vite.config.ts
proxy: {
  '/api': 'http://localhost:3000',
  '/img': 'http://localhost:3000',
}
```

### 3. Hot-reload absent après la migration

**Cause** : `client/` n'était pas monté en volume dans `docker-compose.yml`, et Vite écoutait sur `localhost` (non accessible depuis l'hôte Docker).

**Solution** :
- Ajout de `host: '0.0.0.0'` dans `vite.config.ts`
- Montage des volumes `client/src`, `client/public`, `client/index.html`, `client/vite.config.ts`
- Exposition du port 5173

---

## Assets statiques

Les fichiers dans `public/` (images, SVG, etc.) sont servis par Express sur les deux ports :
- **Port 3000** : directement via `express.static('public')`
- **Port 5173** : via le proxy Vite (`/img` → `localhost:3000`)

Les assets propres au client React (favicon, icônes) sont dans `client/public/` et servis par Vite en dev, inclus dans `public/dist/` au build.
