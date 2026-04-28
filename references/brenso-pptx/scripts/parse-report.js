/**
 * BRENSO Report Parser
 * --------------------
 * Extracts ALL structured data from an orientation report.
 * RULE: Every piece of text in the PPTX comes from THIS parser.
 *       If the Word doesn't contain a value, "[Non renseigne]" is returned.
 */

function parseReport(text) {
  const lines = text.split("\n");
  const branding = extractBranding(text);
  const cover = extractCover(lines);
  const chapters = extractChapters(text);
  const coachWord = extractCoachWord(text);
  const values = extractValues(text);
  const qualities = extractQualities(chapters);
  return { branding, cover, chapters, coachWord, values, qualities };
}

// ═══════════════════════════════════════════════════════════════════
// BRANDING — company name, URL, email, doc title from the Word
// ═══════════════════════════════════════════════════════════════════

function extractBranding(text) {
  const branding = {
    company: "",
    docTitle: "",
    url: "",
    email: "",
    location: "",
    confidential: "",
  };

  // Doc title: "RAPPORT D'ORIENTATION" or similar ALL-CAPS title
  const titleMatch = text.match(/^(RAPPORT[A-ZÀ-Ü\s'']{5,})$/m);
  if (titleMatch) branding.docTitle = titleMatch[1].trim();

  // Company name: "X Coaching & Training" or similar
  const companyPatterns = [
    /^([A-ZÀ-Ü][A-ZÀ-Üa-zà-ü]*(?:\s+[A-ZÀ-Ü&][A-ZÀ-Üa-zà-ü]*)*\s+(?:Coaching|Training|Consulting|Conseil|Formation)[^\n]*)/m,
    /^([^\n]{5,40})\s*\n\s*Rapport/m,
  ];
  for (const pat of companyPatterns) {
    const m = text.match(pat);
    if (m) { branding.company = m[1].trim(); break; }
  }

  // URL
  const urlMatch = text.match(/(www\.[a-z0-9.-]+\.[a-z]{2,})/i);
  if (urlMatch) branding.url = urlMatch[1];

  // Email
  const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  if (emailMatch) branding.email = emailMatch[1];

  // Location (city near the end of doc, before www/email)
  const locMatch = text.match(/([A-ZÀ-Ü][a-zà-ü]+(?:,\s*[A-ZÀ-Ü][a-zà-ü]+)?)\s*\n\s*(?:www\.|[a-z]+@)/);
  if (locMatch) branding.location = locMatch[1].trim();

  // Confidentiality notice
  const confMatch = text.match(/(Ce document est confidentiel[^\n]*)/i);
  if (confMatch) branding.confidential = confMatch[1].trim();

  return branding;
}

// ═══════════════════════════════════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════════════════════════════════

function extractCover(lines) {
  const cover = {
    name: "", dob: "", formation: "", orientation: "",
    enneagramme: "", mbti: "", riasec: "", coach: "", date: "",
  };
  const fullText = lines.join("\n");

  const patterns = {
    name:         [/Préparé pour\s*\n\s*(.+)/i],
    dob:          [/Date de naissance\s*:\s*(.+)/i],
    formation:    [/Formation\s*:\s*(.+)/i],
    orientation:  [/Orientation actuelle\s*:\s*(.+)/i],
    enneagramme:  [/Enneagramme\s*:\s*(.+)/i],
    mbti:         [/MBTI\s*:\s*(.+)/i],
    riasec:       [/RIASEC\s*:\s*(.+)/i],
    coach:        [/Coach\s*:\s*(.+)/i],
    date:         [/Date du rapport\s*:\s*(.+)/i],
  };

  for (const [key, pats] of Object.entries(patterns)) {
    for (const pat of pats) {
      const m = fullText.match(pat);
      if (m) { cover[key] = m[1].trim(); break; }
    }
  }

  return cover;
}

// ═══════════════════════════════════════════════════════════════════
// CHAPTERS
// ═══════════════════════════════════════════════════════════════════

function extractChapters(text) {
  const chapterRegex = /(\d{2})\s*·\s*([A-ZÀ-Ü\s—&''·\-]+)/g;
  const matches = [];
  let match;
  while ((match = chapterRegex.exec(text)) !== null) {
    matches.push({ index: match.index, num: match[1], rawTitle: match[2].trim() });
  }

  const seen = new Set();
  const unique = matches.filter((m) => {
    if (seen.has(m.num)) return false;
    seen.add(m.num); return true;
  });

  return unique.map((ch, i) => {
    const start = ch.index;
    const end = i < unique.length - 1 ? unique[i + 1].index : text.length;
    const content = text.substring(start, end);
    return {
      num: ch.num,
      title: ch.rawTitle.replace(/\s*—\s*$/, "").replace(/\s+/g, " ").trim(),
      callout: extractCallout(content),
      sections: extractSections(content),
      bullets: extractBullets(content),
      keywords: extractKeywords(content),
      tableRows: extractTableRows(content),
      pistes: extractPistes(content),
      rawContent: content,
    };
  });
}

function extractCallout(content) {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  let found = false;
  let out = [];
  for (const line of lines) {
    if (line.match(/^\d{2}\s*·/)) { found = true; continue; }
    if (!found) continue;
    if (line.match(/^[A-ZÀ-Ü\s&''·\-]{5,}$/) && !line.match(/›/)) continue;
    const t = line.trim();
    if (t.match(/^(Document confidentiel|p\.\s*\d)/)) continue;
    if (t.match(/^\f/)) continue;
    if (t.length > 20) { out.push(t); if (out.join(" ").length > 80) break; }
    else if (out.length > 0) break;
  }
  return out.join(" ").substring(0, 300);
}

