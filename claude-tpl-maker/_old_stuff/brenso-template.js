const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TabStopType
} = require('docx');
const fs = require('fs');

// ============================================================
// BRENSO DESIGN SYSTEM — CONSTANTES ABSOLUES
// NE JAMAIS MODIFIER — seul le contenu textuel change
// ============================================================

const C = {
  blue:       "40A2C0",   // bleu principal — bandeau chapitre, bullets, callout border
  blueDark:   "2B7A94",   // bleu foncé — bande inférieure bandeau, header tableau
  blueLight:  "E3F4F8",   // bleu pâle — fond callout box
  bluePale:   "F0F8FB",   // bleu très pâle — fond lignes paires tableau

  blueTint1:  "A8D8E8",   // motivateurs — teinte claire (texte blueDark)
  blueTint2:  "40A2C0",   // motivateurs — teinte base  (texte blanc)
  blueTint3:  "2B7A94",   // motivateurs — teinte foncée (texte blanc)

  pink:       "CF3A65",   // rose accent — sous-titres, pistes, compétences
  pinkDark:   "A02A4E",   // rose foncé
  pinkLight:  "FAEAEE",   // rose pâle — fond blocs items impairs

  dark:       "1D2D35",   // texte corps
  mid:        "4A6572",   // texte secondaire / labels
  greyLight:  "F2F5F6",   // fond lignes paires
  greyBorder: "CBD4D7",   // bordures tableau
  white:      "FFFFFF",
};

// A4 — 1440 DXA = 1 pouce = 2.54 cm
const PAGE = {
  w: 11906, h: 16838,
  mTop: 1418, mBottom: 1418,
  mLeft: 1701, mRight: 1134,
};
PAGE.cw = PAGE.w - PAGE.mLeft - PAGE.mRight; // 9071 DXA

const COL1      = Math.round(PAGE.cw * 0.34);   // tableau profil — label
const COL2      = PAGE.cw - COL1;               // tableau profil — valeur
const COL_ITEM  = Math.round(PAGE.cw * 0.28);   // tableau items  — titre
const COL_DESC  = PAGE.cw - COL_ITEM;           // tableau items  — description

// ============================================================
// PRIMITIVES TYPOGRAPHIQUES
// ============================================================

const r = (text, opts = {}) =>
  new TextRun({ text, font: "Calibri", size: 22, color: C.dark, ...opts });

const p = (children, opts = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    children: Array.isArray(children) ? children : [children],
    ...opts,
  });

const blank = (before = 80) =>
  new Paragraph({ spacing: { before, after: 0 }, children: [r("")] });

const br = () => new Paragraph({ children: [new PageBreak()] });

// ============================================================
// ÉLÉMENTS STRUCTURANTS — FIGÉS
// ============================================================

function chapterBand(num, title) {
  return [
    blank(240),
    new Paragraph({
      shading: { fill: C.blue, type: ShadingType.CLEAR },
      spacing: { before: 0, after: 0 },
      indent: { left: 200 },
      children: [
        r(num, { size: 20, bold: true, color: "8DD1E4" }),
        r("   ·   ", { size: 18, color: "8DD1E4" }),
        r(title.toUpperCase(), { size: 26, bold: true, color: C.white }),
      ],
    }),
    new Paragraph({
      shading: { fill: C.blueDark, type: ShadingType.CLEAR },
      spacing: { before: 0, after: 160 },
      children: [r("", { size: 6 })],
    }),
  ];
}

function subhead(text) {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.pink } },
    spacing: { before: 200, after: 80 },
    children: [r(text.toUpperCase(), { size: 19, bold: true, color: C.pink })],
  });
}

function callout(text) {
  return new Paragraph({
    shading: { fill: C.blueLight, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.THICK, size: 18, color: C.blue } },
    spacing: { before: 120, after: 120 },
    indent: { left: 300, right: 300 },
    children: [r(text, { italic: true, color: C.dark })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "brenso-bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [r(text)],
  });
}

// ============================================================
// TABLEAUX
// ============================================================

const bBorder = (color = C.greyBorder) => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = { style: BorderStyle.NONE };

