#!/usr/bin/env node
/**
 * Orientation PPTX Generator (template)
 * ──────────────────────────────────────
 * ALL text content comes from the parsed Word/PDF.
 * NOTHING is hardcoded — if the Word doesn't provide a value,
 * a "[...]" placeholder appears so the coach can fill it in.
 *
 * Usage:
 *   node generate-pptx.js <input.docx|pdf> [output.pptx] [--color1=HEX] [--color2=HEX]
 *
 * Dependencies:
 *   npm install pptxgenjs react react-dom react-icons sharp
 *   pip install "markitdown[pptx]" --break-system-packages
 */

const { execSync } = require("child_process");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const { parseReport } = require("./parse-report");

// ═══════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const inputFile = args.find((a) => !a.startsWith("--"));
const outputFile = args.find((a) => !a.startsWith("--") && a !== inputFile) || "rapport-orientation.pptx";
function getArg(n, fb) { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : fb; }

const COLOR1 = getArg("color1", "40A2C0");
const COLOR2 = getArg("color2", "CF3A65");

if (!inputFile) { console.error("Usage: node generate-pptx.js <input> [output] [--color1=HEX] [--color2=HEX]"); process.exit(1); }

// ═══════════════════════════════════════════════════════════════════
// PALETTE (derived from 2 colors — no other colors hardcoded)
// ═══════════════════════════════════════════════════════════════════

function hexToRgb(h) { return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) }; }
function rgbToHex(r,g,b) { return [r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join(""); }
function lighten(h,a) { const {r,g,b}=hexToRgb(h); return rgbToHex(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a); }
function darken(h,a) { const {r,g,b}=hexToRgb(h); return rgbToHex(r*(1-a),g*(1-a),b*(1-a)); }

const P = {
  H1: COLOR1, H2: COLOR2,
  DARK: "2B2D42", BODY: "4A4A5A", WHITE: "FFFFFF", BG: "F7F5F0",
  H1L: lighten(COLOR1, 0.85), H2L: lighten(COLOR2, 0.85),
};

// ═══════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════

const FA = require("react-icons/fa");
const CH_ICONS = { "01":"FaShieldAlt","02":"FaBriefcase","03":"FaBrain","04":"FaStar","05":"FaCompass","06":"FaHeart","07":"FaRocket","08":"FaAward" };
const DT_ICONS = ["FaEye","FaLock","FaComments","FaCheckCircle","FaLightbulb","FaHandsHelping","FaUsers","FaGraduationCap","FaTv","FaChalkboardTeacher","FaBalanceScale","FaGem"];

async function icon(name, color, sz=256) {
  const C = FA[name]; if (!C) return null;
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(C, {color, size:String(sz)}));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const S = () => ({ type:"outer", blur:6, offset:2, angle:135, color:"000000", opacity:0.10 });

// ═══════════════════════════════════════════════════════════════════
// HELPER: safe text — returns placeholder if empty
// ═══════════════════════════════════════════════════════════════════

function safe(val, placeholder = "[Non renseigne]") {
  return (val && val.trim()) ? val.trim() : placeholder;
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE (all from data.branding + data.cover)
// ═══════════════════════════════════════════════════════════════════

async function slideTitre(pres, data, ic) {
  const sl = pres.addSlide();
  sl.background = { color: P.BG };

  sl.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:10,h:2.8, fill:{color:P.H1} });
  sl.addShape(pres.shapes.RECTANGLE, { x:0,y:2.5,w:10,h:0.6, fill:{color:P.H2}, rotate:-1.5 });

  // Title from Word header (e.g. "RAPPORT D'ORIENTATION")
  sl.addText(safe(data.branding.docTitle, "[TITRE DU DOCUMENT]"), {
    x:0.8,y:0.5,w:8.4,h:0.8,
    fontSize:36, fontFace:"Trebuchet MS", bold:true, color:P.WHITE, charSpacing:4,
  });

  // Company from Word (e.g. "BRENSO Coaching & Training")
  sl.addText(safe(data.branding.company, "[Nom entreprise]"), {
    x:0.8,y:1.3,w:8.4,h:0.5,
    fontSize:18, fontFace:"Calibri", color:P.WHITE, italic:true,
  });

  if (ic.title) sl.addImage({ data:ic.title, x:8.8,y:0.6,w:0.7,h:0.7 });

  // Info cards — only show what the Word provides
  const cards = [];
  if (data.cover.dob) cards.push({ label:"Date de naissance", value:data.cover.dob });
  if (data.cover.formation) cards.push({ label:"Formation", value:data.cover.formation });
  if (data.cover.enneagramme) cards.push({ label:"Enneagramme", value:data.cover.enneagramme });
  if (data.cover.mbti) cards.push({ label:"MBTI", value:data.cover.mbti });
  if (data.cover.riasec && cards.length < 4) cards.push({ label:"RIASEC", value:data.cover.riasec });

  const cW = cards.length > 0 ? Math.min(2.15,(9/cards.length)-0.2) : 2.15;
  cards.slice(0,4).forEach((c,i)=>{
    const cx = 0.5+i*(cW+0.2);
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:3.4,w:cW,h:1.1, fill:{color:P.WHITE}, shadow:S() });
    sl.addText(c.label, { x:cx+0.1,y:3.5,w:cW-0.2,h:0.35, fontSize:9,fontFace:"Calibri",color:P.H1,bold:true,margin:0 });
    sl.addText(c.value, { x:cx+0.1,y:3.85,w:cW-0.2,h:0.55, fontSize:11,fontFace:"Calibri",color:P.DARK,margin:0 });
  });

  // Footer: coach + date from Word
  const parts = [];
  if (data.cover.coach) parts.push("Coach : " + data.cover.coach);
  if (data.cover.date) parts.push(data.cover.date);
  sl.addText(parts.length > 0 ? parts.join("  \u00B7  ") : "[Coach]  \u00B7  [Date]", {
    x:0.5,y:5.0,w:9,h:0.4, fontSize:10,fontFace:"Calibri",color:P.BODY,italic:true,
  });
}

