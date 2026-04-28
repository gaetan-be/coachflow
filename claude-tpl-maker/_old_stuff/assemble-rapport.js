/**
 * BRENSO — Assemblage rapport Word à partir de données pré-générées
 * Usage : node assemble-rapport.js <questionnaire.json> <chapters-data.json> [output.docx]
 */

const fs   = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TabStopType
} = require('docx');

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

function makeHeader(brandName) {
  return new Header({ children:[
    new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.blue}}, spacing:{after:60},
      tabStops:[{type:TabStopType.RIGHT,position:PAGE.cw}],
      children:[
        r(brandName,{bold:true,size:17,color:C.blue}),
        r("  Coaching & Training",{size:17,color:C.mid}),
        r("\t",{size:17}),
        r("Rapport d'orientation",{size:16,italic:true,color:C.mid}),
      ],
    }),
  ]});
}

function makeFooter(brandName) {
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
    new Paragraph({spacing:{after:0}, children:[r("RAPPORT D'ORIENTATION",{size:46,bold:true,color:C.dark})]}),
    new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:10,color:C.blue}},
      spacing:{before:0,after:320},
      children:[r(brandName+" Coaching & Training",{size:22,color:C.blue})],
    }),
    blank(280),
    p([r("Préparé pour",{size:19,color:C.mid,italic:true})],{spacing:{after:40}}),
    p([r(prenom+" "+q.nom,{size:38,bold:true,color:C.blue})],{spacing:{after:120}}),
    p([r("Date de naissance : ",{size:19,color:C.mid}),r(q.anniversaire+(q.age?" ("+q.age+" ans)":""),{size:19,bold:true})],{spacing:{after:60}}),
    p([r("Formation : ",{size:19,color:C.mid}),r(q.ecole||"—",{size:19,bold:true})],{spacing:{after:60}}),
    p([r("Enneagramme : ",{size:19,color:C.mid}),r("Base "+q.ennea_bases.join(" · ")+" · "+q.ennea_soustype,{size:19,bold:true})],{spacing:{after:60}}),
    p([r("MBTI : ",{size:19,color:C.mid}),r(q.mbti,{size:19,bold:true})],{spacing:{after:60}}),
    p([r("RIASEC : ",{size:19,color:C.mid}),r(q.riasec,{size:19,bold:true})],{spacing:{after:60}}),
    blank(400),
    p([r("Coach : ",{size:19,color:C.mid}),r(coachName,{size:19,bold:true})],{spacing:{after:60}}),
    p([r("Date du rapport : ",{size:19,color:C.mid}),r(dateRapport,{size:19})],{spacing:{after:60}}),

    // ── 01 PERSONNALITÉ
    br(), ...chapterBand("01","Personnalité — Enneagramme"),
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
    br(), ...chapterBand("02","En contexte professionnel"),
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
    br(), ...chapterBand("03","Compétences — MBTI"),
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
    br(), ...chapterBand("04","Compétences clés"),
    blank(80),
    p([r(ch04.intro)]),
    blank(120),
    itemListTable(ch04.items),

    // ── 05 RIASEC
    br(), ...chapterBand("05","RIASEC — Profil d'intérêts"),
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
    br(), ...chapterBand("06","Besoins fondamentaux"),
    blank(80),
    p([r(ch06.intro)]),
    blank(120),
    itemListTable(ch06.items),
    blank(120),
    subhead("Ce qui doit être présent"),
    p([r(ch06.checklist_intro)]),
    ...ch06.checklist.map(c => bullet(c)),

    // ── 07 PISTES
    br(), ...chapterBand("07","Pistes de métiers & formations"),
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
    br(), ...chapterBand("08","Plan d'action"),
    blank(80),
    p([r(ch08.texte)]),
    ...(ch08.valeurs && ch08.valeurs.length ? [
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
    p([r("Coach d'orientation certifiée",{size:20,italic:true,color:C.mid})],{spacing:{after:60}}),
    p([r("Ixelles, Belgique",{size:19,color:C.mid})],{spacing:{after:60}}),
    blank(80),
    new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:2,color:C.greyBorder}},spacing:{before:80,after:80},children:[r("",{size:4})]}),
    p([r("www.brenso.be",{size:19,color:C.blue})],{spacing:{after:40}}),
    p([r("contact@brenso.be",{size:19,color:C.mid})],{spacing:{after:40}}),
    blank(400),
    p([r("Ce document est confidentiel. Il est destiné exclusivement à ",{size:17,color:C.mid})],{spacing:{after:0}}),
    p([r(prenom+" "+q.nom+" et à ses parents ou représentants légaux.",{size:17,color:C.mid})],{spacing:{after:0}}),
  ];

  return new Document({
    numbering: { config:[{ reference:"brenso-bullets", levels:[{
      level:0, format:LevelFormat.BULLET, text:"›", alignment:AlignmentType.LEFT,
      style:{ run:{font:"Calibri",size:22,color:C.blue,bold:true}, paragraph:{indent:{left:560,hanging:280}} },
    }]}] },
    styles:{ default:{ document:{ run:{font:"Calibri",size:22,color:C.dark} } } },
    sections:[{
      properties:{ page:{ size:{width:PAGE.w,height:PAGE.h}, margin:{top:PAGE.mTop,bottom:PAGE.mBottom,left:PAGE.mLeft,right:PAGE.mRight} } },
      headers:{ default:makeHeader(brandName) },
      footers:{ default:makeFooter(brandName) },
      children,
    }],
  });
}

// ── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const jsonPath = process.argv[2];
  const chaptersPath = process.argv[3];
  const outPath = process.argv[4] || 'brenso-raport.docx';

  if (!jsonPath || !chaptersPath) {
    console.error("Usage: node assemble-rapport.js <questionnaire.json> <chapters-data.json> [output.docx]");
    process.exit(1);
  }

  const q = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const chapters = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));

  console.log(`\nBRENSO — Assemblage rapport ${q.prenom} ${q.nom}`);
  console.log(`   Enneagramme : ${q.ennea_bases.join("+")} (${q.ennea_soustype})`);
  console.log(`   MBTI : ${q.mbti} | RIASEC : ${q.riasec}`);

  console.log("\nAssemblage du document Word...");
  const doc = buildDocument(q, chapters);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);

  console.log(`Rapport genere : ${outPath}`);
}

main().catch(e => { console.error("Erreur:", e); process.exit(1); });
