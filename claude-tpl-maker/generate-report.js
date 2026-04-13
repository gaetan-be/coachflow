/**
 * BRENSO — Génération rapport Gaëtan DENAISSE
 * Contenu généré par Claude, assemblage docx identique au design system BRENSO
 */

const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TabStopType
} = require('docx');

// ── QUESTIONNAIRE ──────────────────────────────────────────────────────────
const q = JSON.parse(fs.readFileSync(process.argv[2] || 'brenso_gaetan_2026-04-13.json', 'utf8'));

// ── DESIGN SYSTEM — CONSTANTES ABSOLUES ────────────────────────────────────
const C = {
  blue:"40A2C0", blueDark:"2B7A94", blueLight:"E3F4F8", bluePale:"F0F8FB",
  pink:"CF3A65", pinkDark:"A02A4E", pinkLight:"FAEAEE",
  dark:"1D2D35", mid:"4A6572", greyLight:"F2F5F6",
  greyBorder:"CBD4D7", white:"FFFFFF",
};
const PAGE = { w:11906, h:16838, mTop:1418, mBottom:1418, mLeft:1701, mRight:1134 };
PAGE.cw = PAGE.w - PAGE.mLeft - PAGE.mRight;
const COL1 = Math.round(PAGE.cw * 0.34), COL2 = PAGE.cw - COL1;
const COL_ITEM = Math.round(PAGE.cw * 0.28), COL_DESC = PAGE.cw - COL_ITEM;

// ── PRIMITIVES DOCX ────────────────────────────────────────────────────────
const r = (text, opts={}) => new TextRun({text, font:"Calibri", size:22, color:C.dark, ...opts});
const p = (children, opts={}) => new Paragraph({
  spacing:{after:120}, children:Array.isArray(children)?children:[children], ...opts
});
const blank = (before=80) => new Paragraph({spacing:{before,after:0}, children:[r("")]});
const br = () => new Paragraph({children:[new PageBreak()]});
const bBorder = (color=C.greyBorder) => ({style:BorderStyle.SINGLE, size:1, color});
const noBorder = {style:BorderStyle.NONE};

