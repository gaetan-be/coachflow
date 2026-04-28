---
name: brenso-pptx
description: >
  Skill de generation de presentations PowerPoint BRENSO a partir d'un rapport
  d'orientation Word ou PDF. Declenche des que l'utilisateur mentionne "presentation
  BRENSO", "PowerPoint orientation", "slides rapport", "PPTX BRENSO", "faire une
  presentation du rapport", ou toute demande de livrable PowerPoint dans le contexte
  du pipeline BRENSO. Ce skill contient le parser de document, le generateur de
  slides, et l'architecture visuelle complete. Ne jamais generer un PPTX BRENSO
  sans avoir lu ce skill.
---

# BRENSO PPTX — Generateur de Presentations

Pipeline d'orientation BRENSO (Benedicte Vanden Bossche, Ixelles).
Ce skill transforme un rapport d'orientation Word/PDF en une presentation
PowerPoint de 10 slides visuelles et brandees.

---

## Workflow de generation

```
1. Lire ce skill (OBLIGATOIRE)
2. Copier les scripts dans /home/claude/ :
   cp /mnt/skills/user/brenso-pptx/scripts/*.js /home/claude/
3. Installer les dependances (une seule fois) :
   npm install pptxgenjs react react-dom react-icons sharp
   pip install "markitdown[pptx]" --break-system-packages
4. Executer :
   node generate-pptx.js <rapport.docx|.pdf> [output.pptx] [--color1=HEX] [--color2=HEX]
5. QA visuelle (OBLIGATOIRE) :
   python /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf output.pptx
   rm -f slide-*.jpg
   pdftoppm -jpeg -r 150 output.pdf slide
   ls -1 "$PWD"/slide-*.jpg
   → Inspecter chaque slide visuellement
6. Copier vers /mnt/user-data/outputs/
7. present_files
```

---

## Architecture — 10 slides fixes

| Slide | Contenu | Layout |
|-------|---------|--------|
| 1 | **Titre** — nom, profils, coach, date | Bandeau H1 + bande H2 + 4 cartes info |
| 2 | **Ch. 01** — Personnalite / Enneagramme | 2 colonnes : 3 cards + mots-cles |
| 3 | **Ch. 02** — Contexte professionnel | Grille 2x2 de forces |
| 4 | **Ch. 03** — MBTI | 4 dimensions (cercles) + encart "Ce qui t'anime" |
| 5 | **Ch. 04** — Competences cles | Grille 2x4 (icones + labels) |
| 6 | **Ch. 05** — RIASEC | Grande lettre dominante + 3 cards |
| 7 | **Ch. 06** — Besoins fondamentaux | Grille 3x2 |
| 8 | **Ch. 07** — Pistes de metiers | 3 colonnes (header colore + formations) |
| 9 | **Ch. 08** — Valeurs & Plan d'action | Cercles valeurs + mot du coach |
| 10 | **Conclusion** — Qualites positives | Fond H1 + texte blanc + footer coach |

---

## Couleurs

Les 2 couleurs principales sont extraites du Word ou passees en argument :

| Param | Default BRENSO | Usage |
|-------|---------------|-------|
| `--color1` | `40A2C0` (bleu teal) | Chapitres, accents H1, barre laterale |
| `--color2` | `CF3A65` (rose) | Sous-titres, accents H2, pistes |

Les declinaisons (light, dark) sont calculees automatiquement :
- `H1_LIGHT` = color1 eclairci 85% → fond cartes, barres d'insight
- `H2_LIGHT` = color2 eclairci 85% → fond pistes roses
- `H1_DARK`  = color1 assombri 25% → variante d'accent

---

## Parser : parse-report.js

Extrait du texte markitdown :

### Branding (entreprise, URL, email)

| Donnee | Source dans le Word |
|--------|-------------------|
| `branding.company` | Nom entreprise (ex: "BRENSO Coaching & Training") |
| `branding.docTitle` | Titre du document (ex: "RAPPORT D'ORIENTATION") |
| `branding.url` | URL trouvee dans le doc (ex: "www.brenso.be") |
| `branding.email` | Email trouvee dans le doc |
| `branding.location` | Ville/pays pres du footer |

### Cover (page de titre)

| Donnee | Source dans le Word |
|--------|-------------------|
| `cover.name` | Ligne apres "Prepare pour" |
| `cover.dob` | "Date de naissance : ..." |
| `cover.formation` | "Formation : ..." |
| `cover.enneagramme` | "Enneagramme : ..." |
| `cover.mbti` | "MBTI : ..." |
| `cover.riasec` | "RIASEC : ..." |
| `cover.coach` | "Coach : ..." |
| `cover.date` | "Date du rapport : ..." |

