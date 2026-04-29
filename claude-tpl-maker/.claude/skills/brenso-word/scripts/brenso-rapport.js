/**
 * BRENSO — Script d'orchestration rapport Word
 * ─────────────────────────────────────────────
 * Usage : node brenso-rapport.js <path-to-questionnaire.json>
 *
 * Ce script :
 * 1. Lit le JSON du questionnaire
 * 2. Charge les 3 fiches sources (Enneagramme, MBTI, RIASEC) depuis les skills
 * 3. Appelle l'API Claude séparément pour chaque chapitre
 *    → avec le bon outil dominant + légères influences des deux autres
 *    → en respectant le word count ±5% défini par le coach
 *    → en passant le contexte des chapitres précédents pour la cohérence
 * 4. Assemble le tout dans le document Word final (design system BRENSO figé)
 */

const fs   = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TabStopType
} = require('docx');

// ── CONFIG ─────────────────────────────────────────────────────────────────

const SKILL_BASE  = path.resolve(__dirname, '..') + '/..'; // adjust if needed
const ENNEA_SKILL = fs.existsSync('/tmp/brenso-enneagramme/SKILL.md')
  ? fs.readFileSync('/tmp/brenso-enneagramme/SKILL.md', 'utf8')
  : '';
const MBTI_SKILL  = fs.existsSync('/tmp/brenso-mbti/SKILL.md')
  ? fs.readFileSync('/tmp/brenso-mbti/SKILL.md', 'utf8')
  : '';
const RIASEC_SKILL = fs.existsSync('/tmp/brenso-riasec/SKILL.md')
  ? fs.readFileSync('/tmp/brenso-riasec/SKILL.md', 'utf8')
  : '';

// ── DESIGN SYSTEM — CONSTANTES ABSOLUES ────────────────────────────────────

const C = {
  blue:      "40A2C0", blueDark:  "2B7A94", blueLight: "E3F4F8", bluePale: "F0F8FB",
  pink:      "CF3A65", pinkDark:  "A02A4E", pinkLight: "FAEAEE",
  dark:      "1D2D35", mid:       "4A6572", greyLight: "F2F5F6",
  greyBorder:"CBD4D7", white:     "FFFFFF",
};
const PAGE = { w:11906, h:16838, mTop:1418, mBottom:1418, mLeft:1701, mRight:1134 };
PAGE.cw = PAGE.w - PAGE.mLeft - PAGE.mRight;
const COL1 = Math.round(PAGE.cw * 0.34), COL2 = PAGE.cw - COL1;
const COL_ITEM = Math.round(PAGE.cw * 0.28), COL_DESC = PAGE.cw - COL_ITEM;

// ── PRIMITIVES DOCX ─────────────────────────────────────────────────────────

const r = (text, opts={}) => new TextRun({text, font:"Calibri", size:22, color:C.dark, ...opts});
const p = (children, opts={}) => new Paragraph({
  spacing:{after:120}, children:Array.isArray(children)?children:[children], ...opts
});
const blank = (before=80) => new Paragraph({spacing:{before,after:0}, children:[r("")]});
const br    = ()           => new Paragraph({children:[new PageBreak()]});
const bBorder = (color=C.greyBorder) => ({style:BorderStyle.SINGLE, size:1, color});
const noBorder = {style:BorderStyle.NONE};

function chapterBand(num, title) {
  return [
    blank(240),
    new Paragraph({
      shading:{fill:C.blue, type:ShadingType.CLEAR}, spacing:{before:0,after:0}, indent:{left:200},
      children:[
        r(num,  {size:20, bold:true, color:"8DD1E4"}),
        r("   ·   ", {size:18, color:"8DD1E4"}),
        r(title.toUpperCase(), {size:26, bold:true, color:C.white}),
      ],
    }),
    new Paragraph({
      shading:{fill:C.blueDark, type:ShadingType.CLEAR}, spacing:{before:0,after:160},
      children:[r("",{size:6})],
    }),
  ];
}

function subhead(text) {
  return new Paragraph({
    border:{bottom:{style:BorderStyle.SINGLE, size:4, color:C.pink}},
    spacing:{before:200, after:80},
    children:[r(text.toUpperCase(), {size:19, bold:true, color:C.pink})],
  });
}

function callout(text) {
  return new Paragraph({
    shading:{fill:C.blueLight, type:ShadingType.CLEAR},
    border:{left:{style:BorderStyle.THICK, size:18, color:C.blue}},
    spacing:{before:120, after:120}, indent:{left:300, right:300},
    children:[r(text, {italic:true, color:C.dark})],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering:{reference:"brenso-bullets", level:0},
    spacing:{before:60, after:60},
    children:[r(text)],
  });
}

function profileTable(rows) {
  return new Table({
    width:{size:PAGE.cw, type:WidthType.DXA}, columnWidths:[COL1,COL2],
    rows: rows.map(([label,value],i) => {
      const isH = i===0;
      return new TableRow({ children:[
        new TableCell({
          width:{size:COL1,type:WidthType.DXA},
          shading:{fill:isH?C.blue:(i%2===0?C.greyLight:C.white), type:ShadingType.CLEAR},
          verticalAlign:VerticalAlign.CENTER,
          margins:{top:80,bottom:80,left:160,right:120},
          borders:{top:bBorder(),bottom:bBorder(),left:noBorder,right:bBorder("88C4C8")},
          children:[p([r(label,{bold:true,size:19,color:isH?C.white:C.mid})],{spacing:{after:0}})],
        }),
        new TableCell({
          width:{size:COL2,type:WidthType.DXA},
          shading:{fill:isH?C.blueDark:(i%2===0?C.white:C.bluePale), type:ShadingType.CLEAR},
          verticalAlign:VerticalAlign.CENTER,
          margins:{top:80,bottom:80,left:160,right:120},
          borders:{top:bBorder(),bottom:bBorder(),left:noBorder,right:noBorder},
          children:[p([r(value,{bold:isH,size:19,color:isH?C.white:C.dark})],{spacing:{after:0}})],
        }),
      ]});
    }),
  });
}

function itemListTable(items) {
  return new Table({
    width:{size:PAGE.cw,type:WidthType.DXA}, columnWidths:[COL_ITEM,COL_DESC],
    rows: items.map(([title,desc],i) => new TableRow({ children:[
      new TableCell({
        width:{size:COL_ITEM,type:WidthType.DXA},
        shading:{fill:i%2===0?C.pinkLight:"FDF3F6", type:ShadingType.CLEAR},
        verticalAlign:VerticalAlign.CENTER,
        margins:{top:100,bottom:100,left:160,right:120},
        borders:{top:bBorder(),bottom:bBorder(),left:noBorder,right:bBorder("E07090")},
        children:[p([r(title,{bold:true,size:19,color:C.pink})],{spacing:{after:0}})],
      }),
      new TableCell({
        width:{size:COL_DESC,type:WidthType.DXA},
        shading:{fill:i%2===0?C.white:C.greyLight, type:ShadingType.CLEAR},
        verticalAlign:VerticalAlign.CENTER,
        margins:{top:100,bottom:100,left:160,right:120},
        borders:{top:bBorder(),bottom:bBorder(),left:noBorder,right:noBorder},
        children:[p([r(desc,{size:20})],{spacing:{after:0}})],
      }),
    ]})),
  });
}

function pisteBlock(num, metier, justification) {
  return [
    blank(160),
    new Paragraph({
      shading:{fill:C.greyLight,type:ShadingType.CLEAR},
      border:{left:{style:BorderStyle.THICK,size:22,color:C.pink}},
      spacing:{before:0,after:0}, indent:{left:280},
      children:[
        r("PISTE "+num+"  ·  ",{size:17,bold:true,color:C.pink}),
        r(metier,{size:22,bold:true,color:C.dark}),
      ],
    }),
    new Paragraph({
      shading:{fill:C.greyLight,type:ShadingType.CLEAR},
      spacing:{before:0,after:80}, indent:{left:280,right:240},
      children:[r(justification,{italic:true,color:C.mid,size:20})],
    }),
  ];
}