// ═══════════════════════════════════════════════════════════════════
// CHAPTER HEADER — reused on every content slide
// ═══════════════════════════════════════════════════════════════════

function addChapterHeader(sl, pres, ch, chIcon) {
  sl.background = { color: P.BG };
  sl.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:0.12,h:5.625, fill:{color:P.H1} });
  if (chIcon) sl.addImage({ data:chIcon, x:0.5,y:0.3,w:0.45,h:0.45 });
  sl.addText(`${ch.num} \u00B7 ${ch.title}`, {
    x:1.1,y:0.3,w:8.4,h:0.5, fontSize:24,fontFace:"Trebuchet MS",bold:true,color:P.H1,margin:0,
  });
}

// subtitle: use callout from Word, truncated
function addSubtitle(sl, text) {
  if (!text) return;
  const sub = text.length > 80 ? text.substring(0,77)+"..." : text;
  sl.addText(sub, { x:1.1,y:0.8,w:8.4,h:0.4, fontSize:13,fontFace:"Calibri",color:P.H2,bold:true,margin:0 });
}

// ═══════════════════════════════════════════════════════════════════
// GENERIC CHAPTER SLIDE — picks layout by content
// ═══════════════════════════════════════════════════════════════════

async function slideChapter(pres, ch, ic, dIcons) {
  const sl = pres.addSlide();
  addChapterHeader(sl, pres, ch, ic[`ch_${ch.num}`]);
  addSubtitle(sl, ch.callout);

  if (ch.pistes && ch.pistes.length > 0) layoutPistes(sl,pres,ch,dIcons);
  else if (ch.keywords.length > 0 && ch.bullets.length > 0) layoutTwoCol(sl,pres,ch,dIcons);
  else if (ch.bullets.length >= 6) layoutGrid(sl,pres,ch,dIcons);
  else if (ch.bullets.length > 0) layoutStacked(sl,pres,ch,dIcons);
  else layoutSections(sl,pres,ch,dIcons);

  return sl;
}

// ── Two columns: bullet cards + keywords ────────────────────────

