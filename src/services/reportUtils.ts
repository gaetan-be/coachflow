export function calculateAge(dateNaissance: string): number {
  const bd = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

function toIsoDate(v: unknown): string {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

/** Map DB coachee row to the JSON format expected by make-docx.sh / brenso-word skill. */
export function mapCoacheeToJson(data: any): Record<string, any> {
  return {
    profile_type: data.profile_type || 'young',
    coach_name: data.coach_name || '',
    coach_email: data.coach_email || '',
    coach_telephone: data.coach_telephone || '',
    coach_website: data.coach_website || '',
    brand_name: data.coach_brand_name || '',
    prenom: data.prenom || '',
    nom: data.nom || '',
    anniversaire: toIsoDate(data.date_naissance),
    age: data.date_naissance ? calculateAge(data.date_naissance) : 0,
    zip: data.code_postal || '',
    date_seance: toIsoDate(data.date_seance),
    ecole: data.ecole_nom || '',
    choix: data.choix || '',
    loisirs: data.loisirs || '',
    entreprise: data.entreprise || '',
    role: data.role || '',
    situation: data.situation
      ? String(data.situation).split(',').filter(Boolean)
      : [],
    ennea_bases: data.ennea_base
      ? String(data.ennea_base).split(',').filter(Boolean)
      : [],
    ennea_soustype: data.ennea_sous_type || '',
    mbti: data.mbti || '',
    riasec: data.riasec || '',
    valeurs: data.valeurs
      ? String(data.valeurs).split(',').filter(Boolean)
      : [],
    competences: data.competences
      ? String(data.competences).split(',').filter(Boolean)
      : [],
    besoins: data.besoins
      ? String(data.besoins).split(',').filter(Boolean)
      : [],
    metiers: Array.isArray(data.metiers) ? data.metiers : [],
    plan_action: data.plan_action || '',
    notes: data.notes_coach || '',
    words_ennea: data.words_ennea || 250,
    words_mbti: data.words_mbti || 250,
    words_riasec: data.words_riasec || 200,
    words_comp_besoins: data.words_comp_besoins || 250,
    words_metiers: data.words_metiers || 250,
    words_plan_action: data.words_plan_action || 200,
  };
}