function phraseForte(text) {
  return [
    blank(200),
    new Paragraph({shading:{fill:C.pink,type:ShadingType.CLEAR},spacing:{before:0,after:0},children:[r("",{size:10})]}),
    new Paragraph({
      shading:{fill:C.pink,type:ShadingType.CLEAR}, alignment:AlignmentType.CENTER,
      spacing:{before:0,after:0}, indent:{left:360,right:360},
      children:[r(text,{size:36,bold:true,color:C.white})],
    }),
    new Paragraph({shading:{fill:C.pink,type:ShadingType.CLEAR},spacing:{before:0,after:0},children:[r("",{size:10})]}),
    blank(200),
  ];
}

function epilogueBand(title) {
  return [
    blank(240),
    new Paragraph({
      shading:{fill:C.pink,type:ShadingType.CLEAR}, spacing:{before:0,after:0}, indent:{left:200},
      children:[r(title.toUpperCase(),{size:26,bold:true,color:C.white})],
    }),
    new Paragraph({
      shading:{fill:C.pinkDark,type:ShadingType.CLEAR}, spacing:{before:0,after:160},
      children:[r("",{size:6})],
    }),
  ];
}

function buildDocHeader(q) {
  const brandName = q.brand_name || 'BRENSO';
  const subtitle = isAdult(q) ? "Rapport de bilan professionnel" : "Rapport d'orientation";
  return new Header({ children:[
    new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.blue}}, spacing:{after:60},
      tabStops:[{type:TabStopType.RIGHT,position:PAGE.cw}],
      children:[
        r(brandName,{bold:true,size:17,color:C.blue}),
        r("  Coaching & Training",{size:17,color:C.mid}),
        r("\t",{size:17}),
        r(subtitle,{size:16,italic:true,color:C.mid}),
      ],
    }),
  ]});
}

function buildDocFooter(q) {
  const brandName = q.brand_name || 'BRENSO';
  return new Footer({ children:[
    new Paragraph({
      border:{top:{style:BorderStyle.SINGLE,size:2,color:C.greyBorder}}, spacing:{before:60},
      tabStops:[{type:TabStopType.RIGHT,position:PAGE.cw}],
      children:[
        r(`Document confidentiel  ·  ${brandName} Coaching & Training`,{size:16,color:C.mid}),
        r("\t",{size:16}),
        r("p. ",{size:16,color:C.mid}),
        new TextRun({children:[PageNumber.CURRENT],size:16,color:C.blue,bold:true,font:"Calibri"}),
      ],
    }),
  ]});
}

// ── PROFILE BRANCHING (young vs adult) ─────────────────────────────────────

function isAdult(q) { return q && q.profile_type === 'adult'; }

function voiceRule(q) {
  return isAdult(q)
    ? 'TOUJOURS adresser la personne en VOUS (vous, votre, vos)'
    : 'TOUJOURS adresser la personne en TU (tu, tes, ton, toi)';
}

function adultFrame(q) {
  if (!isAdult(q)) return '';
  const sit = Array.isArray(q.situation) ? q.situation.join(', ') : (q.situation || '');
  return `\n\nContexte adulte (à intégrer dans la rédaction) :
- Entreprise actuelle : ${q.entreprise || '—'}
- Rôle / Poste : ${q.role || '—'}
- Situation déclarée : ${sit || '—'}
Le rapport vise un bilan ou repositionnement professionnel — pas une première orientation scolaire. Évite toute référence à l'école, aux études en cours, ou aux parents.`;
}

const TITLES_YOUNG = {
  '01': 'Personnalité — Enneagramme',
  '02': 'En contexte professionnel',
  '03': 'Compétences — MBTI',
  '04': 'Compétences clés',
  '05': 'RIASEC — Profil d’intérêts',
  '06': 'Besoins fondamentaux',
  '07': 'Pistes de métiers & formations',
  '08': 'Plan d’action',
};
const TITLES_ADULT = {
  '01': 'Personnalité — Enneagramme',
  '02': 'Dans votre contexte professionnel',
  '03': 'Compétences — MBTI',
  '04': 'Compétences clés',
  '05': 'RIASEC — Profil d’intérêts',
  '06': 'Besoins fondamentaux',
  '07': 'Pistes de transition & repositionnement',
  '08': 'Plan de transition professionnelle',
};
function chapterTitleFor(num, q) {
  return (isAdult(q) ? TITLES_ADULT : TITLES_YOUNG)[num];
}

// ── API CLAUDE ──────────────────────────────────────────────────────────────

const ANTHROPIC_BASE_URL = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "");
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  let text = data.content[0].text.trim();
  // Strip markdown code fences if the model wraps JSON in ```json ... ```
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
  return text;
}

// ── PROMPT BUILDER ───────────────────────────────────────────────────────────

function buildSystemPrompt(q, dominant, fiches, wordTarget, chapterName, context) {
  const min = Math.round(wordTarget * 0.95);
  const max = Math.round(wordTarget * 1.05);

  const ficheLabels = { ennea: "Enneagramme", mbti: "MBTI", riasec: "RIASEC" };
  const others = Object.keys(fiches).filter(k => k !== dominant);
  const reportKind = isAdult(q) ? "bilan / repositionnement professionnel" : "rapport d'orientation personnalisé";

  const brandName = q.brand_name || 'BRENSO';
  const coachName = q.coach_name || 'Bénédicte Vanden Bossche';
  return `Tu es un expert en bilan d'orientation pour ${brandName} Coaching & Training (${coachName}, Ixelles).

Tu génères du contenu pour le chapitre "${chapterName}" d'un ${reportKind}.

## Outil DOMINANT pour ce chapitre : ${ficheLabels[dominant]}
La fiche ci-dessous est ta source principale. Elle structure l'essentiel du contenu.

${fiches[dominant]}

## Outils à légère influence : ${others.map(k => ficheLabels[k]).join(" et ")}
Ces fiches nuancent LÉGÈREMENT le contenu. Maximum 1-2 formulations par section.
Elles ne contredisent JAMAIS l'outil dominant sur les besoins fondamentaux.

${others.map(k => `### ${ficheLabels[k]}\n${fiches[k]}`).join("\n\n")}

## Règles de rédaction
- ${voiceRule(q)}
- TOUJOURS utiliser le prénom fourni dans les données
- Phrases complètes, prose narrative — pas de listes sèches
- Ton chaleureux, direct, orienté action
- Ancré dans les données réelles — jamais générique
- Respecter STRICTEMENT le nombre de mots : entre ${min} et ${max} mots au total pour ce chapitre

## Contexte des chapitres déjà rédigés (pour la cohérence)
${context || "Aucun chapitre précédent."}

## Format de réponse
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks.
La structure exacte attendue est décrite dans le prompt utilisateur.`;
}

// ── CHAPTER GENERATORS ──────────────────────────────────────────────────────

async function genChapter01(q, fiches, context) {
  const base1 = q.ennea_bases[0] || "";
  const base2 = q.ennea_bases[1] || "";
  const sousType = q.ennea_soustype || "";
  const words = q.words_ennea || 250;

  const system = buildSystemPrompt(q, "ennea", {
    ennea: `FICHE BASE ${base1} + SOUS-TYPE ${sousType}\n\n` +
           `Pondération : Base ${base1} = dominant (${base2 ? "70%" : "100%"}), ` +
           `${base2 ? `Base ${base2} = 25%, ` : ""}${q.ennea_bases[2] ? `Base ${q.ennea_bases[2]} = 10%` : ""}`,
    mbti:  `Type principal : ${q.mbti[0] || "?"} (très légère influence sur 1 formulation max)`,
    riasec:`Lettre dominante : ${q.riasec[0] || "?"} (très légère influence sur 1 formulation max)`,
  }, words, "01 · Personnalité — Enneagramme", context);

  const user = `${adultFrame(q)}
Données du questionnaire :
Prénom : ${q.prenom}
Enneagramme bases : ${q.ennea_bases.join(", ")} | Sous-type : ${sousType}
MBTI : ${q.mbti} | RIASEC : ${q.riasec}

Génère le contenu du chapitre 01 Personnalité.

Retourne ce JSON exact :
{
  "callout": "1-2 phrases percutantes sur la personnalité de ${q.prenom}",
  "para1": "sous-paragraphe 1 — observation concrète (2-4 phrases)",
  "para2": "sous-paragraphe 2 — nuances base + sous-type (2-4 phrases)",
  "intro_bullets": "phrase d'intro avant les bullets",
  "bullets": ["trait 1", "trait 2", "trait 3"],
  "table_rows": [
    ["Base dominante (1)", "Type + nom"],
    ["Base d'influence (2)", "Type + nom ou —"],
    ["Base de coloration (3)", "Type + nom ou —"],
    ["Sous-type", "${sousType}"],
    ["Pondération indicative", "XX% Type X · YY% Type Y"]
  ],
  "mots_cles": ["mot1", "mot2", "mot3", "mot4", "mot5"]
}`;

  const raw = await callClaude(system, user);
  return JSON.parse(raw);
}

async function genChapter02(q, fiches, context) {
  const words = Math.round((q.words_ennea || 250) * 0.8);
  const system = buildSystemPrompt(q, "ennea", {
    ennea: `Base ${q.ennea_bases[0]} dominant — forces et besoins pro`,
    mbti:  `Type ${q.mbti} — légère influence sur le style de travail`,
    riasec:`Lettre ${q.riasec[0]} — légère influence sur l'environnement`,
  }, words, "02 · En contexte professionnel", context);

  const user = `${adultFrame(q)}
Prénom : ${q.prenom}
Retourne ce JSON :
{
  "callout": "synthèse IA — comment le profil se traduit en contexte pro (1-2 phrases en tu)",
  "forces_intro": "narration intro forces (2-3 phrases)",
  "forces": ["force 1", "force 2", "force 3", "force 4"],
  "besoins_intro": "intro besoins pro (1-2 phrases)",
  "besoins": ["besoin 1", "besoin 2", "besoin 3"]
}`;

  return JSON.parse(await callClaude(system, user));
}

