import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

interface ProfileData {
  prenom: string;
  nom: string;
  age?: string;
  ecole_nom?: string;
  loisirs?: string;
  choix?: string;
  notes_coach?: string;
}

export async function generateEnneagrammeChapter(
  profile: ProfileData,
  enneaBase: number,
  enneaSousType: string | null,
  wordCount: number
): Promise<string> {
  const sousTypeText = enneaSousType ? ` avec un sous-type ${enneaSousType}` : '';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Tu es une coach en orientation scolaire experte en Ennéagramme. Rédige un chapitre de rapport d'orientation pour un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Type Ennéagramme identifié : Type ${enneaBase}${sousTypeText}

Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
- Explique les forces et les caractéristiques du type ${enneaBase} dans le contexte de l'orientation scolaire et professionnelle
- Fais des liens concrets avec les loisirs et centres d'intérêt mentionnés si disponibles
- Ne mentionne pas que tu es une IA
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre Ennéagramme :`
      }
    ]
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function generateMbtiChapter(
  profile: ProfileData,
  mbtiType: string,
  wordCount: number
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Tu es une coach en orientation scolaire experte en MBTI. Rédige un chapitre de rapport d'orientation pour un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Type MBTI identifié : ${mbtiType}

Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
- Explique les 4 dimensions du profil ${mbtiType} et ce qu'elles signifient concrètement pour l'orientation
- Mentionne les environnements d'apprentissage et de travail qui conviennent à ce profil
- Fais des liens concrets avec les loisirs et centres d'intérêt mentionnés si disponibles
- Ne mentionne pas que tu es une IA
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre MBTI :`
      }
    ]
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function generateRiasecChapter(
  profile: ProfileData,
  riasecCodes: string[],
  wordCount: number
): Promise<string> {
  const riasecNames: Record<string, string> = {
    R: 'Réaliste', I: 'Investigateur', A: 'Artistique',
    S: 'Social', E: 'Entreprenant', C: 'Conventionnel'
  };
  const riasecDescription = riasecCodes
    .map((code, i) => `${i + 1}. ${code} (${riasecNames[code] || code})`)
    .join(', ');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Tu es une coach en orientation scolaire experte en RIASEC (modèle de Holland). Rédige un chapitre de rapport d'orientation pour un jeune.

Informations sur le jeune :
- Prénom : ${profile.prenom}
- Loisirs : ${profile.loisirs || 'Non renseignés'}
- Orientations envisagées : ${profile.choix || 'Non renseignées'}
- Notes du coach : ${profile.notes_coach || 'Aucune'}

Profil RIASEC identifié (par ordre de dominance) : ${riasecDescription}

Consignes :
- Écris environ ${wordCount} mots
- Utilise le tutoiement (tu/ton/ta)
- Ton bienveillant et encourageant, adapté à un adolescent/jeune adulte
- Explique ce que signifie la combinaison RIASEC identifiée en termes concrets d'orientation
- Suggère des domaines d'études et des environnements professionnels qui correspondent à ce profil
- Fais des liens concrets avec les loisirs et centres d'intérêt mentionnés si disponibles
- Ne mentionne pas que tu es une IA
- Écris directement le contenu du chapitre, sans titre ni introduction méta

Rédige le chapitre RIASEC :`
      }
    ]
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}