function layoutTwoCol(sl,pres,ch,di) {
  ch.bullets.slice(0,3).forEach((b,i)=>{
    const cy = 1.5+i*1.2;
    sl.addShape(pres.shapes.RECTANGLE, { x:0.5,y:cy,w:5.3,h:1.0, fill:{color:P.WHITE},shadow:S() });
    if (di[i]) sl.addImage({ data:di[i], x:0.7,y:cy+0.25,w:0.4,h:0.4 });
    const p = b.split(/\s*[—–:]\s*/);
    sl.addText(p[0].substring(0,40), { x:1.25,y:cy+0.08,w:4.3,h:0.35, fontSize:13,fontFace:"Calibri",bold:true,color:P.DARK,margin:0 });
    if (p.length>1) sl.addText(p.slice(1).join(" ").substring(0,100), { x:1.25,y:cy+0.45,w:4.3,h:0.45, fontSize:10.5,fontFace:"Calibri",color:P.BODY,margin:0 });
  });

  sl.addShape(pres.shapes.RECTANGLE, { x:6.1,y:1.5,w:3.5,h:3.6, fill:{color:P.H1L},shadow:S() });
  const kwTitle = ch.sections.find(s=>s.match(/MOTS/i)) || "MOTS-CL\u00C9S";
  sl.addText(kwTitle, { x:6.3,y:1.6,w:3.1,h:0.4, fontSize:12,fontFace:"Trebuchet MS",bold:true,color:P.H1,margin:0 });
  sl.addText(
    ch.keywords.slice(0,6).map(k=>({ text:k, options:{ breakLine:true, bullet:true, fontSize:11, color:P.DARK, fontFace:"Calibri", paraSpaceAfter:6 } })),
    { x:6.3,y:2.1,w:3.1,h:2.8,margin:0 }
  );
}

// ── Grid 2x2 ────────────────────────────────────────────────────

function layoutGrid(sl,pres,ch,di) {
  ch.bullets.slice(0,4).forEach((b,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const cx=0.5+col*4.6, cy=1.5+row*1.65;
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:cy,w:4.3,h:1.35, fill:{color:P.WHITE},shadow:S() });
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:cy,w:0.07,h:1.35, fill:{color:P.H2} });
    if (di[i]) sl.addImage({ data:di[i], x:cx+0.25,y:cy+0.25,w:0.4,h:0.4 });
    const p = b.split(/\s*[—–:]\s*/);
    sl.addText(p[0].substring(0,45), { x:cx+0.8,y:cy+0.12,w:3.3,h:0.35, fontSize:13,fontFace:"Calibri",bold:true,color:P.DARK,margin:0 });
    if (p.length>1) sl.addText(p.slice(1).join(" ").substring(0,120), { x:cx+0.8,y:cy+0.5,w:3.3,h:0.7, fontSize:10.5,fontFace:"Calibri",color:P.BODY,margin:0 });
  });
  // Bottom insight from callout (dynamic, not hardcoded)
  if (ch.callout && ch.callout.length > 30) {
    sl.addShape(pres.shapes.RECTANGLE, { x:0.5,y:4.9,w:9,h:0.5, fill:{color:P.H1L} });
    sl.addText(ch.callout.substring(0,120), { x:0.7,y:4.9,w:8.6,h:0.5, fontSize:11,fontFace:"Calibri",italic:true,color:P.H1,margin:0,valign:"middle" });
  }
}

// ── Stacked cards ───────────────────────────────────────────────

function layoutStacked(sl,pres,ch,di) {
  const items = ch.bullets.slice(0,5);
  const cH = Math.min(0.85, 3.5/items.length);
  items.forEach((b,i)=>{
    const cy = 1.5+i*(cH+0.15);
    sl.addShape(pres.shapes.RECTANGLE, { x:0.5,y:cy,w:9,h:cH, fill:{color:P.WHITE},shadow:S() });
    sl.addShape(pres.shapes.RECTANGLE, { x:0.5,y:cy,w:0.07,h:cH, fill:{color:i%2===0?P.H1:P.H2} });
    if (di[i]) sl.addImage({ data:di[i], x:0.75,y:cy+(cH-0.4)/2,w:0.4,h:0.4 });
    sl.addText(b.substring(0,150), { x:1.3,y:cy,w:7.9,h:cH, fontSize:11,fontFace:"Calibri",color:P.DARK,margin:0,valign:"middle" });
  });
}

// ── Section list (fallback) ─────────────────────────────────────