// Tableau profil 2 colonnes — header bleu row 0, lignes alternées
function profileTable(rows) {
  return new Table({
    width: { size: PAGE.cw, type: WidthType.DXA },
    columnWidths: [COL1, COL2],
    rows: rows.map(([label, value], i) => {
      const isH = i === 0;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: COL1, type: WidthType.DXA },
            shading: { fill: isH ? C.blue : (i % 2 === 0 ? C.greyLight : C.white), type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 160, right: 120 },
            borders: { top: bBorder(), bottom: bBorder(), left: noBorder, right: bBorder("88C4C8") },
            children: [p([r(label, { bold: true, size: 19, color: isH ? C.white : C.mid })], { spacing: { after: 0 } })],
          }),
          new TableCell({
            width: { size: COL2, type: WidthType.DXA },
            shading: { fill: isH ? C.blueDark : (i % 2 === 0 ? C.white : C.bluePale), type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 160, right: 120 },
            borders: { top: bBorder(), bottom: bBorder(), left: noBorder, right: noBorder },
            children: [p([r(value, { bold: isH, size: 19, color: isH ? C.white : C.dark })], { spacing: { after: 0 } })],
          }),
        ],
      });
    }),
  });
}

// Tableau items 2 colonnes — titre rose | description
// Utilisé pour Compétences clés (8 items) et Besoins fondamentaux (6 items)
function itemListTable(items) {
  return new Table({
    width: { size: PAGE.cw, type: WidthType.DXA },
    columnWidths: [COL_ITEM, COL_DESC],
    rows: items.map(([title, desc], i) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_ITEM, type: WidthType.DXA },
            shading: { fill: i % 2 === 0 ? C.pinkLight : "FDF3F6", type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 160, right: 120 },
            borders: { top: bBorder(), bottom: bBorder(), left: noBorder, right: bBorder("E07090") },
            children: [p([r(title, { bold: true, size: 19, color: C.pink })], { spacing: { after: 0 } })],
          }),
          new TableCell({
            width: { size: COL_DESC, type: WidthType.DXA },
            shading: { fill: i % 2 === 0 ? C.white : C.greyLight, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 160, right: 120 },
            borders: { top: bBorder(), bottom: bBorder(), left: noBorder, right: noBorder },
            children: [p([r(desc, { size: 20 })], { spacing: { after: 0 } })],
          }),
        ],
      })
    ),
  });
}

// Phrase forte — grand cadre rose CF3A65, texte blanc centré (générée par IA)
function phraseForte(text) {
  return [
    blank(200),
    new Paragraph({
      shading: { fill: C.pink, type: ShadingType.CLEAR },
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [r('', { size: 10 })],
    }),
    new Paragraph({
      shading: { fill: C.pink, type: ShadingType.CLEAR },
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      indent: { left: 360, right: 360 },
      children: [r(text, { size: 36, bold: true, color: C.white })],
    }),
    new Paragraph({
      shading: { fill: C.pink, type: ShadingType.CLEAR },
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [r('', { size: 10 })],
    }),
    blank(200),
  ];
}

// Bandeau épilogue rose — Mot du coach (sans numéro)
function epilogueBand(title) {
  return [
    blank(240),
    new Paragraph({
      shading: { fill: C.pink, type: ShadingType.CLEAR },
      spacing: { before: 0, after: 0 },
      indent: { left: 200 },
      children: [r(title.toUpperCase(), { size: 26, bold: true, color: C.white })],
    }),
    new Paragraph({
      shading: { fill: C.pinkDark, type: ShadingType.CLEAR },
      spacing: { before: 0, after: 160 },
      children: [r('', { size: 6 })],
    }),
  ];
}

// Bloc piste orientation (barre gauche rose)
function pisteBlock(num, metier, justification) {
  return [
    blank(160),
    new Paragraph({
      shading: { fill: C.greyLight, type: ShadingType.CLEAR },
      border: { left: { style: BorderStyle.THICK, size: 22, color: C.pink } },
      spacing: { before: 0, after: 0 },
      indent: { left: 280 },
      children: [
        r("PISTE " + num + "  ·  ", { size: 17, bold: true, color: C.pink }),
        r(metier, { size: 22, bold: true, color: C.dark }),
      ],
    }),
    new Paragraph({
      shading: { fill: C.greyLight, type: ShadingType.CLEAR },
      spacing: { before: 0, after: 80 },
      indent: { left: 280, right: 240 },
      children: [r(justification, { italic: true, color: C.mid, size: 20 })],
    }),
  ];
}

// ============================================================
// HEADER / FOOTER — FIGÉS
// ============================================================

