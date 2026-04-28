# BRENSO — Contexte adulte (bilan / repositionnement professionnel)

> **À compléter par Bénédicte.** Ce document complète les fiches méthodologiques
> (`enneagramme.md`, `mbti.md`, `riasec.md`) pour le profil `profile_type='adult'`.
> Il oriente la voix, les nuances et les recommandations propres aux coachés
> adultes (en activité, en questionnement, en burn-out, en reconversion).

## Voix et registre

- **Vouvoiement** systématique. Adresse adulte, professionnelle, chaleureuse.
- Éviter toute référence à l'école, aux études en cours, aux parents ou aux
  représentants légaux.
- Posture : un pair-coach qui aide à clarifier, pas un orienteur de filière.

## Cadrage du rapport

- Le coaché a déjà un parcours. Le rapport ne propose pas une *première*
  orientation : il aide à **clarifier la situation actuelle** et à **identifier
  des pistes de transition ou de repositionnement** cohérentes avec le profil
  Ennéagramme/MBTI/RIASEC.
- Les "pistes métiers" deviennent des **pistes de transition** : changement
  d'entreprise, changement de fonction, formation continue, indépendance,
  reconversion sectorielle.

## Lecture des situations déclarées

Le questionnaire adulte capture une multi-sélection `situation` :

| Clé | Lecture |
|-----|---------|
| `questionnement` | Sentiment de désalignement diffus. Ne pas dramatiser. Inviter à explorer. |
| `burnout` | Épuisement professionnel. Prioriser besoins fondamentaux et conditions de récupération avant pistes métiers. |
| `reorientation` | Décision de changer prise. Pistes de transition concrètes attendues. |
| `indecis` | Manque de clés de lecture. Souligner les apprentissages des typologies avant de proposer des pistes. |

Ces clés sont injectées dans chaque user prompt via `adultFrame(q)`.

## Adaptations de chapitres

### Ch02 — Dans votre contexte professionnel

- Partir du `role` actuel et de l'`entreprise` (si renseignés) comme miroir.
- Lire les **forces** comme déjà-mobilisées dans le poste actuel.
- Lire les **besoins** comme conditions de durabilité — souvent ce qui manque
  dans la situation actuelle.

### Ch04 — Compétences clés

- Compétences déjà acquises et démontrées en milieu professionnel.
- Distinguer : compétences techniques, transversales, et "signature" (ce qui
  vous distingue dans votre rôle).

### Ch06 — Besoins fondamentaux

- Lire à la lumière du `situation`. Burn-out → priorité aux besoins de
  récupération, sécurité, contrôle. Reorientation → priorité aux besoins
  d'alignement et de sens.

### Ch07 — Pistes de transition & repositionnement

- 2-3 pistes maximum, chacune crédible compte tenu du parcours.
- Pour chaque piste : **type de transition** (interne / externe / sectorielle /
  indépendante), **horizon temporel** (3 mois / 6-12 mois / 1-2 ans),
  **formations continues** ou certifications éventuelles, **3 actions
  concrètes** réalisables dans les 30 prochains jours.

### Ch08 — Plan de transition professionnelle

- Reformule `plan_action` du coach. Si vide, génère un plan en 3 horizons
  (court / moyen / long terme) ancré dans les pistes ch07.

### Mot du coach

- Vouvoiement. Tonalité de pair-confiance.
- Phrase forte : doit pouvoir être relue dans 5 ans, en `vous`, mémorisable.

## TODO — Bénédicte

- [ ] Préciser les nuances de lecture par base Ennéagramme dans un contexte
      adulte / burn-out (ex. base 3 vs base 6 face à un épuisement).
- [ ] Lister les organismes de formation continue belges fréquemment cités
      pour les pistes de reconversion (CECAFOC, EFPME, IFAPME, EPFC, etc.).
- [ ] Indiquer les *signaux d'alerte* (idées suicidaires, dépression sévère)
      qui doivent renvoyer le coaché vers un autre professionnel.