async function genChapter03(q, fiches, context) {
  const words = q.words_mbti || 250;
  const system = buildSystemPrompt(q, "mbti", {
    mbti:  `Type complet : ${q.mbti} — dominant`,
    ennea: `Base ${q.ennea_bases[0]} — légère influence sur les besoins`,
    riasec:`Lettre ${q.riasec[0]} — très légère influence sur les secteurs`,
  }, words, "03 · Compétences — MBTI", context);

  const user = `${adultFrame(q)}
Prénom : ${q.prenom} | MBTI : ${q.mbti}
Retourne ce JSON :
{
  "callout": "ce que le type MBTI révèle sur ${q.prenom} (1-2 phrases percutantes, en tu)",
  "para1": "comment le type se manifeste dans les apprentissages et la prise de décision (3-4 phrases)",
  "para2": "ce qui anime ${q.prenom} dans un projet — lien type MBTI (2-3 phrases)",
  "table_rows": [
    ["Énergie", "E/I + explication courte"],
    ["Perception", "N/S + explication courte"],
    ["Jugement", "T/F + explication courte"],
    ["Mode de vie", "J/P + explication courte"],
    ["Type résultant", "${q.mbti} + nom"]
  ],
  "apprentissage_intro": "comment tu apprends le mieux (1-2 phrases)",
  "apprentissage": ["style 1", "style 2", "${isAdult(q) ? 'ce qui ralentit votre apprentissage en formation classique' : 'ce qui te freine en contexte scolaire classique'}"]
}`;

  return JSON.parse(await callClaude(system, user));
}

async function genChapter04(q, fiches, context) {
  const words = q.words_comp_besoins || 250;
  const system = buildSystemPrompt(q, "mbti", {
    mbti:  `Type ${q.mbti} — dominant pour les compétences`,
    ennea: `Base ${q.ennea_bases[0]} — légère influence`,
    riasec:`Lettre ${q.riasec[0]} — très légère influence`,
  }, words, "04 · Compétences clés", context);

  const user = `${adultFrame(q)}
Prénom : ${q.prenom}
Compétences saisies par le coach : ${(q.competences||[]).join(", ") || "non renseignées — à déduire du profil"}
Retourne ce JSON :
{
  "intro": "intro 2-3 phrases sur les compétences clés de ${q.prenom}",
  "items": [
    ["Titre compétence 1", "description 1 phrase concrète"],
    ["Titre compétence 2", "description"],
    ["Titre compétence 3", "description"],
    ["Titre compétence 4", "description"],
    ["Titre compétence 5", "description"],
    ["Titre compétence 6", "description"],
    ["Titre compétence 7", "description"],
    ["Titre compétence 8", "description"]
  ]
}`;

  return JSON.parse(await callClaude(system, user));
}

async function genChapter05(q, fiches, context) {
  const words = q.words_riasec || 200;
  const system = buildSystemPrompt(q, "riasec", {
    riasec:`Lettres : ${q.riasec} — lettre 1 dominante`,
    ennea: `Base ${q.ennea_bases[0]} — légère influence sur les besoins`,
    mbti:  `Type ${q.mbti} — très légère influence`,
  }, words, "05 · RIASEC", context);

  const user = `${adultFrame(q)}
Prénom : ${q.prenom} | RIASEC : ${q.riasec}
Retourne ce JSON :
{
  "callout": "croisement des lettres dominantes — ce que ça révèle sur ${q.prenom} (1-2 phrases, en tu)",
  "para1": "narration lettres dominantes — types de missions et environnements (3-4 phrases)",
  "para2": "cohérences avec le profil Enneagramme et MBTI (2-3 phrases)",
  "table_rows": [
    ["R · Réaliste", "rang/score + signification pour toi"],
    ["I · Investigateur", "rang/score + signification"],
    ["A · Artistique", "rang/score + signification"],
    ["S · Social", "rang/score + signification"],
    ["E · Entreprenant", "rang/score + signification"],
    ["C · Conventionnel", "rang/score + signification"]
  ],
  "implications_intro": "ce que ça implique pour ton orientation (1-2 phrases)",
  "implications": ["secteur ou mission 1", "secteur ou mission 2", "secteur ou mission 3"]
}`;

  return JSON.parse(await callClaude(system, user));
}

async function genChapter06(q, fiches, context) {
  const words = q.words_comp_besoins || 250;
  const system = buildSystemPrompt(q, "ennea", {
    ennea: `Base ${q.ennea_bases[0]} — dominant pour les besoins fondamentaux`,
    mbti:  `Type ${q.mbti} — légère influence`,
    riasec:`Lettre ${q.riasec[0]} — légère influence sur l'environnement`,
  }, words, "06 · Besoins fondamentaux", context);

  const user = `${adultFrame(q)}
Prénom : ${q.prenom}
Besoins saisis par le coach : ${(q.besoins||[]).join(", ") || "non renseignés — à déduire du profil"}
Retourne ce JSON :
{
  "intro": "introduction 2-3 phrases sur pourquoi ces 6 besoins sont fondamentaux pour ${q.prenom}",
  "items": [
    ["Nom besoin 1", "description 1 phrase — en quoi c'est fondamental pour toi"],
    ["Nom besoin 2", "description"],
    ["Nom besoin 3", "description"],
    ["Nom besoin 4", "description"],
    ["Nom besoin 5", "description"],
    ["Nom besoin 6", "description"]
  ],
  "checklist_intro": "ce qui doit être présent pour toi (1-2 phrases)",
  "checklist": ["condition 1", "condition 2", "condition 3", "ce qui serait difficile à gérer"]
}`;

  return JSON.parse(await callClaude(system, user));
}

