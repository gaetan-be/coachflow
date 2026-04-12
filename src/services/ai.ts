import OpenAI from 'openai';
import { config } from '../config';

const client = new OpenAI({ apiKey: config.openaiApiKey, baseURL: config.openaiBaseUrl });

interface ProfileData {
  prenom: string;
  nom: string;
  age?: string;
  ecole_nom?: string;
  loisirs?: string;
  choix?: string;
  notes_coach?: string;
}

async function complete(prompt: string): Promise<string> {
  console.log('[AI] ── Request ──');
  console.log('[AI] Endpoint:', config.openaiBaseUrl);
  console.log('[AI] Model:', config.openaiModel);
  console.log('[AI] Prompt:', prompt);

  const response = await client.chat.completions.create({
    model: config.openaiModel,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0]?.message?.content || '';
  console.log('[AI] ── Response ──');
  console.log('[AI]', content);

  return content;
}

export async function generateEnneagrammeChapter(
  profile: ProfileData,
  enneaCodes: string[],
  enneaSousType: string | null,
  wordCount: number,
  templateContent: string | null = null,
): Promise<string> {
  const sousTypeText = enneaSousType ? ` avec un sous-type ${enneaSousType}` : '';
  const typesDescription = enneaCodes
    .map((code, i) => `${i + 1}. Type ${code}`)
    .join(', ');

  const templateBlock = templateContent
    ? `\nVoici les fiches de référence pour les types Ennéagramme identifiés. Base-toi sur ce contenu pour tes explications :\n\n---\n${templateContent}\n---\n`
    : '';

  const consignes = templateContent
    ? `- Base tes explications sur les fiches de référence ci-dessus : reprends les forces, motivations, peurs, environnements de travail et secteurs affinitaires qui y figurent
- Personnalise le texte en faisant des liens concrets avec les loisirs, centres d'intérêt et orientations envisagées du jeune
- Ne recopie pas les fiches mot pour mot : reformule, synthétise et adapte le contenu au contexte du jeune
- Mets en avant l'interaction entre les types dominants et ce que cela signifie pour l'orientation`
    : `- Explique les forces et les caractéristiques des types identifiés dans le contexte de l'orientation scolaire et professionnelle
- Mets en avant l'interaction entre les types dominants
- Fais des liens concrets avec les loisirs et centres d'intérêt mentionnés si disponibles`;

  return complete(`Tu es une coach en orientation scolaire experte en Ennéagramme. Rédige un chapitre de rapport d'orientation pour un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Types Ennéagramme identifiés (par ordre de dominance) : ${typesDescription}${sousTypeText}
${templateBlock}
Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
${consignes}
- Ne mentionne pas que tu es une IA ni que tu utilises des fiches de référence
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre Ennéagramme :`);
}

export async function generateMbtiChapter(
  profile: ProfileData,
  mbtiType: string,
  wordCount: number,
  templateContent: string | null = null,
): Promise<string> {
  const templateBlock = templateContent
    ? `\nVoici la fiche de référence complète pour le type ${mbtiType}. Base-toi sur ce contenu pour tes explications :\n\n---\n${templateContent}\n---\n`
    : '';

  const consignes = templateContent
    ? `- Base tes explications sur la fiche de référence ci-dessus : reprends les forces, points d'attention, style d'apprentissage, environnement idéal et secteurs affinitaires qui y figurent
- Personnalise le texte en faisant des liens concrets avec les loisirs, centres d'intérêt et orientations envisagées du jeune
- Ne recopie pas la fiche mot pour mot : reformule, synthétise et adapte le contenu au contexte du jeune`
    : `- Explique les 4 dimensions du profil ${mbtiType} et ce qu'elles signifient concrètement pour l'orientation
- Mentionne les environnements d'apprentissage et de travail qui conviennent à ce profil
- Fais des liens concrets avec les loisirs et centres d'intérêt mentionnés si disponibles`;

  return complete(`Tu es une coach en orientation scolaire experte en MBTI. Rédige un chapitre de rapport d'orientation pour un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Type MBTI identifié : ${mbtiType}
${templateBlock}
Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
${consignes}
- Ne mentionne pas que tu es une IA ni que tu utilises une fiche de référence
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre MBTI :`);
}

export async function generateRiasecChapter(
  profile: ProfileData,
  riasecCodes: string[],
  wordCount: number,
  templateContent: string | null = null,
): Promise<string> {
  const riasecNames: Record<string, string> = {
    R: 'Réaliste', I: 'Investigateur', A: 'Artistique',
    S: 'Social', E: 'Entreprenant', C: 'Conventionnel'
  };
  const riasecDescription = riasecCodes
    .map((code, i) => `${i + 1}. ${code} (${riasecNames[code] || code})`)
    .join(', ');

  const templateBlock = templateContent
    ? `\nVoici les fiches de référence pour chaque dimension RIASEC du profil identifié. Base-toi sur ce contenu pour tes explications :\n\n---\n${templateContent}\n---\n`
    : '';

  const consignes = templateContent
    ? `- Base tes explications sur les fiches de référence ci-dessus : reprends les descriptions, environnements de travail, activités types, points forts et exemples de métiers qui y figurent
- Personnalise le texte en faisant des liens concrets avec les loisirs, centres d'intérêt et orientations envisagées du jeune
- Ne recopie pas les fiches mot pour mot : reformule, synthétise et adapte le contenu au contexte du jeune
- Mets en avant la combinaison des dimensions et ce qu'elle signifie concrètement pour l'orientation`
    : `- Explique ce que signifie la combinaison RIASEC identifiée en termes concrets d'orientation
- Suggère des domaines d'études et des environnements professionnels qui correspondent à ce profil
- Fais des liens concrets avec les loisirs et centres d'intérêt mentionnés si disponibles`;

  return complete(`Tu es une coach en orientation scolaire experte en RIASEC (modèle de Holland). Rédige un chapitre de rapport d'orientation pour un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Profil RIASEC identifié (par ordre de dominance) : ${riasecDescription}
${templateBlock}
Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
${consignes}
- Ne mentionne pas que tu es une IA ni que tu utilises des fiches de référence
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre RIASEC :`);
}

export async function generateCompetencesBesoinsChapter(
  profile: ProfileData,
  competences: string[],
  besoins: string[],
  wordCount: number
): Promise<string> {
  const compList = competences.length > 0 ? competences.join(', ') : 'Non renseignées';
  const besoinslist = besoins.length > 0 ? besoins.join(', ') : 'Non renseignés';

  return complete(`Tu es une coach en orientation scolaire. Rédige un chapitre de rapport d'orientation sur les compétences clés et les besoins fondamentaux d'un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Compétences clés identifiées : ${compList}
Besoins fondamentaux identifiés : ${besoinslist}

Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
- Explique comment ces compétences se manifestent concrètement et comment les valoriser dans un parcours d'orientation
- Relie les besoins fondamentaux à des environnements d'études et de travail qui les respectent
- Fais des liens concrets avec les loisirs et centres d'intérêt mentionnés si disponibles
- Ne mentionne pas que tu es une IA
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre Compétences & Besoins :`);
}

export async function generateMetiersChapter(
  profile: ProfileData,
  metiers: Array<{ nom: string; motscles: string; formations: Array<{ ecole: string; ville: string }> }>,
  wordCount: number
): Promise<string> {
  const metiersDescription = metiers.map((m, i) => {
    let desc = `${i + 1}. ${m.nom}`;
    if (m.motscles) desc += ` — ${m.motscles}`;
    if (m.formations && m.formations.length > 0) {
      const formationsText = m.formations.map(f => `${f.ecole}${f.ville ? ' (' + f.ville + ')' : ''}`).join(', ');
      desc += `\n   Formations envisagées : ${formationsText}`;
    }
    return desc;
  }).join('\n');

  return complete(`Tu es une coach en orientation scolaire. Rédige un chapitre de rapport d'orientation sur les pistes de métiers et formations identifiées pour un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Pistes de métiers identifiées :
${metiersDescription}

Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
- Pour chaque métier, explique brièvement en quoi il correspond au profil du jeune
- Mentionne les formations et écoles identifiées comme des pistes concrètes à explorer
- Fais des liens avec les loisirs et centres d'intérêt du jeune
- Ne mentionne pas que tu es une IA
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre Métiers & Formations :`);
}

export async function generatePlanActionChapter(
  profile: ProfileData,
  planAction: string,
  wordCount: number
): Promise<string> {
  return complete(`Tu es une coach en orientation scolaire. Rédige un chapitre de rapport d'orientation présentant un plan d'action concret pour un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Étapes proposées par la coach :
${planAction}

Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
- Structure les étapes de manière claire et motivante
- Ajoute des conseils pratiques pour chaque étape si pertinent
- Donne envie au jeune de passer à l'action
- Ne mentionne pas que tu es une IA
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre Plan d'action :`);
}