function extractSections(content) {
  const re = /^([A-ZÀ-Ü][A-ZÀ-Ü\s&''·\-']{4,})$/gm;
  const out = []; let m;
  while ((m = re.exec(content)) !== null) {
    const t = m[1].trim();
    if (!t.match(/^(BRENSO|RAPPORT|DOCUMENT|COACHING)/)) out.push(t);
  }
  return out;
}

function extractBullets(content) {
  const out = []; const re = /›\s+(.+)/g; let m;
  while ((m = re.exec(content)) !== null) out.push(m[1].trim());
  return out;
}

function extractKeywords(content) {
  const kwMatch = content.match(/MOTS-CL[ÉE]S[^\n]*\n([\s\S]*?)(?=\n\n|\f|Document confidentiel)/i);
  if (!kwMatch) return [];
  const out = []; const re = /›\s+(.+)/g; let m;
  while ((m = re.exec(kwMatch[1])) !== null) out.push(m[1].replace(/^›\s*/, "").trim());
  return out;
}

function extractTableRows(content) {
  const rows = [];
  const pats = [
    /^((?:Base|Sous-type|Peur|Désir|Ressource|Dimension|Énergie|Perception|Jugement|Mode|Type|Lettre)[^\n]*?)\s{2,}(.+)$/gm,
    /^([ISNFJTPEA]\s*·\s*[^\n]+?)\s{2,}(.+)$/gm,
  ];
  for (const p of pats) { let m; while ((m = p.exec(content)) !== null) rows.push({ label: m[1].trim(), value: m[2].trim() }); }
  return rows;
}

function extractPistes(content) {
  const re = /PISTE\s+(\d)\s*·?\s*([^\n]+)/gi;
  const pm = []; let m;
  while ((m = re.exec(content)) !== null) pm.push({ num: m[1], title: m[2].trim(), index: m.index });

  return pm.map((p, i) => {
    const section = content.substring(p.index, i < pm.length - 1 ? pm[i + 1].index : content.length);
    const formations = [];
    const fs = section.match(/FORMATION\s*&?\s*[ÉE]COLES?\s*\n([\s\S]*?)(?=ARGUMENTAIRE|3\s*ACTIONS|PISTE\s+\d|\n\n[A-Z]{5,}|$)/i);
    if (fs) {
      for (const line of fs[1].split("\n")) {
        const t = line.replace(/^›\s*/, "").trim();
        if (t.length > 3 && !t.match(/^(Document|BRENSO|Rapport|p\.\s*\d)/)) {
          const short = t.split(/\s*[—–(]\s*/)[0].trim();
          if (short.length > 2 && short.length < 60) formations.push(short);
        }
      }
    }
    return { num: p.num, title: p.title, formations: formations.slice(0, 3) };
  });
}

// ═══════════════════════════════════════════════════════════════════
// COACH WORD
// ═══════════════════════════════════════════════════════════════════

function extractCoachWord(text) {
  const m = text.match(/MOT\s+(?:DU\s+COACH|DE\s+CL[ÔO]TURE)\s*\n([\s\S]*?)(?=BRENSO\s*\n|Ce document est confidentiel|$)/i);
  if (m) {
    const raw = m[1].replace(/Document confidentiel[^\n]*/g, "").replace(/p\.\s*\d+/g, "")
      .replace(/\f/g, "").replace(/BRENSO\s+Coaching[^\n]*/g, "").replace(/Rapport d'orientation/g, "").trim();
    return raw.split("\n").filter((l) => l.trim().length > 10).join(" ").substring(0, 500);
  }
  return "";
}

// ═══════════════════════════════════════════════════════════════════
// VALUES
// ═══════════════════════════════════════════════════════════════════

function extractValues(text) {
  const idx = text.indexOf("TES VALEURS");
  if (idx === -1) return [];
  const chunk = text.substring(idx, idx + 800);
  const values = [];
  for (const line of chunk.split("\n")) {
    const m = line.match(/^\s*›\s+([A-ZÀ-Üa-zà-ü]\S+)/);
    if (m) { const w = m[1].replace(/[—–].*/, "").trim(); if (w.length >= 4) values.push(w); }
  }
  return values;
}

// ═══════════════════════════════════════════════════════════════════
// QUALITIES
// ═══════════════════════════════════════════════════════════════════

function extractQualities(chapters) {
  const q = new Set();
  for (const ch of chapters) {
    for (const kw of ch.keywords) {
      const c = kw.replace(/^›\s*/, "").trim();
      if (c.length > 3 && c.length < 50) q.add(c);
    }
  }
  if (q.size < 6) {
    for (const ch of chapters) {
      if (ch.num === "04" || ch.title.match(/COMP[ÉE]TENCES/i)) {
        for (const s of ch.sections) {
          const c = s.trim();
          if (c.length > 3 && c.length < 35 && !c.match(/^(BRENSO|DOCUMENT|RAPPORT|TON|TES|TYPE|BASE|MOT|CE QUI)/i)) q.add(c);
        }
      }
    }
  }
  return Array.from(q).slice(0, 12);
}

module.exports = { parseReport };

if (require.main === module) {
  const fs = require("fs");
  const input = process.argv[2];
  if (!input) { console.error("Usage: node parse-report.js <file.txt>"); process.exit(1); }
  console.log(JSON.stringify(parseReport(fs.readFileSync(input, "utf-8")), null, 2));
}