### Chapitres et contenu

| Donnee | Source dans le Word |
|--------|-------------------|
| `chapters[]` | Detectes par pattern `XX · TITRE` |
| `chapters[].callout` | Premier paragraphe apres le heading |
| `chapters[].bullets` | Lignes commencant par `›` |
| `chapters[].keywords` | Section "MOTS-CLES" |
| `chapters[].sections` | Sous-titres ALL-CAPS |
| `chapters[].pistes` | Pattern "PISTE X · Metier" |
| `values` | Section "TES VALEURS" |
| `coachWord` | Section "MOT DU COACH" |
| `qualities` | Derives des keywords + competences |

---

## Generateur : generate-pptx.js

Le generateur choisit automatiquement le layout de chaque slide
en fonction du contenu detecte :

| Contenu detecte | Layout applique |
|-----------------|-----------------|
| Pistes presentes | 3 colonnes (pistes) |
| Keywords + bullets | 2 colonnes (cards + mots-cles) |
| 6+ bullets | Grille 2x2 |
| 1-5 bullets | Cards empiles |
| Sections seules | Liste de sections |
| Titre match "COMPETENCES" | Grille 2x4 speciale |
| Titre match "RIASEC" | Grande lettre + cards |
| Titre match "BESOINS" | Grille 3x2 speciale |
| Titre match "VALEURS" | Cercles + mot du coach |

---

## Icones

Le systeme utilise `react-icons/fa` (Font Awesome) :

| Chapitre | Icone |
|----------|-------|
| 01 | FaShieldAlt |
| 02 | FaBriefcase |
| 03 | FaBrain |
| 04 | FaStar |
| 05 | FaCompass |
| 06 | FaHeart |
| 07 | FaRocket |
| 08 | FaAward |

Icones de detail (cards) : FaEye, FaLock, FaComments, FaCheckCircle,
FaLightbulb, FaHandsHelping, FaUsers, FaGraduationCap, FaTv,
FaChalkboardTeacher, FaBalanceScale, FaGem.

---

## Elements visuels constants

Ces elements sont presents sur CHAQUE slide de contenu (2-9) :
- Barre laterale gauche H1 (0.12" de large, pleine hauteur)
- Icone chapitre (0.45" x 0.45") en haut a gauche
- Titre `XX · NOM` en H1 (24pt Trebuchet MS bold)
- Sous-titre / callout en H2 (14pt Calibri bold)
- Fond beige clair `F7F5F0`
- Ombres douces sur les cartes (blur 6, offset 2, opacity 10%)

La slide titre (1) a un bandeau H1 plein + diagonale H2.
La slide conclusion (10) a un fond plein H1 + barre H2 en bas.

---

## Typographie

| Element | Police | Taille |
|---------|--------|--------|
| Titre principal | Trebuchet MS | 36pt bold |
| Titre chapitre | Trebuchet MS | 24pt bold |
| Sous-titre | Calibri | 14pt bold |
| Titre de carte | Calibri | 13pt bold |
| Corps de carte | Calibri | 10.5-11pt |
| Labels | Calibri | 9-10pt |
| Qualites (conclusion) | Calibri | 18pt |

---

## Regles strictes

1. **1 slide = 1 chapitre Word** — ne jamais fusionner ni scinder
2. **Toujours 10 slides** — intro + 8 chapitres + conclusion
3. **Pas de texte brut** — chaque slide a des shapes, cartes, icones
4. **Couleurs derivees** — jamais de couleurs hardcodees autres que DARK/BODY/WHITE/BG
5. **ZERO contenu hardcode** — tout texte affiche vient du Word via le parser :
   - Nom entreprise, URL, email → `data.branding`
   - Nom, profils, coach, date → `data.cover`
   - Titres, bullets, callouts, sections → `data.chapters[]`
   - Valeurs, mot du coach, qualites → `data.values`, `data.coachWord`, `data.qualities`
   - Si un champ est absent → placeholder `[Non renseigne]` ou `[...]`
6. **Anti-fuite entre personnes** — le parser relit TOUT le Word a chaque execution,
   aucun cache, aucun residuel. Un champ vide = placeholder, jamais une valeur precedente.
7. **QA visuelle obligatoire** — convertir en images et inspecter avant livraison
8. **Ne jamais reutiliser un objet option** — creer des objets frais (cf. S())

---

## Fichiers source

| Fichier | Role |
|---------|------|
| `scripts/parse-report.js` | Parser markitdown → JSON structure |
| `scripts/generate-pptx.js` | JSON → PowerPoint 10 slides |

Les deux fichiers sont autonomes. Le generateur appelle le parser en interne.
