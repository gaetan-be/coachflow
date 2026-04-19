export interface Formation {
  ecole: string;
  ville: string;
}

export interface Metier {
  nom: string;
  motscles: string;
  formations: Formation[];
}

export interface PipelineData {
  prenom: string;
  nom: string;
  date_naissance: string;
  ecole_nom: string;
  code_postal: string;
  date_seance: string;
  choix: string;
  loisirs: string;
  ennea_base: string | null;
  ennea_sous_type: string | null;
  mbti: string | null;
  riasec: string | null;
  words_ennea: number;
  words_mbti: number;
  words_riasec: number;
  valeurs: string | null;
  competences: string | null;
  besoins: string | null;
  words_comp_besoins: number;
  metiers: Metier[] | null;
  words_metiers: number;
  plan_action: string;
  words_plan_action: number;
  notes_coach: string;
  report_status?: string;
}
