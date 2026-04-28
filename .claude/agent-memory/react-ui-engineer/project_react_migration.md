---
name: React SPA Migration
description: Brenso frontend migrated from vanilla HTML/CSS/JS to React + Vite + Tailwind v4 + TypeScript
type: project
---

The frontend has been fully migrated from `public/views/*.html` + `public/js/*.js` to a React SPA in `client/`.

**Structure:**
- `client/` — Vite + React + TypeScript app
- Build output goes to `public/dist/` (served by Express as static + SPA catch-all)
- Dev server runs on port 5173 with proxy to Express on port 3000

**Key decisions:**
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no `tailwind.config.js` needed)
- Design tokens defined in `client/src/index.css` under `@theme {}` using Tailwind v4 syntax
- Shadcn/UI primitives used via manually installed Radix UI packages (shadcn CLI had v4 detection issues)
- No separate `shadcn.json` — components are hand-built in `client/src/components/ui/`
- Auth guard: `RequireAuth` component calls `/api/coach/me`, redirects to `/coach` if 401
- Express `requireAuth` middleware now returns 401 JSON (not redirect) for API routes

**Auth flow (SPA-aware):**
- React calls `/api/coach/me` on mount via `useAuthState` hook
- `AuthContext` provides coach data throughout the app
- 401 response → React Router redirects to `/coach` (login page)

**Why:** Express previously served HTML pages directly. React SPA now handles all routing client-side; Express only serves the `index.html` catch-all + API routes.

**How to apply:** When adding new pages, add route in `client/src/App.tsx`. When adding new API endpoints, add only to Express routes (no HTML serving needed).