function layoutSections(sl,pres,ch,di) {
  ch.sections.slice(0,6).forEach((s,i)=>{
    const cy = 1.5+i*0.7;
    if (di[i]) sl.addImage({ data:di[i], x:0.6,y:cy+0.05,w:0.4,h:0.4 });
    sl.addText(s, { x:1.2,y:cy,w:8,h:0.5, fontSize:14,fontFace:"Calibri",bold:true,color:P.DARK,margin:0,valign:"middle" });
  });
}

// ── Pistes layout (3 columns) ───────────────────────────────────

function layoutPistes(sl,pres,ch,di) {
  const pistes = ch.pistes.slice(0,3);
  pistes.forEach((p,i)=>{
    const cx = 0.5+i*3.15, color = i%2===0?P.H1:P.H2, bgL = i%2===0?P.H1L:P.H2L;
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:1.4,w:2.9,h:3.8, fill:{color:P.WHITE},shadow:S() });
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:1.4,w:2.9,h:1.1, fill:{color} });
    if (di[i]) sl.addImage({ data:di[i], x:cx+1.1,y:1.55,w:0.5,h:0.5 });
    sl.addText(p.title.substring(0,40), { x:cx+0.15,y:2.1,w:2.6,h:0.35, fontSize:10,fontFace:"Calibri",bold:true,color:P.WHITE,align:"center",margin:0 });
    sl.addText(`PISTE ${p.num}`, { x:cx+0.15,y:2.65,w:2.6,h:0.3, fontSize:10,fontFace:"Trebuchet MS",bold:true,color,align:"center",margin:0 });
    p.formations.slice(0,3).forEach((f,j)=>{
      sl.addShape(pres.shapes.RECTANGLE, { x:cx+0.3,y:3.1+j*0.55,w:2.3,h:0.4, fill:{color:bgL} });
      sl.addText(f.substring(0,25), { x:cx+0.3,y:3.1+j*0.55,w:2.3,h:0.4, fontSize:10,fontFace:"Calibri",color:P.DARK,align:"center",valign:"middle",margin:0 });
    });
  });
  // Bottom insight from chapter callout (dynamic)
  if (ch.callout) {
    sl.addText(ch.callout.substring(0,100), {
      x:0.5,y:5.15,w:9,h:0.3, fontSize:11,fontFace:"Calibri",italic:true,color:P.H2,margin:0,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// SPECIAL SLIDES (Competences, RIASEC, Besoins, Valeurs)
// ═══════════════════════════════════════════════════════════════════

async function slideCompetences(pres, ch, ic, cIcons) {
  const sl = pres.addSlide();
  addChapterHeader(sl,pres,ch,ic[`ch_${ch.num}`]);

  let comps = ch.sections.filter(s=> s.length<40 && !s.match(/^(BRENSO|DOCUMENT|RAPPORT|TON|TES|TYPE|BASE|MOT|CE QUI)/i));
  if (comps.length<4) comps = ch.bullets.map(b=>b.split(/\s*[—–:]\s*/)[0].substring(0,30));
  comps = comps.slice(0,8);

  sl.addText(`${comps.length} forces identifi\u00E9es`, { x:1.1,y:0.8,w:5,h:0.4, fontSize:14,fontFace:"Calibri",color:P.H2,bold:true,margin:0 });

  const cols = Math.min(4,comps.length), colW = (9/cols)-0.15;
  comps.forEach((c,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const cx=0.5+col*(colW+0.15), cy=1.4+row*1.85;
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:cy,w:colW,h:1.55, fill:{color:P.WHITE},shadow:S() });
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:cy,w:colW,h:0.06, fill:{color:row===0?P.H1:P.H2} });
    if (cIcons[i]) sl.addImage({ data:cIcons[i], x:cx+(colW-0.55)/2,y:cy+0.2,w:0.55,h:0.55 });
    sl.addText(c, { x:cx+0.1,y:cy+0.85,w:colW-0.2,h:0.6, fontSize:11,fontFace:"Calibri",bold:true,color:P.DARK,align:"center",valign:"top",margin:0 });
  });
}

