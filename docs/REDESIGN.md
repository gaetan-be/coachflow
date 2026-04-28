# Redesign — Light Theme Migration

## Summary

The entire frontend was migrated from a **dark theme** (dark navy backgrounds, white text) to a **light theme** (grey `#F6F7F9` background, white cards, navy text). The visual reference for the new design is `references/genius-pipeline.html` and `references/genius-questionnaire.html`.

---

## Design System

### Fonts

Two font pairs are used intentionally — do not mix them:

| Pages | Fonts |
|-------|-------|
| `home.html` (landing page) | Fraunces + Inter Tight |
| `login`, `questionnaire`, `backoffice`, `pipeline`, `terms` | Cormorant Garamond + DM Sans |

### Colour Palette

```css
--navy:      #202C34   /* primary text, buttons */
--teal:      #40A2C0   /* primary accent */
--slate:     #6B9DB5   /* secondary accent */
--pop:       #EA226C   /* pink highlight (identité, intro card) */
--gold:      #BEA674   /* warm accent */
--green:     #4caf82   /* success, done status */
--purple:    #7f77dd   /* MBTI */
--muted:     #6B7580   /* secondary text */
--line:      #EAEDEF   /* borders */
```

### Background

Body background is `#F6F7F9` (not white). Each page has two decorative radial gradient blobs via `body::before` and `body::after` — teal top-right, slate bottom-left.

---

## Files Changed

### CSS

**`public/css/login.css`**
- Full rewrite to light theme
- Grey background with gradient blobs
- White frosted card with shadow and `fadeUp` animation
- Logo circle: teal glow (`box-shadow: 0 0 14px rgba(64,162,192,0.28)`)
- Pill button (`border-radius: 100px`) navy→teal on hover

**`public/css/questionnaire.css`**
- Full rewrite to match `references/genius-questionnaire.html`
- Frosted glass sticky header (3-col grid: logo / title / empty)
- Intro card: white, left `border-left: 3px solid var(--pop)`, collapses to `.compact` on step 2+
- Progress bar: 4px, inactive `#EAEDEF`, active teal, done slate
- Step cards with per-step accent colours: pink (step 1), teal (step 2), slate (step 3)
- `focus-within` box-shadow per accent colour
- Pill buttons (`border-radius: 100px`), 2-col grid layout, `.btn-spacer` for step 1
- Pink submit button
- Success card: white, teal left border

**`public/css/backoffice.css`**
- Full rewrite to match `references/genius-pipeline.html`
- Shared by `list.html` and `pipeline.html`
- Header: 3-col grid (`1fr auto 1fr`), frosted glass, `.logo-g` teal glow circle
- Section cards: white, `border-radius: 20px`, `border-left: 3px solid transparent`
- Section colour groups via `nth-child` (see below)
- Solid coloured section tags (white text on coloured bg)
- Labels use `var(--label)` = `#202C34` (navy), not muted
- Inputs: `border-radius: 12px`, DM Sans, `#BFC5CC` placeholder
- Word dials: neutral slate style, Cormorant Garamond for the number display
- RIASEC: full rank-1/2/3 visual states
- Make-report bar: gradient background, pill buttons

### HTML

**`public/views/login.html`**
- Font import → Cormorant Garamond + DM Sans
- Added `placeholder` text to both inputs

**`public/views/questionnaire.html`**
- Font import → Cormorant Garamond + DM Sans
- Restructured to 3-col sticky header (`.page-header-wrap > .page-header`)
- Step cards wrapped in `.step-card` with accent class (`pink-accent`, `teal-accent`, `slate-accent`)
- Each card has `.step-card-header` with `.step-tag` pill + `.step-title`
- Button row uses `.btn-spacer` on step 1 (no back button)
- Success wrapped in `.success-card`

**`public/views/pipeline.html`**
- Font import → Cormorant Garamond + DM Sans
- Header restructured to 3-col grid with dynamic coachee name (`#header-prenom`)
- Added `.toggle-all-row` with `toggle-all-btn` between section 1 and section 2
- Save bar removed — save button moved into the make-report bar alongside the report button
- Make-report bar redesigned: gradient bg, pill buttons, "Sauvegarder" + "Créer le rapport →"

**`public/views/list.html`**
- Font import → Cormorant Garamond + DM Sans
- Header restructured to match pipeline 3-col layout

**`public/views/home.html`**
- Replaced entirely with `references/design.html` (SaaS landing page)
- Self-contained with inline styles — Fraunces + Inter Tight, intentionally different from the rest

---

## Section Colour Groups (pipeline)

Sections are coloured by `nth-child` index. The `toggle-all-row` div sits at index 2 in the DOM, shifting all subsequent section indices by 1.

| nth-child | Section | Accent |
|-----------|---------|--------|
| 1  | Identité | Pink (`--pop`) |
| 3  | Enneagramme | Teal |
| 4  | MBTI | Teal |
| 5  | RIASEC | Teal |
| 6  | Valeurs | Slate |
| 7  | Compétences & Besoins | Slate |
| 8  | Métiers & Formations | Slate |
| 9  | Plan d'action | Slate |
| 10 | Notes du coach | Pink (`--pop`) |

Focus-within triggers: coloured `border-left` + coloured `box-shadow` + `translateY(-1px)`.
Input focus rings also change colour per group (pink / teal / slate).

---

## JS Changes (`public/js/pipeline.js`)

- `toggleSection`: rewritten to use explicit `maxHeight`/`opacity`/`padding` inline styles (required for CSS transition to work correctly)
- `toggleAll`: acts on button label (not computed state) — avoids the bug where manually toggling a section then clicking "Tout replier" would expand instead of collapse
- `saveCoachee`: shows "Sauvegarde..." on button + "Sauvegardé ✓" in header on success
- `makeReport`: shows "Sauvegarde..." then "Génération..." sequentially, disables save button during the operation
- `populateForm`: updates `#header-prenom` from loaded data
- `DOMContentLoaded`: collapses sections 2–9 on page load, wires up live `#header-prenom` update from prenom input