async function genChapter07(q, fiches, context) {
  const words = q.words_metiers || 250;
  const system = buildSystemPrompt(q, "riasec", {
    riasec:`Lettres ${q.riasec} — dominant pour les pistes métiers`,
    ennea: `Base ${q.ennea_bases[0]} — légère influence sur l'argumentaire`,
    mbti:  `Type ${q.mbti} — légère influence sur le style de travail`,
  }, words, "07 · Pistes métiers & formations", context);

  const metiersCoach = (q.metiers||[]).map(m =>
    `${m.nom}${m.motscles ? " ("+m.motscles+")" : ""}` +
    (m.formations?.length ? " | Formations: " + m.formations.map(f=>f.ecole+(f.ville?" – "+f.ville:"")).join(", ") : "")
  ).join("\n");

  const user = `${adultFrame(q)}
Prénom : ${q.prenom}
Pistes du coach :\n${metiersCoach || "Non renseignées — à déduire du profil RIASEC/Enneagramme/MBTI"}

Retourne ce JSON avec exactement ${(q.metiers||[]).length || 2} pistes :
{
  "intro": "narration intro 2-3 phrases reliant le profil global aux pistes (en tu)",
  "pistes": [
    {
      "num": "1",
      "metier": "Nom du métier",
      "justification": "2-3 phrases — lien RIASEC + Enneagramme + MBTI + séances",
      "formations": ["École 1 – Ville", "École 2 – Ville"],
      "argumentaire": {
        "riasec": "lien lettre dominante",
        "ennea": "lien base dominante",
        "mbti": "lien type MBTI"
      },
      "actions": ["action concrète 1", "action concrète 2", "action concrète 3"]
    }
  ]
}`;

  return JSON.parse(await callClaude(system, user));
}

async function genChapter08(q) {
  return {
    texte: q.plan_action || "Aucun plan d'action renseigné lors de cette séance. Les actions concrètes figurent dans chaque piste métier ci-dessus.",
    valeurs: q.valeurs || [],
  };
}

async function genEpilogue(q, context) {
  const voiceTag = isAdult(q) ? "en vous" : "en tu";
  const system = `Tu es ${q.coach_name || 'Bénédicte Vanden Bossche'}, coach d'orientation ${q.brand_name || 'BRENSO'}.
Tu génères le mot de clôture et une phrase forte pour ${q.prenom}.
${voiceRule(q)}
La phrase forte est mémorisable, ${voiceTag}, issue de l'analyse globale du profil.
Elle doit pouvoir être relue dans 5 ans et rester vraie.
${adultFrame(q)}

Contexte du rapport complet :
${context}`;

  const user = `Notes du coach (à transcrire mot à mot si présentes) :
"${q.notes || ""}"

Retourne ce JSON :
{
  "para1": "premier paragraphe du mot du coach — si notes présentes, les transcrire, sinon rédiger en cohérence avec le profil (3-5 phrases, ${voiceTag}, adressé directement à ${q.prenom})",
  "para2": "deuxième paragraphe optionnel — observations finales (2-3 phrases ou vide si non pertinent)",
  "phrase_forte": "UNE phrase forte, ${voiceTag}, mémorisable dans 5 ans — générée depuis l'analyse globale"
}`;

  return JSON.parse(await callClaude(system, user));
}

// ── ASSEMBLAGE WORD ──────────────────────────────────────────────────────────