async function slideRiasec(pres, ch, ic, di) {
  const sl = pres.addSlide();
  addChapterHeader(sl,pres,ch,ic[`ch_${ch.num}`]);

  // Extract dominant letter from chapter content
  const riasecNames = { R:"R\u00C9ALISTE",I:"INVESTIGATEUR",A:"ARTISTIQUE",S:"SOCIAL",E:"ENTREPRENANT",C:"CONVENTIONNEL" };
  let letter="?", name="[Non renseigne]";
  for (const L of "RIASEC") {
    if (ch.rawContent.match(new RegExp(`${L}\\s*·\\s*\\w+.*dominant`,"i"))) { letter=L; name=riasecNames[L]; break; }
  }
  const coverR = ch.rawContent.match(/([RIASEC])\s*·\s*(\w+)\s*\(dominant/i);
  if (coverR) { letter=coverR[1]; name=coverR[2].toUpperCase(); }

  sl.addShape(pres.shapes.OVAL, { x:0.8,y:1.6,w:2.8,h:2.8, fill:{color:P.H1,transparency:10} });
  sl.addText(letter, { x:0.8,y:1.6,w:2.8,h:2.0, fontSize:72,fontFace:"Trebuchet MS",bold:true,color:P.H1,align:"center",valign:"middle",margin:0 });
  sl.addText(name, { x:0.8,y:3.3,w:2.8,h:0.4, fontSize:16,fontFace:"Trebuchet MS",bold:true,color:P.H1,align:"center",margin:0 });
  sl.addText("Dominant", { x:0.8,y:3.7,w:2.8,h:0.3, fontSize:11,fontFace:"Calibri",color:P.H2,align:"center",italic:true,margin:0 });

  ch.bullets.slice(0,3).forEach((b,i)=>{
    const cy = 1.5+i*1.15;
    sl.addShape(pres.shapes.RECTANGLE, { x:4.2,y:cy,w:5.3,h:0.95, fill:{color:P.WHITE},shadow:S() });
    sl.addShape(pres.shapes.RECTANGLE, { x:4.2,y:cy,w:0.07,h:0.95, fill:{color:P.H1} });
    const p = b.split(/\s*[—–:]\s*/);
    sl.addText(p[0].substring(0,50), { x:4.5,y:cy+0.08,w:4.8,h:0.35, fontSize:13,fontFace:"Calibri",bold:true,color:P.DARK,margin:0 });
    if (p.length>1) sl.addText(p.slice(1).join(" ").substring(0,100), { x:4.5,y:cy+0.45,w:4.8,h:0.4, fontSize:10.5,fontFace:"Calibri",color:P.BODY,margin:0 });
  });

  // Bottom insight from chapter content (dynamic)
  const insight = ch.bullets.find(b=>b.match(/environnement|solitaire|proc[ée]dur/i)) || ch.callout.substring(0,120);
  if (insight) {
    sl.addShape(pres.shapes.RECTANGLE, { x:0.5,y:4.85,w:9,h:0.55, fill:{color:P.H2L} });
    sl.addText(insight.substring(0,120), { x:0.7,y:4.85,w:8.6,h:0.55, fontSize:11,fontFace:"Calibri",italic:true,color:P.H2,margin:0,valign:"middle" });
  }
}

async function slideBesoins(pres, ch, ic, di) {
  const sl = pres.addSlide();
  addChapterHeader(sl,pres,ch,ic[`ch_${ch.num}`]);

  // Subtitle from chapter callout (dynamic, not hardcoded)
  addSubtitle(sl, ch.callout);

  let besoins = ch.sections.filter(s=> s.length<40 && !s.match(/^(BRENSO|DOCUMENT|CE QUI|TON|TES)/i));
  if (besoins.length<3) besoins = ch.bullets.map(b=>b.substring(0,35));
  besoins = besoins.slice(0,6);
  const cols = Math.min(3,besoins.length);

  besoins.forEach((b,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const colW = (9/cols)-0.15;
    const cx=0.5+col*(colW+0.15), cy=1.4+row*1.7;
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:cy,w:colW,h:1.4, fill:{color:P.WHITE},shadow:S() });
    sl.addShape(pres.shapes.RECTANGLE, { x:cx,y:cy,w:colW,h:0.06, fill:{color:i<cols?P.H1:P.H2} });
    if (di[i]) sl.addImage({ data:di[i], x:cx+(colW-0.5)/2,y:cy+0.2,w:0.5,h:0.5 });
    sl.addText(b, { x:cx+0.15,y:cy+0.8,w:colW-0.3,h:0.45, fontSize:12,fontFace:"Calibri",bold:true,color:P.DARK,align:"center",margin:0 });
  });

  // Bottom bar — insight from chapter content (dynamic)
  const insightBullet = ch.bullets.find(b=>b.match(/absence|perte|énergie|confiance/i));
  if (insightBullet) {
    sl.addShape(pres.shapes.RECTANGLE, { x:0.5,y:4.85,w:9,h:0.55, fill:{color:P.H1L} });
    sl.addText(insightBullet.substring(0,120), { x:0.7,y:4.85,w:8.6,h:0.55, fontSize:11,fontFace:"Calibri",italic:true,color:P.H1,margin:0,valign:"middle" });
  }
}