const docHeader = new Header({
  children: [
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.blue } },
      spacing: { after: 60 },
      tabStops: [{ type: TabStopType.RIGHT, position: PAGE.cw }],
      children: [
        r("BRENSO", { bold: true, size: 17, color: C.blue }),
        r("  Coaching & Training", { size: 17, color: C.mid }),
        r("\t", { size: 17 }),
        r("Rapport d'orientation", { size: 16, italic: true, color: C.mid }),
      ],
    }),
  ],
});

const docFooter = new Footer({
  children: [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.greyBorder } },
      spacing: { before: 60 },
      tabStops: [{ type: TabStopType.RIGHT, position: PAGE.cw }],
      children: [
        r("Document confidentiel  ·  BRENSO Coaching & Training  ·  Ixelles", { size: 16, color: C.mid }),
        r("\t", { size: 16 }),
        r("p. ", { size: 16, color: C.mid }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.blue, bold: true, font: "Calibri" }),
      ],
    }),
  ],
});

// ============================================================
// DOCUMENT COMPLET
// ============================================================

const doc = new Document({
  numbering: {
    config: [{
      reference: "brenso-bullets",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "›",
        alignment: AlignmentType.LEFT,
        style: {
          run: { font: "Calibri", size: 22, color: C.blue, bold: true },
          paragraph: { indent: { left: 560, hanging: 280 } },
        },
      }],
    }],
  },
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: C.dark } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE.w, height: PAGE.h },
        margin: { top: PAGE.mTop, bottom: PAGE.mBottom, left: PAGE.mLeft, right: PAGE.mRight },
      },
    },
    headers: { default: docHeader },
    footers: { default: docFooter },
    children: [

      // ========================================================
      // PAGE DE COUVERTURE
      // ========================================================
      blank(2000),
      new Paragraph({
        spacing: { after: 0 },
        children: [r("RAPPORT D'ORIENTATION", { size: 46, bold: true, color: C.dark })],
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: C.blue } },
        spacing: { before: 0, after: 320 },
        children: [r("BRENSO Coaching & Training", { size: 22, color: C.blue })],
      }),
      blank(280),
      p([r("Préparé pour", { size: 19, color: C.mid, italic: true })], { spacing: { after: 40 } }),
      p([r("[Prénom Nom]", { size: 38, bold: true, color: C.blue })], { spacing: { after: 120 } }),
      p([r("Date de naissance : ", { size: 19, color: C.mid }), r("[JJ/MM/AAAA]", { size: 19, bold: true })], { spacing: { after: 60 } }),
      p([r("École · Niveau : ", { size: 19, color: C.mid }), r("[Établissement · Classe]", { size: 19, bold: true })], { spacing: { after: 60 } }),
      p([r("Enneagramme : ", { size: 19, color: C.mid }), r("[Type X · Sous-type]", { size: 19, bold: true })], { spacing: { after: 60 } }),
      p([r("MBTI : ", { size: 19, color: C.mid }), r("[Type 4 lettres]", { size: 19, bold: true })], { spacing: { after: 60 } }),
      p([r("RIASEC : ", { size: 19, color: C.mid }), r("[Lettres dominantes]", { size: 19, bold: true })], { spacing: { after: 60 } }),
      blank(500),
      p([r("Coach : ", { size: 19, color: C.mid }), r("Bénédicte Vanden Bossche", { size: 19, bold: true })], { spacing: { after: 60 } }),
      p([r("Date du rapport : ", { size: 19, color: C.mid }), r("[JJ/MM/AAAA]", { size: 19 })], { spacing: { after: 60 } }),


      // ========================================================
      // 01 · PERSONNALITÉ / ENNEAGRAMME
      // ========================================================
      br(),
      ...chapterBand("01", "Personnalité — Enneagramme"),

      subhead("Profil Enneagramme"),
      callout("[Ce que tu dois retenir sur ta personnalité — 1 à 2 phrases qui te parlent directement, en tu.]"),
      blank(80),
      p([
        r("Tu es quelqu'un qui [observation concrète sur la façon d'être de [Prénom] au quotidien — dans les relations, les apprentissages, les choix. En tu.]"),
      ]),
      p([r("[Sous-paragraphe 2 — nuances de ta combinaison base + sous-type. Ce que ça change concrètement pour toi.]")]),
      p([r("[Quelques nuances importantes à garder en tête :]")]),
      bullet("[Tu peux avoir tendance à [trait ou nuance 1 — formulé en tu, phrase complète]]"),
      bullet("[Tu as besoin de [trait ou nuance 2 — en tu]]"),
      bullet("[Tu fonctionnes mieux quand [trait ou nuance 3 — en tu]]"),

      blank(120),
      subhead("Bases & Sous-type"),
      profileTable([
        ["Élément", "Résultat"],
        ["Base dominante (1)", "[Type X — nom de la base]"],
        ["Base d'influence (2)", "[Type X — nom ou — si non sélectionné]"],
        ["Base de coloration (3)", "[Type X — nom ou — si non sélectionné]"],
        ["Sous-type", "[Social / Survie / Tête-à-tête]"],
        ["Pondération indicative", "[65% Type X · 25% Type Y · 10% Type Z]"],
      ]),

      blank(120),
      subhead("Mots-clés de personnalité"),
      bullet("[Mot-clé 1 — trait dominant du profil]"),
      bullet("[Mot-clé 2]"),
      bullet("[Mot-clé 3]"),
      bullet("[Mot-clé 4]"),
      bullet("[Mot-clé 5]"),


      // ========================================================
      // 02 · EN CONTEXTE PROFESSIONNEL (IA)
      // ========================================================
      br(),
      ...chapterBand("02", "En contexte professionnel"),

      callout("[Synthèse IA — comment ton profil se traduit concrètement dans un environnement de travail ou d'études.]"),
      blank(80),

      subhead("Forces clés"),
      p([
        r("[Narration sur tes forces — issues de la combinaison Enneagramme + MBTI. Concrètes, formulées comme comportements observables. En tu.]"),
      ]),
      bullet("[Tu es capable de [force 1 — comportement observable, en tu]]"),
      bullet("[Force 2]"),
      bullet("[Force 3]"),
      bullet("[Force 4]"),

      blank(120),
      subhead("Besoins clés en environnement de travail"),
      p([r("[Ce dont tu as besoin pour fonctionner à ton meilleur — management, structure, autonomie, feedback...]")]),
      bullet("[Tu as besoin d'autonomie dans l'organisation de ton temps — ex. adapte selon le profil]"),
      bullet("[Besoin clé 2]"),
      bullet("[Besoin clé 3]"),


      // ========================================================
      // 03 · COMPÉTENCES / MBTI
      // ========================================================
      br(),
      ...chapterBand("03", "Compétences — MBTI"),

      subhead("Profil MBTI"),
      callout("[Ce que tu dois retenir — ce que ton type MBTI révèle sur ta façon de fonctionner et d'apprendre.]"),
      blank(80),
      p([
        r("[Comment ton type MBTI se manifeste dans tes apprentissages, le travail en groupe, ta prise de décision. En tu.]"),
      ]),
      p([r("[Sous-paragraphe 2 — ce qui t'anime dans un projet ou une discipline. Lien avec ton type MBTI.]")]),

      blank(120),
      subhead("Type & Dimensions"),
      profileTable([
        ["Dimension", "Préférence"],
        ["Énergie", "[E · Extraversion  ou  I · Introversion]"],
        ["Perception", "[S · Sensation  ou  N · Intuition]"],
        ["Jugement", "[T · Pensée  ou  F · Sentiment]"],
        ["Mode de vie", "[J · Jugement  ou  P · Perception]"],
        ["Type résultant", "[Type 4 lettres — ex. ISTP]"],
      ]),

      blank(120),
      subhead("Style d'apprentissage"),
      p([r("[Comment tu apprends le mieux — méthodes, rythme, contexte. Directement lié à ton type MBTI.]")]),
      bullet("[Tu apprends en faisant et en expérimentant — ex. adapte selon le profil]"),
      bullet("[Tu as besoin de voir l'utilité concrète avant de t'engager]"),
      bullet("[Ce qui te freine dans un contexte scolaire classique]"),


      // ========================================================
      // 04 · COMPÉTENCES CLÉS
      // ========================================================
      br(),
      ...chapterBand("04", "Compétences clés"),

      blank(80),
      p([
        r("[Introduction — les 8 compétences clés identifiées pour toi, issues des séances et de tes profils.]"),
      ]),
      blank(120),

      itemListTable([
        ["[Compétence 1]",  "[Description — 1 phrase ancrée dans une observation de séance ou un résultat d'outil.]"],
        ["[Compétence 2]",  "[Description — concrète, formulée comme comportement observable.]"],
        ["[Compétence 3]",  "[Description]"],
        ["[Compétence 4]",  "[Description]"],
        ["[Compétence 5]",  "[Description]"],
        ["[Compétence 6]",  "[Description]"],
        ["[Compétence 7]",  "[Description]"],
        ["[Compétence 8]",  "[Description]"],
      ]),


      // ========================================================
      // 05 · RIASEC — PROFIL D'INTÉRÊTS
      // ========================================================
      br(),
      ...chapterBand("05", "RIASEC — Profil d'intérêts"),

      subhead("Profil dominant"),
      callout("[Ce que tu dois retenir — croisement de tes 2-3 lettres dominantes en 1-2 phrases. Ce que ça révèle sur tes intérêts professionnels.]"),
      blank(80),
      p([
        r("[Narration sur tes lettres dominantes — types de missions, d'environnements, de projets qui te correspondent. En tu.]"),
      ]),
      p([r("[Sous-paragraphe — cohérences et nuances avec ton profil Enneagramme + MBTI.]")]),

      blank(120),
      subhead("Résultats RIASEC"),
      profileTable([
        ["Lettre", "Dimension & Signification pour [Prénom]"],
        ["R · Réaliste",       "[Score ou rang · Ce que ça signifie concrètement]"],
        ["I · Investigateur",  "[Score ou rang · Ce que ça signifie]"],
        ["A · Artistique",     "[Score ou rang · Ce que ça signifie]"],
        ["S · Social",         "[Score ou rang · Ce que ça signifie]"],
        ["E · Entreprenant",   "[Score ou rang · Ce que ça signifie]"],
        ["C · Conventionnel",  "[Score ou rang · Ce que ça signifie]"],
      ]),

      blank(120),
      subhead("Ce que ça implique pour l'orientation"),
      p([r("[Implications concrètes — types de métiers, secteurs, missions qui correspondent à ce profil RIASEC en Belgique.]")]),
      bullet("[Secteur ou type de mission 1]"),
      bullet("[Secteur ou type de mission 2]"),
      bullet("[Secteur ou type de mission 3]"),


      // ========================================================
      // 06 · BESOINS FONDAMENTAUX
      // ========================================================
      br(),
      ...chapterBand("06", "Besoins fondamentaux"),

      blank(80),
      p([
        r("[Introduction — pourquoi ces 6 besoins sont fondamentaux pour toi dans ton choix d'orientation et d'environnement professionnel.]"),
      ]),
      blank(120),

      itemListTable([
        ["[Besoin 1]",  "[En quoi ce besoin est fondamental pour [Prénom] et comment il se manifeste concrètement.]"],
        ["[Besoin 2]",  "[Description ancrée dans les outils et les séances.]"],
        ["[Besoin 3]",  "[Description]"],
        ["[Besoin 4]",  "[Description]"],
        ["[Besoin 5]",  "[Description]"],
        ["[Besoin 6]",  "[Description]"],
      ]),

      blank(120),
      subhead("Ce qui doit être présent"),
      p([r("[Ce qui doit être présent pour que tu t'épanouisses — conditions non négociables.]")]),
      bullet("[Tu as besoin de [condition 1 — indispensable pour toi]]"),
      bullet("[Condition indispensable 2]"),
      bullet("[Condition indispensable 3]"),
      bullet("[Ce qui serait difficile à gérer pour toi — ex. management directif constant]"),


      // ========================================================
      // 07 · PISTES DE MÉTIERS & FORMATIONS
      // ========================================================
      br(),
      ...chapterBand("07", "Pistes de métiers & formations"),

      blank(80),
      p([
        r("[Introduction — relier ton profil global aux pistes retenues. Pourquoi ces métiers correspondent à qui tu es. 2-3 phrases en tu.]"),
      ]),

      // ── Piste 1
      ...pisteBlock("1", "[Nom du métier 1]", "[Justification 2-3 phrases — lien Enneagramme · MBTI · RIASEC · séances]"),
      blank(80),
      subhead("Formation & Écoles"),
      bullet("[École / Université / Haute École — Ville]"),
      bullet("[Alternative ou variante de formation]"),
      subhead("Argumentaire croisé"),
      bullet("[Lien Enneagramme — pourquoi ce métier correspond au type]"),
      bullet("[Lien MBTI — style de travail adapté]"),
      bullet("[Lien RIASEC — intérêts alignés]"),
      subhead("3 actions concrètes"),
      bullet("[Action 1 — immédiate et faisable cette semaine]"),
      bullet("[Action 2 — exploration : rencontre, stage, info session]"),
      bullet("[Action 3 — démarche concrète en Belgique]"),

      // ── Piste 2
      ...pisteBlock("2", "[Nom du métier 2]", "[Justification 2-3 phrases — lien explicite profil]"),
      blank(80),
      subhead("Formation & Écoles"),
      bullet("[École / Université / Haute École — Ville]"),
      bullet("[Alternative ou variante]"),
      subhead("Argumentaire croisé"),
      bullet("[Lien Enneagramme]"),
      bullet("[Lien MBTI]"),
      bullet("[Lien RIASEC]"),
      subhead("3 actions concrètes"),
      bullet("[Action 1]"),
      bullet("[Action 2]"),
      bullet("[Action 3]"),

      // ── Piste 3 (optionnelle)
      ...pisteBlock("3", "[Nom du métier 3]", "[Justification 2-3 phrases]"),
      blank(80),
      subhead("Formation & Écoles"),
      bullet("[École / Université / Haute École — Ville]"),
      bullet("[Alternative ou variante]"),
      subhead("Argumentaire croisé"),
      bullet("[Lien Enneagramme]"),
      bullet("[Lien MBTI]"),
      bullet("[Lien RIASEC]"),
      subhead("3 actions concrètes"),
      bullet("[Action 1]"),
      bullet("[Action 2]"),
      bullet("[Action 3]"),


      // ========================================================
      // 08 · PLAN D'ACTION
      // ========================================================
      br(),
      ...chapterBand("08", "Plan d'action"),

      blank(80),
      p([r("[Texte libre du coach — copié mot à mot depuis le champ Plan d'action (section 08 du questionnaire). Adressé en tu/tes/ton. Pas de reformulation IA.]")]),

      blank(120),
      subhead("Tes valeurs"),
      p([r("[Valeurs identifiées en séance avec toi — issues du questionnaire section 05.]")]),
      bullet("[Valeur 1 — ex. Créativité]"),
      bullet("[Valeur 2]"),
      bullet("[Valeur 3]"),


      // ========================================================
      // MOT DU COACH — texte libre section 09 + phrase forte IA
      // ========================================================
      br(),
      ...epilogueBand("Mot du coach"),

      blank(80),
      p([r("[Texte libre de Bénédicte — copié mot à mot depuis les notes du coach (section 09 du questionnaire). Adressé directement en tu/tes à [Prénom]. Pas de reformulation IA.]")]),

      blank(40),
      p([r("[Deuxième paragraphe si présent dans les notes — supprimer ce paragraphe sinon.]")]),

      ...phraseForte("[Phrase forte générée par l'IA à partir de l'analyse globale du profil — 1 phrase, en tu, mémorisable dans 5 ans.]"),


      // ========================================================
      // PAGE DE CONTACT BRENSO
      // ========================================================
      br(),
      blank(600),

      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.blue } },
        spacing: { before: 0, after: 320 },
        children: [r("BRENSO", { size: 36, bold: true, color: C.blue })],
      }),
      p([r("Coaching & Training", { size: 24, color: C.mid, italic: true })], { spacing: { after: 60 } }),

      blank(200),
      p([r("Bénédicte Vanden Bossche", { size: 22, bold: true })], { spacing: { after: 60 } }),
      p([r("Coach d'orientation certifiée", { size: 20, italic: true, color: C.mid })], { spacing: { after: 60 } }),
      p([r("Ixelles, Belgique", { size: 19, color: C.mid })], { spacing: { after: 60 } }),

      blank(80),
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.greyBorder } },
        spacing: { before: 80, after: 80 },
        children: [r("", { size: 4 })],
      }),

      p([r("www.brenso.be", { size: 19, color: C.blue })], { spacing: { after: 40 } }),
      p([r("contact@brenso.be", { size: 19, color: C.mid })], { spacing: { after: 40 } }),

      blank(400),
      p([r("Ce document est confidentiel. Il est destiné exclusivement à ", { size: 17, color: C.mid })], { spacing: { after: 0 } }),
      p([r("[Prénom Nom] et à ses parents ou représentants légaux.", { size: 17, color: C.mid })], { spacing: { after: 0 } }),

    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/claude/brenso-template.docx", buf);
  console.log("DONE — brenso-template.docx — 8 chapitres + couverture + contact");
});