function buildDocument(q, chapters) {
  const { ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, epilogue } = chapters;
  const prenom = q.prenom;
  const brandName = q.brand_name || 'BRENSO';
  const coachName = q.coach_name || 'Bénédicte Vanden Bossche';
  const dateRapport = new Date().toLocaleDateString('fr-BE', {day:'2-digit',month:'long',year:'numeric'});

  const children = [

    // ── COUVERTURE
    blank(2000),
    new Paragraph({spacing:{after:0}, children:[r(isAdult(q) ? "RAPPORT DE BILAN PROFESSIONNEL" : "RAPPORT D'ORIENTATION",{size:46,bold:true,color:C.dark})]}),
    new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:10,color:C.blue}},
      spacing:{before:0,after:320},
      children:[r(brandName+" Coaching & Training",{size:22,color:C.blue})],
    }),
    blank(280),
    p([r("Préparé pour",{size:19,color:C.mid,italic:true})],{spacing:{after:40}}),
    p([r(prenom+" "+q.nom,{size:38,bold:true,color:C.blue})],{spacing:{after:120}}),
    p([r("Date de naissance : ",{size:19,color:C.mid}),r(q.anniversaire+(q.age?" ("+q.age+" ans)":""),{size:19,bold:true})],{spacing:{after:60}}),
    ...(isAdult(q) ? [
      p([r("Entreprise : ",{size:19,color:C.mid}),r(q.entreprise||"—",{size:19,bold:true})],{spacing:{after:60}}),
      p([r("Rôle : ",{size:19,color:C.mid}),r(q.role||"—",{size:19,bold:true})],{spacing:{after:60}}),
    ] : [
      p([r("Formation : ",{size:19,color:C.mid}),r(q.ecole||"—",{size:19,bold:true})],{spacing:{after:60}}),
    ]),
    p([r("Enneagramme : ",{size:19,color:C.mid}),r("Base "+q.ennea_bases.join(" · ")+" · "+q.ennea_soustype,{size:19,bold:true})],{spacing:{after:60}}),
    p([r("MBTI : ",{size:19,color:C.mid}),r(q.mbti,{size:19,bold:true})],{spacing:{after:60}}),
    p([r("RIASEC : ",{size:19,color:C.mid}),r(q.riasec,{size:19,bold:true})],{spacing:{after:60}}),
    blank(400),
    p([r("Coach : ",{size:19,color:C.mid}),r(coachName,{size:19,bold:true})],{spacing:{after:60}}),
    p([r("Date du rapport : ",{size:19,color:C.mid}),r(dateRapport,{size:19})],{spacing:{after:60}}),

    // ── 01 PERSONNALITÉ
    br(), ...chapterBand("01", chapterTitleFor("01", q)),
    subhead("Profil Enneagramme"),
    callout(ch01.callout),
    blank(80),
    p([r(ch01.para1)]),
    p([r(ch01.para2)]),
    p([r(ch01.intro_bullets)]),
    ...ch01.bullets.map(b => bullet(b)),
    blank(120),
    subhead("Bases & Sous-type"),
    profileTable([["Élément","Résultat"], ...ch01.table_rows]),
    blank(120),
    subhead("Mots-clés de personnalité"),
    ...ch01.mots_cles.map(m => bullet(m)),

    // ── 02 CONTEXTE PRO
    br(), ...chapterBand("02", chapterTitleFor("02", q)),
    callout(ch02.callout),
    blank(80),
    subhead("Tes forces clés"),
    p([r(ch02.forces_intro)]),
    ...ch02.forces.map(f => bullet(f)),
    blank(120),
    subhead("Tes besoins clés en environnement de travail"),
    p([r(ch02.besoins_intro)]),
    ...ch02.besoins.map(b => bullet(b)),

    // ── 03 MBTI
    br(), ...chapterBand("03", chapterTitleFor("03", q)),
    subhead("Ton profil MBTI"),
    callout(ch03.callout),
    blank(80),
    p([r(ch03.para1)]),
    p([r(ch03.para2)]),
    blank(120),
    subhead("Type & Dimensions"),
    profileTable([["Dimension","Préférence"], ...ch03.table_rows]),
    blank(120),
    subhead("Ton style d'apprentissage"),
    p([r(ch03.apprentissage_intro)]),
    ...ch03.apprentissage.map(a => bullet(a)),

    // ── 04 COMPÉTENCES CLÉS
    br(), ...chapterBand("04", chapterTitleFor("04", q)),
    blank(80),
    p([r(ch04.intro)]),
    blank(120),
    itemListTable(ch04.items),

    // ── 05 RIASEC
    br(), ...chapterBand("05", chapterTitleFor("05", q)),
    subhead("Ton profil dominant"),
    callout(ch05.callout),
    blank(80),
    p([r(ch05.para1)]),
    p([r(ch05.para2)]),
    blank(120),
    subhead("Tes résultats RIASEC"),
    profileTable([["Lettre","Dimension & Signification pour toi"], ...ch05.table_rows]),
    blank(120),
    subhead("Ce que ça implique pour ton orientation"),
    p([r(ch05.implications_intro)]),
    ...ch05.implications.map(i => bullet(i)),

    // ── 06 BESOINS FONDAMENTAUX
    br(), ...chapterBand("06", chapterTitleFor("06", q)),
    blank(80),
    p([r(ch06.intro)]),
    blank(120),
    itemListTable(ch06.items),
    blank(120),
    subhead("Ce qui doit être présent"),
    p([r(ch06.checklist_intro)]),
    ...ch06.checklist.map(c => bullet(c)),

    // ── 07 PISTES
    br(), ...chapterBand("07", chapterTitleFor("07", q)),
    blank(80),
    p([r(ch07.intro)]),
    ...(ch07.pistes || []).flatMap(piste => [
      ...pisteBlock(piste.num, piste.metier, piste.justification),
      blank(80),
      subhead("Formation & Écoles"),
      ...(piste.formations||[]).map(f => bullet(f)),
      subhead("Argumentaire croisé"),
      bullet(piste.argumentaire.riasec),
      bullet(piste.argumentaire.ennea),
      bullet(piste.argumentaire.mbti),
      subhead("3 actions concrètes"),
      ...(piste.actions||[]).map(a => bullet(a)),
    ]),

    // ── 08 PLAN D'ACTION
    br(), ...chapterBand("08", chapterTitleFor("08", q)),
    blank(80),
    p([r(ch08.texte)]),
    ...(ch08.valeurs.length ? [
      blank(120),
      subhead("Tes valeurs"),
      p([r("Ces valeurs ont été identifiées en séance et guident tes choix d'orientation.")]),
      ...ch08.valeurs.map(v => bullet(v)),
    ] : []),

    // ── MOT DU COACH
    br(), ...epilogueBand("Mot du coach"),
    blank(80),
    p([r(epilogue.para1)]),
    ...(epilogue.para2 ? [blank(40), p([r(epilogue.para2)])] : []),
    ...phraseForte(epilogue.phrase_forte),

    // ── CONTACT
    br(), blank(600),
    new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.blue}},
      spacing:{before:0,after:320},
      children:[r(brandName,{size:36,bold:true,color:C.blue})],
    }),
    p([r("Coaching & Training",{size:24,color:C.mid,italic:true})],{spacing:{after:60}}),
    blank(200),
    p([r(coachName,{size:22,bold:true})],{spacing:{after:60}}),
    // p([r("Coach d'orientation certifiée",{size:20,italic:true,color:C.mid})],{spacing:{after:60}}),
    // p([r("Ixelles, Belgique",{size:19,color:C.mid})],{spacing:{after:60}}),
    blank(80),
    // new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:2,color:C.greyBorder}},spacing:{before:80,after:80},children:[r("",{size:4})]}),
    // p([r("www.brenso.be",{size:19,color:C.blue})],{spacing:{after:40}}),
    // p([r("contact@brenso.be",{size:19,color:C.mid})],{spacing:{after:40}}),
    // blank(400),
    p([r("Ce document est confidentiel. Il est destiné exclusivement à ",{size:17,color:C.mid})],{spacing:{after:0}}),
    p([r(prenom+" "+q.nom+(isAdult(q) ? "." : " et à ses parents ou représentants légaux."),{size:17,color:C.mid})],{spacing:{after:0}}),
  ];

  return new Document({
    numbering: { config:[{ reference:"brenso-bullets", levels:[{
      level:0, format:LevelFormat.BULLET, text:"›", alignment:AlignmentType.LEFT,
      style:{ run:{font:"Calibri",size:22,color:C.blue,bold:true}, paragraph:{indent:{left:560,hanging:280}} },
    }]}] },
    styles:{ default:{ document:{ run:{font:"Calibri",size:22,color:C.dark} } } },
    sections:[{
      properties:{ page:{ size:{width:PAGE.w,height:PAGE.h}, margin:{top:PAGE.mTop,bottom:PAGE.mBottom,left:PAGE.mLeft,right:PAGE.mRight} } },
      headers:{ default:buildDocHeader(q) },
      footers:{ default:buildDocFooter(q) },
      children,
    }],
  });
}

// ── ASSEMBLAGE HTML (rapport magazine, design = magazine.html) ──────────────
// Same chapter content as the DOCX, rendered into the editorial layout from
// claude-tpl-maker/magazine.html. Returns a self-contained HTML string with
// inline CSS; the only external resource is the Google Fonts <link>.

const MAGAZINE_HTML_PATH = path.resolve(__dirname, '..', '..', '..', '..', 'magazine.html');