function chapterBand(num, title) {
  return [
    blank(240),
    new Paragraph({
      shading:{fill:C.blue, type:ShadingType.CLEAR}, spacing:{before:0,after:0}, indent:{left:200},
      children:[
        r(num,  {size:20, bold:true, color:"8DD1E4"}),
        r("   \u00b7   ", {size:18, color:"8DD1E4"}),
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
        r("PISTE "+num+"  \u00b7  ",{size:17,bold:true,color:C.pink}),
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

const docHeader = new Header({ children:[
  new Paragraph({
    border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.blue}}, spacing:{after:60},
    tabStops:[{type:TabStopType.RIGHT,position:PAGE.cw}],
    children:[
      r("BRENSO",{bold:true,size:17,color:C.blue}),
      r("  Coaching & Training",{size:17,color:C.mid}),
      r("\t",{size:17}),
      r("Rapport d'orientation",{size:16,italic:true,color:C.mid}),
    ],
  }),
]});

const docFooter = new Footer({ children:[
  new Paragraph({
    border:{top:{style:BorderStyle.SINGLE,size:2,color:C.greyBorder}}, spacing:{before:60},
    tabStops:[{type:TabStopType.RIGHT,position:PAGE.cw}],
    children:[
      r("Document confidentiel  \u00b7  BRENSO Coaching & Training  \u00b7  Ixelles",{size:16,color:C.mid}),
      r("\t",{size:16}),
      r("p. ",{size:16,color:C.mid}),
      new TextRun({children:[PageNumber.CURRENT],size:16,color:C.blue,bold:true,font:"Calibri"}),
    ],
  }),
]});

// ── CONTENU GÉNÉRÉ PAR CHAPITRE ────────────────────────────────────────────

const ch01 = {
  callout: "Gaetan, tu portes en toi une combinaison rare : un c\u0153ur profond\u00e9ment tourn\u00e9 vers les autres alli\u00e9 \u00e0 une \u00e9nergie enthousiaste qui te pousse sans cesse \u00e0 d\u00e9couvrir, cr\u00e9er et rebondir. Tu ressens les besoins de ton entourage avant m\u00eame qu'ils ne soient exprim\u00e9s, et cette sensibilit\u00e9 est ta plus grande force.",
  para1: "Avec ta base 2 dominante, tu es naturellement tourn\u00e9 vers l'aide et le soutien. Tu poss\u00e8des un radar \u00e9motionnel tr\u00e8s d\u00e9velopp\u00e9 qui te permet de percevoir instinctivement quand quelqu'un traverse une difficult\u00e9. Cette capacit\u00e9 \u00e0 deviner les besoins des autres fait de toi un alli\u00e9 pr\u00e9cieux dans tous les contextes, que ce soit au judo ou dans tes projets scolaires. Ton \u00e9nergie se nourrit des interactions humaines et du sentiment d'\u00eatre utile avec un impact visible sur le bien-\u00eatre de ceux qui t'entourent.",
  para2: "Ta base 7 en influence apporte une dimension d'enthousiasme et de curiosit\u00e9 qui \u00e9quilibre magnifiquement ton profil. L\u00e0 o\u00f9 ta base 2 t'ancre dans la relation, ta base 7 t'ouvre \u00e0 la nouveaut\u00e9, aux projets multiples et \u00e0 une vision r\u00e9solument positive du monde. Ton sous-type T\u00eate-\u00e0-t\u00eate r\u00e9v\u00e8le que tu t'investis pleinement dans les relations individuelles profondes. Tu cherches des liens exclusifs et intenses, et tu as un charisme naturel qui marque les personnes que tu rencontres.",
  intro_bullets: "Les traits suivants d\u00e9finissent ton \u00e9quilibre unique :",
  bullets: [
    "Empathie intuitive \u2014 tu captes les \u00e9motions et les besoins avant m\u00eame qu'on te les exprime",
    "Enthousiasme communicatif \u2014 ton \u00e9nergie positive entra\u00eene les autres dans tes projets",
    "Investissement relationnel total \u2014 quand tu t'engages avec quelqu'un, c'est \u00e0 100%"
  ],
  table_rows: [
    ["Base dominante (1)", "Type 2 \u2014 L'Altruiste"],
    ["Base d'influence (2)", "Type 7 \u2014 L'Aventurier"],
    ["Base de coloration (3)", "\u2014"],
    ["Sous-type", "T\u00eate-\u00e0-t\u00eate"],
    ["Pond\u00e9ration indicative", "70% Type 2 \u00b7 25% Type 7"]
  ],
  mots_cles: ["G\u00e9n\u00e9rosit\u00e9", "Enthousiasme", "Charisme", "Empathie", "Cr\u00e9ativit\u00e9 relationnelle"]
};

const ch02 = {
  callout: "En contexte professionnel, Gaetan, ton profil r\u00e9v\u00e8le un collaborateur d\u00e9vou\u00e9 qui excelle dans les environnements o\u00f9 les relations humaines sont au c\u0153ur du travail, tout en ayant besoin de vari\u00e9t\u00e9 et de stimulation pour rester pleinement engag\u00e9.",
  forces_intro: "Tes forces professionnelles s'enracinent dans ta capacit\u00e9 naturelle \u00e0 cr\u00e9er des liens de confiance et \u00e0 apporter de l'\u00e9nergie aux \u00e9quipes. Comme au judo, tu sais lire ton adversaire et t'adapter, une comp\u00e9tence pr\u00e9cieuse dans le monde du travail.",
  forces: [
    "Cr\u00e9ation de liens de confiance rapides et authentiques avec coll\u00e8gues et clients",
    "Capacit\u00e9 \u00e0 percevoir les tensions dans une \u00e9quipe et \u00e0 les d\u00e9samorcer naturellement",
    "Dynamisme et enthousiasme qui motivent l'entourage professionnel",
    "Fiabilit\u00e9 et d\u00e9vouement concret \u2014 tu es celui sur qui on peut compter"
  ],
  besoins_intro: "Pour t'\u00e9panouir dans un environnement de travail, certaines conditions sont essentielles \u00e0 ton \u00e9quilibre :",
  besoins: [
    "Reconnaissance visible de ton engagement \u2014 l'indiff\u00e9rence te d\u00e9motive profond\u00e9ment",
    "Vari\u00e9t\u00e9 dans les t\u00e2ches et les projets \u2014 la routine prolonge te p\u00e8se",
    "Travail en bin\u00f4me ou petite \u00e9quipe plut\u00f4t qu'en grand groupe anonyme"
  ]
};

const ch03 = {
  callout: "Gaetan, ton type ISFJ r\u00e9v\u00e8le un protecteur discret mais essentiel : tu retiens ce qui compte pour les autres, tu agis concr\u00e8tement pour que tout fonctionne bien, et tu portes une charge consid\u00e9rable avec s\u00e9rieux et loyaut\u00e9.",
  para1: "Dans tes apprentissages, tu privil\u00e9gies l'exp\u00e9rience concr\u00e8te dans un cadre s\u00e9curisant. Tu as besoin de temps pour int\u00e9grer les connaissances et tu excelles quand on te donne des exemples pratiques avant de passer \u00e0 la th\u00e9orie. Ta m\u00e9moire des faits et des d\u00e9tails concrets est remarquable. En revanche, les consignes vagues ou un rythme impos\u00e9 trop rapide te d\u00e9stabilisent. Au judo, cette approche se traduit par une ma\u00eetrise technique progressive et solide, b\u00e2tie sur la r\u00e9p\u00e9tition et l'observation.",
  para2: "Ce qui t'anime dans un projet, c'est de sentir que ta contribution a un impact concret sur les personnes autour de toi. Tu t'investis pleinement quand tu sais que ton travail sert \u00e0 quelqu'un, et cette motivation altruiste est un moteur puissant. Ta nature ISFJ te pousse \u00e0 cr\u00e9er un environnement stable et harmonieux autour de toi.",
  table_rows: [
    ["\u00c9nergie", "I \u2014 Introversion : tu te ressources dans le calme et la r\u00e9flexion"],
    ["Perception", "S \u2014 Sensation : tu fais confiance au concret et aux faits observables"],
    ["Jugement", "F \u2014 Sentiment : tes d\u00e9cisions sont guid\u00e9es par tes valeurs et l'impact humain"],
    ["Mode de vie", "J \u2014 Jugement : tu pr\u00e9f\u00e8res l'organisation et les plans clairs"],
    ["Type r\u00e9sultant", "ISFJ \u2014 Le Protecteur"]
  ],
  apprentissage_intro: "Tu apprends mieux quand les conditions suivantes sont r\u00e9unies :",
  apprentissage: [
    "Cadre structur\u00e9 avec des \u00e9tapes claires et du temps pour assimiler",
    "Exemples concrets et applications pratiques avant toute th\u00e9orie abstraite",
    "Ce qui te freine : un environnement chaotique, des consignes floues ou un rythme qui ne te laisse pas le temps de v\u00e9rifier ta compr\u00e9hension"
  ]
};

const ch04 = {
  intro: "Gaetan, ton profil ISFJ combin\u00e9 \u00e0 ta base 2 de l'Enneagramme r\u00e9v\u00e8le un ensemble de comp\u00e9tences cl\u00e9s centr\u00e9es sur le soin concret apport\u00e9 aux autres, la fiabilit\u00e9 et une organisation m\u00e9thodique. Ces comp\u00e9tences se manifestent aussi bien dans ta pratique du judo que dans tes interactions quotidiennes.",
  items: [
    ["Empathie concr\u00e8te", "Tu ne te contentes pas de comprendre les \u00e9motions des autres : tu agis concr\u00e8tement pour am\u00e9liorer leur situation, avec des gestes pr\u00e9cis et adapt\u00e9s."],
    ["Fiabilit\u00e9", "Quand tu t'engages, tu tiens parole. Cette constance fait de toi une personne sur laquelle on s'appuie naturellement dans un projet."],
    ["M\u00e9moire des d\u00e9tails", "Tu retiens les petites choses qui comptent pour les gens \u2014 un pr\u00e9nom, une pr\u00e9f\u00e9rence, un besoin exprim\u00e9 une seule fois."],
    ["Organisation m\u00e9thodique", "Tu structures ton travail avec rigueur, tu suis les \u00e9tapes et tu t'assures que rien n'est oubli\u00e9."],
    ["Cr\u00e9ation d'harmonie", "Tu perçois les tensions et tu agis discr\u00e8tement pour maintenir un climat serein autour de toi."],
    ["Pers\u00e9v\u00e9rance", "Comme au judo, tu ne l\u00e2ches pas. Tu acceptes l'effort r\u00e9p\u00e9t\u00e9 pour progresser et tu restes constant m\u00eame quand c'est difficile."],
    ["Adaptabilit\u00e9 relationnelle", "Tu ajustes naturellement ton approche en fonction de la personne en face de toi, gr\u00e2ce \u00e0 ton sous-type T\u00eate-\u00e0-t\u00eate."],
    ["Sens du service", "Tu trouves ta motivation dans le fait d'\u00eatre utile. Rendre service n'est pas une t\u00e2che pour toi, c'est un moteur."]
  ]
};

const ch05 = {
  callout: "Gaetan, ton profil RIASEC IS r\u00e9v\u00e8le un croisement rare entre la curiosit\u00e9 analytique de l'Investigateur et la g\u00e9n\u00e9rosit\u00e9 relationnelle du Social. Tu as besoin de comprendre en profondeur ET d'avoir un impact humain concret.",
  para1: "Ta lettre dominante I (Investigateur) traduit un go\u00fbt prononc\u00e9 pour la compr\u00e9hension, l'analyse et la r\u00e9solution de probl\u00e8mes. Tu aimes d\u00e9cortiquer les choses, comprendre comment elles fonctionnent et trouver des solutions par toi-m\u00eame. Associ\u00e9e \u00e0 la lettre S (Social), cette curiosit\u00e9 se tourne naturellement vers les personnes : tu ne cherches pas \u00e0 analyser dans l'abstrait, mais \u00e0 comprendre pour mieux aider.",
  para2: "Ce profil IS est parfaitement coh\u00e9rent avec ton Enneagramme base 2 (tourn\u00e9 vers les autres) et ton MBTI ISFJ (le Protecteur). Les trois outils convergent vers le m\u00eame portrait : quelqu'un qui observe, comprend et agit concr\u00e8tement au service des personnes. Ton int\u00e9r\u00eat pour la charpenterie montre aussi cette dimension pratique \u2014 tu aimes produire quelque chose de tangible.",
  table_rows: [
    ["R \u00b7 R\u00e9aliste", "Pr\u00e9sent en fond \u2014 ton int\u00e9r\u00eat pour la charpenterie et le judo t\u00e9moignent d'un go\u00fbt pour le concret"],
    ["I \u00b7 Investigateur", "Dominant \u2014 tu aimes comprendre, analyser et r\u00e9soudre des probl\u00e8mes complexes"],
    ["A \u00b7 Artistique", "Mod\u00e9r\u00e9 \u2014 ta cr\u00e9ativit\u00e9 s'exprime surtout dans les relations et les solutions originales"],
    ["S \u00b7 Social", "Fort \u2014 tu es naturellement tourn\u00e9 vers l'aide, l'accompagnement et l'enseignement"],
    ["E \u00b7 Entreprenant", "Mod\u00e9r\u00e9 \u2014 tu sais convaincre en t\u00eate-\u00e0-t\u00eate mais tu ne cherches pas le leadership de groupe"],
    ["C \u00b7 Conventionnel", "Plus faible \u2014 les t\u00e2ches purement administratives et r\u00e9p\u00e9titives t'ennuient"]
  ],
  implications_intro: "Ce profil IS oriente ton parcours vers des m\u00e9tiers o\u00f9 tu peux \u00e0 la fois comprendre et accompagner :",
  implications: [
    "M\u00e9tiers de la sant\u00e9 et du soin \u2014 o\u00f9 l'analyse clinique rencontre l'empathie concr\u00e8te",
    "M\u00e9tiers techniques \u00e0 dimension humaine \u2014 o\u00f9 tu construis quelque chose pour quelqu'un",
    "Accompagnement sp\u00e9cialis\u00e9 \u2014 o\u00f9 tu utilises ta capacit\u00e9 d'observation fine au service des personnes"
  ]
};

const ch06 = {
  intro: "Gaetan, tes besoins fondamentaux sont profond\u00e9ment ancr\u00e9s dans ta base 2 de l'Enneagramme et renforc\u00e9s par ton sous-type T\u00eate-\u00e0-t\u00eate. Les conna\u00eetre, c'est poss\u00e9der la cl\u00e9 pour choisir un environnement o\u00f9 tu pourras r\u00e9ellement t'\u00e9panouir sur le long terme.",
  items: [
    ["Reconnaissance", "Tu as besoin que ton engagement soit vu et appr\u00e9ci\u00e9. L'indiff\u00e9rence \u00e0 tes efforts est ce qui te d\u00e9motive le plus profond\u00e9ment."],
    ["Lien privil\u00e9gi\u00e9", "Ton sous-type T\u00eate-\u00e0-t\u00eate te pousse \u00e0 chercher des relations profondes et exclusives. Tu as besoin d'un mentor, d'un binome, d'un r\u00e9f\u00e9rent."],
    ["Impact visible", "Tu dois sentir que ton travail change concr\u00e8tement quelque chose pour quelqu'un. Un r\u00e9sultat abstrait ou invisible te frustre."],
    ["Stimulation", "Ta base 7 en influence te rappelle que tu as besoin de vari\u00e9t\u00e9, de d\u00e9fis renouvel\u00e9s et de moments de l\u00e9g\u00e8ret\u00e9 pour rester engag\u00e9."],
    ["S\u00e9curit\u00e9 relationnelle", "Ton ISFJ a besoin d'un cadre stable et de relations de confiance. L'incertitude relationnelle te d\u00e9stabilise."],
    ["Autonomie dans le lien", "Tu veux t'investir pleinement sans pour autant te perdre dans l'autre. Trouver cet \u00e9quilibre est ton d\u00e9fi central."]
  ],
  checklist_intro: "Pour que tu t'\u00e9panouisses dans un m\u00e9tier ou une formation, ces \u00e9l\u00e9ments doivent \u00eatre pr\u00e9sents :",
  checklist: [
    "Un r\u00e9f\u00e9rent ou mentor accessible avec qui tu peux \u00e9changer r\u00e9guli\u00e8rement",
    "Des retours sinc\u00e8res et r\u00e9guliers sur ton travail et ta progression",
    "Des missions \u00e0 impact humain concret, pas seulement administratif",
    "Ce qui serait difficile \u00e0 g\u00e9rer : un environnement impersonnel o\u00f9 tu serais un num\u00e9ro, sans feedback ni reconnaissance"
  ]
};

const ch07 = {
  intro: "Gaetan, en croisant ton profil RIASEC IS, ton Enneagramme 2 et ton MBTI ISFJ, plusieurs pistes de m\u00e9tiers se dessinent naturellement. Chacune r\u00e9pond \u00e0 ton besoin d'impact humain, de concret et de relations profondes. Ton int\u00e9r\u00eat pour la charpenterie montre aussi que tu aimes construire avec tes mains \u2014 cette dimension est int\u00e9gr\u00e9e dans les pistes.",
  pistes: [
    {
      num: "1",
      metier: "Charpentier",
      justification: "C'est ton choix initial et il est parfaitement coh\u00e9rent avec ton profil. La charpenterie combine le concret (R\u00e9aliste), la r\u00e9solution de probl\u00e8mes techniques (Investigateur) et la satisfaction de construire quelque chose de tangible pour les gens. Ton ISFJ y trouvera la m\u00e9thode et la rigueur, et ta base 2 sera nourrie par le travail en \u00e9quipe sur chantier.",
      formations: ["\u00c9cole des Arts et M\u00e9tiers \u2013 Bruxelles", "IFAPME \u2013 Formation charpentier \u2013 Brabant wallon", "Centre de comp\u00e9tence Construform \u2013 Wallonie"],
      argumentaire: {
        riasec: "Lettre I + dimension R : tu analyses les plans, tu r\u00e9sous les probl\u00e8mes structurels et tu travailles avec la mati\u00e8re",
        ennea: "Base 2 : tu travailles en \u00e9quipe sur chantier, tu vois le r\u00e9sultat concret de ton aide, tu es reconnu pour ta fiabilit\u00e9",
        mbti: "ISFJ : cadre structur\u00e9, \u00e9tapes claires, m\u00e9tier de tradition o\u00f9 l'exp\u00e9rience et la rigueur sont valoris\u00e9es"
      },
      actions: [
        "Effectuer un stage d\u00e9couverte d'une semaine chez un charpentier ind\u00e9pendant",
        "Visiter les portes ouvertes de l'IFAPME avant juin 2026",
        "Rencontrer un charpentier exp\u00e9riment\u00e9 pour un entretien m\u00e9tier d'une heure"
      ]
    },
    {
      num: "2",
      metier: "\u00c9ducateur sp\u00e9cialis\u00e9",
      justification: "Ton profil IS combin\u00e9 \u00e0 ta base 2 et ton ISFJ convergent vers l'accompagnement. \u00c9ducateur sp\u00e9cialis\u00e9 te permettrait d'utiliser ton empathie concr\u00e8te, ton sous-type T\u00eate-\u00e0-t\u00eate (relation individuelle profonde) et ta capacit\u00e9 \u00e0 cr\u00e9er un cadre s\u00e9curisant pour des jeunes en difficult\u00e9. Ton exp\u00e9rience du judo apporte la dimension corporelle et le cadre structurant.",
      formations: ["Haute \u00c9cole Bruxelles-Brabant (HE2B) \u2013 Bac \u00c9ducateur sp\u00e9cialis\u00e9", "Haute \u00c9cole Galil\u00e9e (IHECS Academy) \u2013 Bruxelles", "Haute \u00c9cole Louvain en Hainaut \u2013 Mons"],
      argumentaire: {
        riasec: "Lettre S dominante secondaire : m\u00e9tier centr\u00e9 sur l'aide, l'accompagnement et la relation humaine",
        ennea: "Base 2 + T\u00eate-\u00e0-t\u00eate : relation individuelle intense, impact direct sur la vie d'un jeune, reconnaissance dans le lien",
        mbti: "ISFJ : cadre structur\u00e9, m\u00e9tier de service, stabilit\u00e9, contribution concr\u00e8te et humaine"
      },
      actions: [
        "Faire du b\u00e9n\u00e9volat dans une maison de jeunes ou un centre d'accueil pendant 3 mois",
        "Participer \u00e0 une journ\u00e9e d'immersion en Haute \u00c9cole section \u00e9ducateur",
        "Rencontrer un \u00e9ducateur en exercice pour comprendre la r\u00e9alit\u00e9 du m\u00e9tier au quotidien"
      ]
    }
  ]
};

const ch08 = {
  texte: q.plan_action || "Aucun plan d'action renseign\u00e9 lors de cette s\u00e9ance.",
  valeurs: q.valeurs || [],
};

const epilogue = {
  para1: "G\u00e9nial la rencontre, Gaetan. Tu as montr\u00e9 une vraie capacit\u00e9 \u00e0 r\u00e9fl\u00e9chir sur toi-m\u00eame et \u00e0 te projeter dans l'avenir avec sinc\u00e9rit\u00e9. Ce qui m'a frapp\u00e9e dans notre \u00e9change, c'est ta combinaison de douceur et de d\u00e9termination \u2014 exactement ce que ton profil r\u00e9v\u00e8le.",
  para2: "Que tu choisisses la charpenterie ou l'\u00e9ducation sp\u00e9cialis\u00e9e, tu as les qualit\u00e9s humaines et la pers\u00e9v\u00e9rance pour r\u00e9ussir. L'important maintenant, c'est d'aller voir sur le terrain, de tester, de rencontrer des professionnels. Tu as tout ce qu'il faut pour construire un parcours qui te ressemble.",
  phrase_forte: "Tu construis pour les autres, et c'est en construisant que tu te trouves."
};

// ── ASSEMBLAGE WORD ────────────────────────────────────────────────────────

const prenom = q.prenom;
const dateRapport = new Date().toLocaleDateString('fr-BE', {day:'2-digit',month:'long',year:'numeric'});

const children = [
  // ── COUVERTURE
  blank(2000),
  new Paragraph({spacing:{after:0}, children:[r("RAPPORT D'ORIENTATION",{size:46,bold:true,color:C.dark})]}),
  new Paragraph({
    border:{bottom:{style:BorderStyle.SINGLE,size:10,color:C.blue}},
    spacing:{before:0,after:320},
    children:[r("BRENSO Coaching & Training",{size:22,color:C.blue})],
  }),
  blank(280),
  p([r("Pr\u00e9par\u00e9 pour",{size:19,color:C.mid,italic:true})],{spacing:{after:40}}),
  p([r(prenom+" "+q.nom,{size:38,bold:true,color:C.blue})],{spacing:{after:120}}),
  p([r("Date de naissance : ",{size:19,color:C.mid}),r(q.anniversaire+(q.age?" ("+q.age+" ans)":""),{size:19,bold:true})],{spacing:{after:60}}),
  p([r("Formation : ",{size:19,color:C.mid}),r(q.ecole||"\u2014",{size:19,bold:true})],{spacing:{after:60}}),
  p([r("Enneagramme : ",{size:19,color:C.mid}),r("Base "+q.ennea_bases.join(" \u00b7 ")+" \u00b7 "+q.ennea_soustype,{size:19,bold:true})],{spacing:{after:60}}),
  p([r("MBTI : ",{size:19,color:C.mid}),r(q.mbti,{size:19,bold:true})],{spacing:{after:60}}),
  p([r("RIASEC : ",{size:19,color:C.mid}),r(q.riasec,{size:19,bold:true})],{spacing:{after:60}}),
  blank(400),
  p([r("Coach : ",{size:19,color:C.mid}),r("B\u00e9n\u00e9dicte Vanden Bossche",{size:19,bold:true})],{spacing:{after:60}}),
  p([r("Date du rapport : ",{size:19,color:C.mid}),r(dateRapport,{size:19})],{spacing:{after:60}}),

  // ── 01 PERSONNALITÉ
  br(), ...chapterBand("01","Personnalit\u00e9 \u2014 Enneagramme"),
  subhead("Profil Enneagramme"),
  callout(ch01.callout),
  blank(80),
  p([r(ch01.para1)]),
  p([r(ch01.para2)]),
  p([r(ch01.intro_bullets)]),
  ...ch01.bullets.map(b => bullet(b)),
  blank(120),
  subhead("Bases & Sous-type"),
  profileTable([["\u00c9l\u00e9ment","R\u00e9sultat"], ...ch01.table_rows]),
  blank(120),
  subhead("Mots-cl\u00e9s de personnalit\u00e9"),
  ...ch01.mots_cles.map(m => bullet(m)),

  // ── 02 CONTEXTE PRO
  br(), ...chapterBand("02","En contexte professionnel"),
  callout(ch02.callout),
  blank(80),
  subhead("Tes forces cl\u00e9s"),
  p([r(ch02.forces_intro)]),
  ...ch02.forces.map(f => bullet(f)),
  blank(120),
  subhead("Tes besoins cl\u00e9s en environnement de travail"),
  p([r(ch02.besoins_intro)]),
  ...ch02.besoins.map(b => bullet(b)),

  // ── 03 MBTI
  br(), ...chapterBand("03","Comp\u00e9tences \u2014 MBTI"),
  subhead("Ton profil MBTI"),
  callout(ch03.callout),
  blank(80),
  p([r(ch03.para1)]),
  p([r(ch03.para2)]),
  blank(120),
  subhead("Type & Dimensions"),
  profileTable([["Dimension","Pr\u00e9f\u00e9rence"], ...ch03.table_rows]),
  blank(120),
  subhead("Ton style d'apprentissage"),
  p([r(ch03.apprentissage_intro)]),
  ...ch03.apprentissage.map(a => bullet(a)),

  // ── 04 COMPÉTENCES CLÉS
  br(), ...chapterBand("04","Comp\u00e9tences cl\u00e9s"),
  blank(80),
  p([r(ch04.intro)]),
  blank(120),
  itemListTable(ch04.items),

  // ── 05 RIASEC
  br(), ...chapterBand("05","RIASEC \u2014 Profil d'int\u00e9r\u00eats"),
  subhead("Ton profil dominant"),
  callout(ch05.callout),
  blank(80),
  p([r(ch05.para1)]),
  p([r(ch05.para2)]),
  blank(120),
  subhead("Tes r\u00e9sultats RIASEC"),
  profileTable([["Lettre","Dimension & Signification pour toi"], ...ch05.table_rows]),
  blank(120),
  subhead("Ce que \u00e7a implique pour ton orientation"),
  p([r(ch05.implications_intro)]),
  ...ch05.implications.map(i => bullet(i)),

  // ── 06 BESOINS FONDAMENTAUX
  br(), ...chapterBand("06","Besoins fondamentaux"),
  blank(80),
  p([r(ch06.intro)]),
  blank(120),
  itemListTable(ch06.items),
  blank(120),
  subhead("Ce qui doit \u00eatre pr\u00e9sent"),
  p([r(ch06.checklist_intro)]),
  ...ch06.checklist.map(c => bullet(c)),

  // ── 07 PISTES
  br(), ...chapterBand("07","Pistes de m\u00e9tiers & formations"),
  blank(80),
  p([r(ch07.intro)]),
  ...(ch07.pistes || []).flatMap(piste => [
    ...pisteBlock(piste.num, piste.metier, piste.justification),
    blank(80),
    subhead("Formation & \u00c9coles"),
    ...(piste.formations||[]).map(f => bullet(f)),
    subhead("Argumentaire crois\u00e9"),
    bullet(piste.argumentaire.riasec),
    bullet(piste.argumentaire.ennea),
    bullet(piste.argumentaire.mbti),
    subhead("3 actions concr\u00e8tes"),
    ...(piste.actions||[]).map(a => bullet(a)),
  ]),

  // ── 08 PLAN D'ACTION
  br(), ...chapterBand("08","Plan d'action"),
  blank(80),
  p([r(ch08.texte)]),
  ...(ch08.valeurs.length ? [
    blank(120),
    subhead("Tes valeurs"),
    p([r("Ces valeurs ont \u00e9t\u00e9 identifi\u00e9es en s\u00e9ance et guident tes choix d'orientation.")]),
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
    children:[r("BRENSO",{size:36,bold:true,color:C.blue})],
  }),
  p([r("Coaching & Training",{size:24,color:C.mid,italic:true})],{spacing:{after:60}}),
  blank(200),
  p([r("B\u00e9n\u00e9dicte Vanden Bossche",{size:22,bold:true})],{spacing:{after:60}}),
  p([r("Coach d'orientation certifi\u00e9e",{size:20,italic:true,color:C.mid})],{spacing:{after:60}}),
  p([r("Ixelles, Belgique",{size:19,color:C.mid})],{spacing:{after:60}}),
  blank(80),
  new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:2,color:C.greyBorder}},spacing:{before:80,after:80},children:[r("",{size:4})]}),
  p([r("www.brenso.be",{size:19,color:C.blue})],{spacing:{after:40}}),
  p([r("contact@brenso.be",{size:19,color:C.mid})],{spacing:{after:40}}),
  blank(400),
  p([r("Ce document est confidentiel. Il est destin\u00e9 exclusivement \u00e0 ",{size:17,color:C.mid})],{spacing:{after:0}}),
  p([r(prenom+" "+q.nom+" et \u00e0 ses parents ou repr\u00e9sentants l\u00e9gaux.",{size:17,color:C.mid})],{spacing:{after:0}}),
];

const doc = new Document({
  numbering: { config:[{ reference:"brenso-bullets", levels:[{
    level:0, format:LevelFormat.BULLET, text:"\u203a", alignment:AlignmentType.LEFT,
    style:{ run:{font:"Calibri",size:22,color:C.blue,bold:true}, paragraph:{indent:{left:560,hanging:280}} },
  }]}] },
  styles:{ default:{ document:{ run:{font:"Calibri",size:22,color:C.dark} } } },
  sections:[{
    properties:{ page:{ size:{width:PAGE.w,height:PAGE.h}, margin:{top:PAGE.mTop,bottom:PAGE.mBottom,left:PAGE.mLeft,right:PAGE.mRight} } },
    headers:{ default:docHeader },
    footers:{ default:docFooter },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = process.argv[3] || 'brenso-raport.docx';
  fs.writeFileSync(outPath, buf);
  console.log(`Rapport g\u00e9n\u00e9r\u00e9 : ${outPath} (${Math.round(buf.length/1024)} KB)`);
});