async function slideValeurs(pres, data, ic) {
  const sl = pres.addSlide();
  const lastCh = data.chapters[data.chapters.length-1];
  if (lastCh) {
    addChapterHeader(sl,pres,lastCh,ic[`ch_${lastCh.num}`]);
    addSubtitle(sl, lastCh.callout);
  } else {
    sl.background = { color: P.BG };
  }

  // Values in circles — all from data.values (parsed from Word)
  const vals = data.values.slice(0,5);
  if (vals.length > 0) {
    const gap = 9.3/vals.length;
    vals.forEach((v,i)=>{
      const cx = 0.7+i*gap;
      sl.addShape(pres.shapes.OVAL, { x:cx,y:1.4,w:1.5,h:1.5, fill:{color:i%2===0?P.H1:P.H2},shadow:S() });
      sl.addText(v, { x:cx,y:1.4,w:1.5,h:1.5, fontSize:11,fontFace:"Calibri",bold:true,color:P.WHITE,align:"center",valign:"middle",margin:0 });
    });
  }

  // Coach word card — all from data.coachWord (parsed from Word)
  sl.addShape(pres.shapes.RECTANGLE, { x:0.5,y:3.3,w:9,h:2.0, fill:{color:P.WHITE},shadow:S() });
  sl.addShape(pres.shapes.RECTANGLE, { x:0.5,y:3.3,w:0.07,h:2.0, fill:{color:P.H2} });
  if (ic.quote) sl.addImage({ data:ic.quote, x:0.85,y:3.5,w:0.4,h:0.4 });

  // Section title from Word
  const motTitle = (lastCh && lastCh.sections.find(s=>s.match(/MOT/i))) || "MOT DU COACH";
  sl.addText(motTitle, { x:1.4,y:3.5,w:3,h:0.4, fontSize:12,fontFace:"Trebuchet MS",bold:true,color:P.H2,margin:0 });

  sl.addText(safe(data.coachWord, "[Mot du coach non renseigne]").substring(0,250), {
    x:0.85,y:4.0,w:8.3,h:1.1, fontSize:11,fontFace:"Calibri",color:P.BODY,margin:0,italic:true,
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 10 — CONCLUSION (qualities from Word + branding from Word)
// ═══════════════════════════════════════════════════════════════════

async function slideConclusion(pres, data, ic) {
  const sl = pres.addSlide();
  sl.background = { color: P.H1 };
  sl.addShape(pres.shapes.RECTANGLE, { x:0,y:4.8,w:10,h:0.825, fill:{color:P.H2} });

  if (ic.gem) sl.addImage({ data:ic.gem, x:4.4,y:0.6,w:0.8,h:0.8 });

  sl.addText("TES QUALIT\u00C9S, EN UN MOT", {
    x:1,y:1.5,w:8,h:0.6, fontSize:28,fontFace:"Trebuchet MS",bold:true,color:P.WHITE,align:"center",margin:0,charSpacing:3,
  });

  // Quality lines — ALL from parsed keywords/qualities (Word content)
  const allQ = [...data.qualities];
  for (const ch of data.chapters) { for (const kw of ch.keywords) { if (!allQ.includes(kw)) allQ.push(kw); } }

  const lines = [];
  for (let i=0; i<Math.min(allQ.length,9); i+=3) lines.push(allQ.slice(i,i+3).join("  \u00B7  "));

  lines.slice(0,3).forEach((q,i)=>{
    sl.addText(q, { x:1,y:2.4+i*0.55,w:8,h:0.45, fontSize:18,fontFace:"Calibri",color:P.WHITE,align:"center",margin:0,bold:i===1 });
  });

  // Closing phrase from coachWord last sentence (dynamic)
  const closingPhrase = extractClosing(data.coachWord);
  sl.addText(closingPhrase, {
    x:1,y:4.0,w:8,h:0.5, fontSize:14,fontFace:"Calibri",italic:true,color:P.WHITE,align:"center",margin:0,
  });

  // Footer: company + coach + URL — ALL from Word
  const fp = [];
  fp.push(safe(data.branding.company, "[Nom entreprise]"));
  if (data.cover.coach) fp.push(data.cover.coach);
  if (data.branding.url) fp.push(data.branding.url);
  if (data.branding.email) fp.push(data.branding.email);
  sl.addText(fp.join("  \u00B7  "), {
    x:1,y:4.9,w:8,h:0.4, fontSize:10,fontFace:"Calibri",color:P.WHITE,align:"center",margin:0,
  });
}

// Extract a closing phrase from the coach word (last sentence or fallback)
function extractClosing(coachWord) {
  if (!coachWord) return "[Phrase de conclusion]";
  // Try to find a sentence starting with "Tu" near the end
  const sentences = coachWord.split(/(?<=[.!?])\s+/);
  const closing = sentences.reverse().find(s => s.match(/^Tu\s/i));
  if (closing) return closing.substring(0, 120);
  // Fallback: last sentence
  if (sentences.length > 0) return sentences[0].substring(0, 120);
  return "[Phrase de conclusion]";
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log(`[1/5] Parsing ${inputFile}...`);
  const rawText = execSync(`python -m markitdown "${inputFile}"`, { encoding:"utf-8", maxBuffer:10*1024*1024 });
  const data = parseReport(rawText);

  console.log(`       Company : ${data.branding.company || "(placeholder)"}`);
  console.log(`       Name    : ${data.cover.name || "(placeholder)"}`);
  console.log(`       Chapters: ${data.chapters.length}`);
  console.log(`       Values  : ${data.values.length}`);

  console.log("[2/5] Rendering icons...");
  const ic = {};
  for (const ch of data.chapters) { ic[`ch_${ch.num}`] = await icon(CH_ICONS[ch.num]||"FaStar",`#${P.H1}`); }
  const di1=[],di2=[],ci=[];
  for (let i=0;i<DT_ICONS.length;i++) {
    di1.push(await icon(DT_ICONS[i],`#${P.H1}`));
    di2.push(await icon(DT_ICONS[i],`#${P.H2}`));
    ci.push(await icon(DT_ICONS[i],i<6?`#${P.H1}`:`#${P.H2}`));
  }
  ic.title = await icon("FaShieldAlt","#FFFFFF");
  ic.quote = await icon("FaQuoteLeft",`#${P.H1}`);
  ic.award = await icon("FaAward",`#${P.H2}`);
  ic.gem   = await icon("FaGem","#FFFFFF");

  console.log("[3/5] Building slides...");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = safe(data.branding.company, "Coaching & Training");
  pres.title  = safe(data.branding.docTitle, "Rapport d'orientation");

  // SLIDE 1 — TITLE
  await slideTitre(pres, data, ic);

  // SLIDES 2-9 — CHAPTERS (1 slide per chapter, layout auto-selected)
  for (const ch of data.chapters) {
    const t = ch.title;
    if (t.match(/VALEURS|PLAN/i))       await slideValeurs(pres, data, ic);
    else if (t.match(/COMP[ÉE]TENCES/i)) await slideCompetences(pres, ch, ic, ci);
    else if (t.match(/RIASEC/i))          await slideRiasec(pres, ch, ic, di1);
    else if (t.match(/BESOINS/i))         await slideBesoins(pres, ch, ic, di1);
    else                                  await slideChapter(pres, ch, ic, di1);
  }

  // SLIDE 10 — CONCLUSION
  await slideConclusion(pres, data, ic);

  console.log(`[4/5] Writing ${outputFile}...`);
  await pres.writeFile({ fileName: outputFile });
  console.log(`[5/5] Done! -> ${outputFile}`);
}

main().catch(err=>{ console.error("Error:",err.message); process.exit(1); });
