---
name: brenso-word
description: >
  Skill de génération de rapports Word BRENSO avec design system figé et constance absolue.
  Déclenche OBLIGATOIREMENT dès que l'utilisateur mentionne "rapport Word BRENSO", "fiche
  orientation Word", "générer rapport jeune", "document Word orientation", "rapport [prénom]",
  ou toute demande de livrable Word dans le contexte du pipeline BRENSO.
  Ce skill est le chef d'orchestre : il appelle les 3 skills sources (brenso-enneagramme,
  brenso-mbti, brenso-riasec) via le script brenso-rapport.js.
---

# BRENSO Word — Design System & Orchestrateur

Pipeline d'orientation BRENSO (Bénédicte Vanden Bossche, Ixelles).
Ce skill génère un rapport Word complet depuis un JSON questionnaire.
Chaque chapitre est synthétisé par l'API Claude avec la bonne dominance d'outil,
les légères influences des deux autres, et le word count ±5% choisi par le coach.

---

## Workflow de génération — TOUJOURS suivre cet ordre

```
Lancer le script d'orchestration :
   node brenso-rapport.js <questionnaire.json>
```

---

## Architecture du script brenso-rapport.js

Le script appelle l'API Claude **séparément pour chaque chapitre** avec :
- Les fiches sources chargées depuis les skills
- La bonne dominance d'outil par chapitre (voir tableau)
- Le word count du JSON ±5% comme contrainte stricte
- Le contexte des chapitres précédents pour la cohérence inter-chapitres

### Dominance par chapitre

| Chapitre | Outil dominant | Légère influence |
|----------|---------------|-----------------|
| 01 · Personnalité | **Enneagramme** | MBTI + RIASEC |
| 02 · Contexte pro | **Enneagramme** | MBTI + RIASEC |
| 03 · MBTI | **MBTI** | Enneagramme + RIASEC |
| 04 · Compétences clés | **MBTI** | Enneagramme + RIASEC |
| 05 · RIASEC | **RIASEC** | Enneagramme + MBTI |
| 06 · Besoins fondamentaux | **Enneagramme** | MBTI + RIASEC |
| 07 · Pistes métiers | **RIASEC** | Enneagramme + MBTI |
| 08 · Plan d'action | texte libre coach | — |
| Mot du coach | texte libre coach + phrase forte IA | — |

### Word count ±5%

Pour chaque chapitre, le script calcule :
- `min = Math.round(wordTarget * 0.95)`
- `max = Math.round(wordTarget * 1.05)`

Et le passe comme contrainte stricte dans le prompt API.

Les word counts sont lus depuis le JSON :
`words_ennea`, `words_mbti`, `words_riasec`, `words_comp_besoins`,
`words_metiers`, `words_plan_action`

### Cohérence inter-chapitres

Chaque appel API reçoit un résumé des chapitres déjà rédigés (`context`).
Cela garantit qu'un trait mentionné en ch01 est cohérent avec ce qui est
dit en ch03, et que les pistes de ch07 résonnent avec les besoins de ch06.

---

## Profil jeune vs profil adulte

Le script branche sur `profile_type` (`'young'` par défaut, `'adult'` pour les bilans
professionnels). Les méthodologies (Ennéagramme, MBTI, RIASEC) sont identiques —
seules la voix, la framing et les titres de quelques chapitres diffèrent.

| Élément | Profil jeune | Profil adulte |
|---------|--------------|---------------|
| Voix d'adresse | TU / tu / tes / ton | VOUS / votre / vos |
| Titre du rapport | Rapport d'orientation | Rapport de bilan professionnel |
| En-tête de page | Rapport d'orientation | Rapport de bilan professionnel |
| Couverture | Champ "Formation" (école) | Champs "Entreprise" + "Rôle" |
| Page contact | "destiné à X et à ses parents ou représentants légaux" | "destiné à X." |
| Chapitre 02 | "En contexte professionnel" | "Dans votre contexte professionnel" |
| Chapitre 07 | "Pistes de métiers & formations" | "Pistes de transition & repositionnement" |
| Chapitre 08 | "Plan d'action" | "Plan de transition professionnelle" |
| Frame contextuel | Aucun | `entreprise`, `role`, `situation` injectés dans chaque user prompt |

Helpers internes : `isAdult(q)`, `voiceRule(q)`, `adultFrame(q)`, `chapterTitleFor(num, q)`.

Pour étoffer le contexte adulte (transitions de carrière, burn-out, repositionnement),
voir `references/adult-context.md`.

---

## Design System — Constantes figées (ne jamais modifier)

### Format page
| A4 portrait | 11 906 × 16 838 DXA | Marges : 2.5cm / 2cm / 3cm / 2cm |

### Palette couleurs
| `blue` #40A2C0 | Bandeau chapitre, bullets, callout border, page# |
| `blueDark` #2B7A94 | Bande inférieure bandeau, header tableau |
| `blueLight` #E3F4F8 | Fond callout box |
| `pink` #CF3A65 | Sous-titres, pistes, items, phrase forte |
| `pinkDark` #A02A4E | Bande inférieure épilogue |

### Éléments visuels
- `chapterBand(num, title)` — bandeau bleu plein
- `subhead(text)` — majuscules rose + underline
- `callout(text)` — fond bleuLight + barre gauche bleue + italic
- `bullet(text)` — chevron › bleu
- `profileTable(rows)` — 2 col, header bleu
- `itemListTable(items)` — 2 col, titre rose
- `pisteBlock(num, metier, justif)` — barre gauche rose
- `phraseForte(text)` — grand bloc rose, texte blanc 18pt bold
- `epilogueBand(title)` — bandeau rose (Mot du coach)

---

## Structure document (11 pages minimum)
1. Couverture
2. 01 · Personnalité / Enneagramme
3. 02 · En contexte professionnel
4. 03 · Compétences / MBTI
5. 04 · Compétences clés
6. 05 · RIASEC
7. 06 · Besoins fondamentaux
8-9. 07 · Pistes métiers & formations
10. 08 · Plan d'action
11. Mot du coach
12. Page contact BRENSO

---

## Fichiers du skill
- `scripts/brenso-template.js` — template vide (placeholders) pour génération manuelle
- `scripts/brenso-rapport.js` — script d'orchestration complet (appels API + assemblage Word)
- `references/eneagramme.md` — eneagramme (9 bases + 3 sous-types)
- `references/mbti.md` — MBTI (16 types MBTI)
- `references/riasec.md` — RIASEC (6 lettres RIASEC)