function loadMagazineAssets() {
  const tpl = fs.readFileSync(MAGAZINE_HTML_PATH, 'utf8');
  const cssMatch = tpl.match(/<style>([\s\S]*?)<\/style>/);
  const linkMatch = tpl.match(/<link[^>]+fonts\.googleapis[^>]+>/);
  return {
    css: cssMatch ? cssMatch[1] : '',
    fontLink: linkMatch ? linkMatch[0] : '',
  };
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const RIASEC_NAMES = {
  R: 'Réaliste',
  I: 'Investigateur',
  A: 'Artistique',
  S: 'Social',
  E: 'Entreprenant',
  C: 'Conventionnel',
};

function htmlMonthYear(d) {
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return `${months[d.getMonth()].charAt(0).toUpperCase()}${months[d.getMonth()].slice(1)} ${d.getFullYear()}`;
}

function htmlFullDate(d) {
  return d.toLocaleDateString('fr-BE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function buildHtml(q, chapters) {
  const { ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, epilogue } = chapters;
  const H = escapeHtml;
  const { css, fontLink } = loadMagazineAssets();

  const prenom = q.prenom;
  const nom = q.nom || '';
  const brandName = q.brand_name || 'BRENSO';
  const coachName = q.coach_name || 'Bénédicte Vanden Bossche';
  const today = new Date();
  const dateRapport = htmlFullDate(today);
  const monthYear = htmlMonthYear(today);
  const initial = (prenom || '?').charAt(0).toUpperCase();
  const enneaBase1 = q.ennea_bases?.[0] || '?';
  const sousType = q.ennea_soustype || '';
  const mbti = q.mbti || '';
  const riasec = q.riasec || '';
  const riasecLetter = riasec.charAt(0);
  const riasecName = RIASEC_NAMES[riasecLetter] || '';
  const trackLabel = isAdult(q) ? 'Coaching adulte' : 'Coaching jeune';
  const reportTitle = isAdult(q) ? 'Rapport de bilan professionnel' : "Rapport d'orientation";

  // ── Spread helpers ──
  const renderBullets = (arr, liStyle = '') =>
    (arr || []).map(b => liStyle ? `<li style="${liStyle}"><span style="color:var(--sand);font-size:1.2rem;font-weight:700;">›</span>${H(b)}</li>` : `<li>${H(b)}</li>`).join('');

  const renderTableRows = (rows) =>
    (rows || []).map(([k, v]) => `<tr><td>${H(k)}</td><td>${H(v)}</td></tr>`).join('');

  const renderKeywords = (arr) =>
    (arr || []).map(k => `<span class="keyword">${H(k)}</span>`).join('');

  // ── SPREAD 00 — COVER ──
  const sCover = `
<section class="spread-cover">
  <div class="cover-masthead">
    <div>
      <div class="cover-masthead-logo">${H(brandName)}</div>
      <div class="cover-masthead-sub">Coaching &amp; Training · Ixelles</div>
    </div>
    <div class="cover-masthead-right">
      ${H(reportTitle)}<br>
      ${H(dateRapport)}<br>
      Document confidentiel
    </div>
  </div>

  <div class="cover-hero">
    <div class="cover-bg-numeral">${H(initial)}</div>
    <div class="cover-kicker">${H(reportTitle)} personnalisé</div>
    <h1 class="cover-title">
      ${isAdult(q) ? 'Rapport<br><em>de bilan</em>' : `Rapport<br><em>d'orientation</em>`}
    </h1>
    <div class="cover-rule"></div>
    <div class="cover-name">
      Préparé pour <span>${H(prenom)}</span><br>
      Base ${H(enneaBase1)} · ${H(mbti)} · ${H(riasec)}
    </div>
  </div>

  <div class="cover-footer">
    <div class="cover-tags">
      <span class="cover-tag accent">Base ${H(enneaBase1)}</span>
      ${sousType ? `<span class="cover-tag">${H(sousType)}</span>` : ''}
      <span class="cover-tag accent">${H(mbti)}</span>
      ${riasecLetter ? `<span class="cover-tag accent">${H(riasecLetter)} · ${H(riasecName)}</span>` : ''}
    </div>
    <div class="cover-date">${H(monthYear)} · ${H(trackLabel)}</div>
  </div>
</section>`;

  // ── SPREAD 01 — PERSONNALITÉ ──
  const sPersonality = `
<section class="spread-01">
  <div class="s01-left">
    <div>
      <div class="chapter-index">01 — ${H(chapterTitleFor('01', q))}</div>
      <h2 class="chapter-title-huge">${H(ch01.callout?.split(' ').slice(0, 3).join(' ') || 'Personnalité')}<br><em>${H(ch01.callout?.split(' ').slice(3, 7).join(' ') || '')}</em></h2>
    </div>
    <div class="callout-box"><p>${H(ch01.callout)}</p></div>
    <div>
      <p class="body-text">${H(ch01.para1)}</p>
      <p class="body-text">${H(ch01.para2)}</p>
      ${ch01.intro_bullets ? `<p class="body-text">${H(ch01.intro_bullets)}</p>` : ''}
      <ul class="bullet-list">${renderBullets(ch01.bullets)}</ul>
    </div>
  </div>
  <div class="s01-right">
    <div class="chapter-index" style="color:rgba(245,240,232,0.3);">Enneagramme</div>
    <table class="profile-table">
      <tr><td>Élément</td><td>Résultat</td></tr>
      ${renderTableRows(ch01.table_rows)}
    </table>
    <div class="keywords">${renderKeywords(ch01.mots_cles)}</div>
  </div>
</section>`;

  // ── SPREAD 02 — CONTEXTE PRO ──
  const liWarm = 'border-bottom-color:rgba(200,130,80,0.1);color:rgba(232,213,183,0.7);';
  const sContextPro = `
<section class="spread-02">
  <div class="s02-header">
    <h2 class="s02-title">${isAdult(q) ? 'Dans votre<br><em>contexte pro</em>' : 'En contexte<br><em>professionnel</em>'}</h2>
    <div class="label" style="color:rgba(200,169,110,0.4);">02 — ${H(chapterTitleFor('02', q))}</div>
  </div>
  <div class="s02-body">
    <div class="callout-box-warm"><p>${H(ch02.callout)}</p></div>
    <p class="body-text" style="color:rgba(232,213,183,0.65);margin-top:1.5rem;">${H(ch02.forces_intro)}</p>
    <ul class="bullet-list">${renderBullets(ch02.forces, liWarm)}</ul>
  </div>
  <div>
    <div class="stat-block">
      <span class="stat-number">${(ch02.besoins || []).length || 3}</span>
      <span class="stat-label">besoins clés non négociables</span>
    </div>
    <p class="body-text" style="color:rgba(232,213,183,0.65);margin-bottom:1rem;">${H(ch02.besoins_intro)}</p>
    <ul class="bullet-list">${renderBullets(ch02.besoins, liWarm)}</ul>
  </div>
</section>`;

  // ── SPREAD 03 — MBTI ──
  const liGreen = 'border-bottom-color:rgba(122,232,154,0.08);color:rgba(122,232,154,0.65);';
  const greenChevron = '<span style="color:#7AE89A;font-size:1.2rem;font-weight:700;">›</span>';
  const renderGreenBullets = (arr) =>
    (arr || []).map(b => `<li style="${liGreen}">${greenChevron}${H(b)}</li>`).join('');
  const sMbti = `
<section class="spread-03">
  <div class="terminal-header">
    <span>${H(brandName)}://rapport/</span>03-mbti.profile — type: ${H(mbti)}
  </div>
  <div class="s03-grid">
    <div>
      <h2 class="terminal-title">${H(chapterTitleFor('03', q))}<br><em>MBTI</em></h2>
      <div class="callout-terminal"><p>${H(ch03.callout)}</p></div>
      <p class="body-text" style="color:rgba(122,232,154,0.55);">${H(ch03.para1)}</p>
      <p class="body-text" style="color:rgba(122,232,154,0.55);">${H(ch03.para2)}</p>
      ${ch03.apprentissage_intro || ch03.apprentissage ? `
      <div class="s03-bullets">
        ${ch03.apprentissage_intro ? `<p class="body-text" style="color:rgba(122,232,154,0.55);margin-top:1rem;">${H(ch03.apprentissage_intro)}</p>` : ''}
        <ul class="bullet-list">${renderGreenBullets(ch03.apprentissage)}</ul>
      </div>` : ''}
    </div>
    <div>
      <div class="chapter-index" style="color:rgba(122,232,154,0.3);margin-bottom:2rem;">Dimensions typologiques</div>
      <table class="dim-table">
        <tr><td>Dimension</td><td>Préférence</td></tr>
        ${renderTableRows(ch03.table_rows)}
      </table>
    </div>
  </div>
</section>`;

  // ── SPREAD 04 — COMPÉTENCES CLÉS ──
  const skillCells = (ch04.items || []).slice(0, 8).map(([title, desc], i) => `
    <div class="skill-cell">
      <div class="skill-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="skill-title">${H(title)}</div>
      <p class="skill-desc">${H(desc)}</p>
    </div>`).join('');
  const sSkills = `
<section class="spread-04">
  <div class="s04-header">
    <h2 class="s04-title">${H(chapterTitleFor('04', q))}<br><em>clés</em></h2>
    <div class="label">04 — Ce que ${isAdult(q) ? 'vous faites' : 'tu fais'} naturellement bien</div>
  </div>
  <p class="drop-cap-intro">${H(ch04.intro)}</p>
  <div class="skills-grid">${skillCells}</div>
</section>`;

  // ── SPREAD 05 — RIASEC ──
  const renderRiasecRows = (rows) => {
    return (rows || []).map((row, i) => {
      const [labelRaw, desc] = row;
      const m = String(labelRaw).match(/^([A-Z])\s*[·•-]\s*(.*)$/);
      const letter = m ? m[1] : (labelRaw || '').charAt(0);
      const name = m ? m[2].trim() : labelRaw;
      const dim = i >= 2 ? ' dim' : '';
      const opacity = i >= 3 ? 'style="opacity:0.4;"' : i >= 2 ? 'style="opacity:0.55;"' : '';
      return `
      <div class="riasec-row">
        <span class="riasec-letter-tag${dim}">${H(letter)}</span>
        <span class="riasec-label">${H(name)}</span>
        <span class="riasec-desc" ${opacity}>${H(desc)}</span>
      </div>`;
    }).join('');
  };
  const liWhite = 'border-bottom-color:rgba(255,255,255,0.06);color:rgba(255,255,255,0.65);';
  const whiteChevron = '<span style="color:rgba(255,255,255,0.4);font-size:1.2rem;font-weight:700;">›</span>';
  const renderWhiteBullets = (arr) =>
    (arr || []).map(b => `<li style="${liWhite}">${whiteChevron}${H(b)}</li>`).join('');
  const sRiasec = `
<section class="spread-05">
  <div class="s05-left">
    <div>
      <div class="chapter-index" style="color:rgba(255,255,255,0.3);">05 — RIASEC</div>
      <h2 class="s05-title">Profil<br><em>d'intérêts</em></h2>
    </div>
    <div class="s05-stat">
      <span class="s05-letter">${H(riasecLetter)}</span>
      <span class="s05-letter-sub">${H(riasecName)} · Lettre dominante</span>
    </div>
    <div class="callout-blue"><p>${H(ch05.callout)}</p></div>
  </div>
  <div class="s05-right">
    <p class="body-text" style="color:rgba(255,255,255,0.65);">${H(ch05.para1)}</p>
    <p class="body-text" style="color:rgba(255,255,255,0.65);">${H(ch05.para2)}</p>
    <div class="riasec-rows">${renderRiasecRows(ch05.table_rows)}</div>
    <div class="s05-bullets" style="margin-top:1.5rem;">
      <p class="body-text" style="color:rgba(255,255,255,0.65);margin-bottom:0.5rem;">${H(ch05.implications_intro)}</p>
      <ul class="bullet-list">${renderWhiteBullets(ch05.implications)}</ul>
    </div>
  </div>
</section>`;

  // ── SPREAD 06 — BESOINS FONDAMENTAUX ──
  const liChecklist = 'border-bottom-color:rgba(255,255,255,0.12);color:rgba(255,255,255,0.75);';
  const checklistChevron = '<span style="color:rgba(255,255,255,0.7);font-size:1.2rem;font-weight:700;">›</span>';
  const renderChecklist = (arr) =>
    (arr || []).map(b => `<li style="${liChecklist}">${checklistChevron}${H(b)}</li>`).join('');
  const needCells = (ch06.items || []).slice(0, 6).map(([title, desc], i) => `
    <div class="need-cell" data-n="${i + 1}">
      <div class="need-title">${H(title)}</div>
      <p class="need-desc">${H(desc)}</p>
    </div>`).join('');
  const sNeeds = `
<section class="spread-06">
  <div class="s06-stamp">${H(chapterTitleFor('06', q))} · Non négociables</div>
  <h2 class="s06-title">Ce qui doit<br><em>être présent</em></h2>
  <p class="s06-intro">${H(ch06.intro)}</p>
  <div class="needs-grid">${needCells}</div>
  <div class="s06-checklist">
    <p class="body-text" style="color:rgba(255,255,255,0.8);margin-top:1.5rem;font-style:italic;font-family:'Fraunces',serif;">${H(ch06.checklist_intro)}</p>
    <ul class="bullet-list">${renderChecklist(ch06.checklist)}</ul>
  </div>
</section>`;

  // ── SPREAD 07 — PISTES MÉTIERS ──
  const pisteCards = (ch07.pistes || []).map((piste) => `
    <div class="piste-card">
      <span class="piste-num">${H(piste.num || '')}</span>
      <span class="piste-tag">Piste ${H(String(piste.num || '').padStart(2, '0'))}</span>
      <h3 class="piste-title">${H(piste.metier)}</h3>
      <p class="piste-just">${H(piste.justification)}</p>
      <div>
        <div class="piste-section-label">Formation &amp; Écoles</div>
        <ul class="piste-items">${(piste.formations || []).map(f => `<li>${H(f)}</li>`).join('')}</ul>
      </div>
      <div>
        <div class="piste-section-label">Argumentaire croisé</div>
        <ul class="piste-items">
          ${piste.argumentaire?.riasec ? `<li>RIASEC — ${H(piste.argumentaire.riasec)}</li>` : ''}
          ${piste.argumentaire?.ennea ? `<li>Enneagramme — ${H(piste.argumentaire.ennea)}</li>` : ''}
          ${piste.argumentaire?.mbti ? `<li>MBTI — ${H(piste.argumentaire.mbti)}</li>` : ''}
        </ul>
      </div>
      <div>
        <div class="piste-section-label">3 actions</div>
        <ul class="piste-items">${(piste.actions || []).map(a => `<li>${H(a)}</li>`).join('')}</ul>
      </div>
    </div>`).join('');
  const sPistes = `
<section class="spread-07">
  <div class="s07-masthead">
    <h2 class="s07-title">${H(chapterTitleFor('07', q))}<br><em>&amp; formations</em></h2>
    <div class="label" style="color:rgba(216,236,216,0.3);">07 — ${(ch07.pistes || []).length} pistes</div>
  </div>
  <p class="s07-intro">${H(ch07.intro)}</p>
  <div class="pistes-grid">${pisteCards}</div>
</section>`;

  // ── SPREAD 08 — PLAN D'ACTION ──
  const valuesBlock = (ch08.valeurs && ch08.valeurs.length)
    ? `<ul class="bullet-list">${(ch08.valeurs || []).map(v => `<li>${H(v)}</li>`).join('')}</ul>`
    : `<div class="values-empty">Les valeurs personnelles n'ont pas encore été formalisées. Elles seront identifiées et nommées lors d'une prochaine séance, en croisant ${isAdult(q) ? 'votre vécu, vos choix forts et ce qui vous met en mouvement au quotidien' : 'ton vécu, tes choix forts et ce qui te met en mouvement au quotidien'}.</div>`;
  const sPlan = `
<section class="spread-08">
  <div class="s08-left">
    <div>
      <div class="label" style="margin-bottom:1.5rem;">08 — ${H(chapterTitleFor('08', q))}</div>
      <h2 class="s08-title">Plan<br><em>d'action</em></h2>
    </div>
    <blockquote class="plan-quote">${H(ch08.texte)}</blockquote>
    <div class="label" style="opacity:0.35;">Texte libre — transcrit mot à mot</div>
  </div>
  <div class="s08-right">
    <div class="label" style="margin-bottom:2rem;color:var(--ink);">${isAdult(q) ? 'Vos' : 'Tes'} valeurs · Identifiées en séance</div>
    ${valuesBlock}
  </div>
</section>`;

  // ── SPREAD 09 — MOT DU COACH ──
  const phraseFortePretty = epilogue.phrase_forte
    ? H(epilogue.phrase_forte).replace(/—/g, '<br>—')
    : '';
  const sCoachWord = `
<section class="spread-09">
  <div class="s09-deco"></div>
  <div class="s09-header">
    <h2 class="s09-title">Mot du<br><em>coach</em></h2>
    <div class="label" style="color:rgba(245,240,232,0.25);">${H(coachName)}</div>
  </div>
  <div class="s09-body">
    <p class="coach-note">${H(epilogue.para1)}</p>
    ${epilogue.para2 ? `<p class="coach-note">${H(epilogue.para2)}</p>` : ''}
    ${phraseFortePretty ? `
    <div class="phrase-forte-block">
      <p class="phrase-forte-text">${phraseFortePretty}</p>
    </div>` : ''}
  </div>
  <div class="s09-footer">
    <div class="signature">
      <strong>${H(coachName)}</strong><br>
      Coach d'orientation · ${H(brandName)} Coaching &amp; Training
    </div>
    <div class="label" style="color:rgba(245,240,232,0.25);">${H(dateRapport)}</div>
  </div>
</section>`;

  // ── SPREAD 10 — CONTACT / COLOPHON ──
  const sColophon = `
<section class="spread-10">
  <div class="s10-top">
    <div class="s10-logo">${H(brandName)}<span>Coaching &amp; Training · Ixelles</span></div>
    <div class="s10-contact">
      <a href="https://brenso.be">www.brenso.be</a><br>
      <a href="mailto:contact@brenso.be">contact@brenso.be</a><br>
      Ixelles, Belgique
    </div>
  </div>
  <div class="s10-bottom">
    <div class="confidential">
      Ce document est confidentiel.<br>
      Il est destiné exclusivement à ${H(prenom)} ${H(nom)}${isAdult(q) ? '.' : '<br>et à ses parents ou représentants légaux.'}
    </div>
    <div class="label" style="color:rgba(255,255,255,0.3);">${H(brandName)} · ${H(reportTitle)} · ${H(prenom)} · ${today.getFullYear()}</div>
  </div>
</section>`;

  // ── ASSEMBLE ──
  const fontFallback = `
body, .body-text, .skill-desc, .need-desc, .piste-just, .piste-items, .keyword, .label, .cover-tag, .signature, .confidential { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; }
.cover-title, .cover-name, .chapter-title-huge, .s02-title, .terminal-title, .s04-title, .s05-title, .s05-letter, .s06-title, .s07-title, .piste-title, .s08-title, .plan-quote, .s09-title, .phrase-forte-text, .s10-logo { font-family: 'Fraunces', Georgia, 'Times New Roman', serif; }
.cover-masthead-logo, .label, .cover-kicker, .chapter-index, .terminal-header, .stat-number, .skill-num, .s05-letter-sub, .s06-stamp, .piste-num, .piste-tag, .piste-section-label { font-family: 'Space Mono', 'Courier New', monospace; }
@media print { section { page-break-after: always; } }`;

  return `<!DOCTYPE html>
<html lang="${q.language === 'nl' ? 'nl' : 'fr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${H(brandName)} — ${H(reportTitle)} · ${H(prenom)}</title>
${fontLink}
<style>${css}
${fontFallback}
</style>
</head>
<body>
${sCover}
${sPersonality}
${sContextPro}
${sMbti}
${sSkills}
${sRiasec}
${sNeeds}
${sPistes}
${sPlan}
${sCoachWord}
${sColophon}
</body>
</html>
`;
}

// ── PRIVACY: FIRST-NAME ALIAS ──────────────────────────────────────────────
// The real first name must never be sent to Anthropic. We substitute a random
// alias for every AI call, then swap it back in the generated output before
// the Word document is assembled.

const ALIAS_POOL = ["Alex", "Sam", "Noa", "Robin", "Jules", "Maxime", "Elliot", "Jordan"];

function pickAlias(realPrenom) {
  // Avoid the tiny chance the alias equals the real first name.
  const pool = ALIAS_POOL.filter(a => a.toLowerCase() !== (realPrenom || "").toLowerCase());
  return pool[Math.floor(Math.random() * pool.length)];
}

function deepReplaceAliasInStrings(node, alias, realPrenom) {
  const re = new RegExp("\\b" + alias + "\\b", "gi");
  const walk = (v) => {
    if (typeof v === "string") return v.replace(re, realPrenom);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v)) out[k] = walk(v[k]);
      return out;
    }
    return v;
  };
  return walk(node);
}

// ── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const jsonPath = process.argv[2];
  const outPath = process.argv[3] || path.join(process.cwd(), 'brenso-raport.docx');
  const htmlPath = process.argv[4] || outPath.replace(/\.docx$/i, '.html');
  if (!jsonPath) { console.error("Usage: node brenso-rapport.js <questionnaire.json> [output.docx] [output.html]"); process.exit(1); }

  const q = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Replace the real first name with an alias for the entire AI phase.
  // The real name is restored just before docx assembly.
  q._realPrenom = q.prenom;
  q._alias = pickAlias(q.prenom);
  q.prenom = q._alias;

  console.log(`\n🔵 BRENSO — Génération rapport ${q._realPrenom} ${q.nom}`);
  console.log(`   (alias AI : ${q._alias})`);
  console.log(`   Enneagramme : ${q.ennea_bases.join("+")} (${q.ennea_soustype})`);
  console.log(`   MBTI : ${q.mbti} | RIASEC : ${q.riasec}`);
  console.log(`   Word counts : Ennea=${q.words_ennea} MBTI=${q.words_mbti} RIASEC=${q.words_riasec}`);

  let context = "";

  console.log("\n📝 Génération chapitre 01 — Personnalité...");
  const ch01 = await genChapter01(q, {}, context);
  context += `\nCh01 Personnalité: ${ch01.callout} ${ch01.para1}`;

  console.log("📝 Génération chapitre 02 — Contexte pro...");
  const ch02 = await genChapter02(q, {}, context);
  context += `\nCh02 Contexte pro: ${ch02.callout} Forces: ${ch02.forces.join(", ")}`;

  console.log("📝 Génération chapitre 03 — MBTI...");
  const ch03 = await genChapter03(q, {}, context);
  context += `\nCh03 MBTI: ${ch03.callout} ${ch03.para1}`;

  console.log("📝 Génération chapitre 04 — Compétences...");
  const ch04 = await genChapter04(q, {}, context);
  context += `\nCh04 Compétences: ${ch04.items.map(i=>i[0]).join(", ")}`;

  console.log("📝 Génération chapitre 05 — RIASEC...");
  const ch05 = await genChapter05(q, {}, context);
  context += `\nCh05 RIASEC: ${ch05.callout}`;

  console.log("📝 Génération chapitre 06 — Besoins fondamentaux...");
  const ch06 = await genChapter06(q, {}, context);
  context += `\nCh06 Besoins: ${ch06.items.map(i=>i[0]).join(", ")}`;

  console.log("📝 Génération chapitre 07 — Pistes métiers...");
  const ch07 = await genChapter07(q, {}, context);
  context += `\nCh07 Pistes: ${(ch07.pistes||[]).map(p=>p.metier).join(", ")}`;

  console.log("📝 Assemblage chapitre 08 — Plan d'action...");
  const ch08 = await genChapter08(q);

  console.log("📝 Génération épilogue — Mot du coach...");
  const epilogue = await genEpilogue(q, context);

  // AI phase complete. Swap the alias back to the real first name in every
  // chapter and restore q.prenom so the cover/header/footer show the real name.
  console.log(`\n🔒 Restauration du prénom (${q._alias} → ${q._realPrenom})...`);
  const restored = deepReplaceAliasInStrings(
    { ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, epilogue },
    q._alias,
    q._realPrenom,
  );
  q.prenom = q._realPrenom;

  console.log("\n📄 Assemblage du document Word...");
  const doc = buildDocument(q, restored);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);
  console.log(`   → DOCX : ${outPath}`);

  console.log("\n📄 Assemblage du rapport HTML...");
  const html = buildHtml(q, restored);
  fs.writeFileSync(htmlPath, html);
  console.log(`   → HTML : ${htmlPath}`);

  console.log(`\n✅ Rapport généré.`);
}

main().catch(e => { console.error("❌ Erreur:", e); process.exit(1); });
