import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mapCoacheeToJson, calculateAge } from '../../src/services/reportUtils';

describe('calculateAge', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('returns correct age when birthday already passed this year', () => {
    vi.setSystemTime(new Date('2025-09-01'));
    expect(calculateAge('2005-06-15')).toBe(20);
  });

  it('returns correct age when birthday not yet reached this year', () => {
    vi.setSystemTime(new Date('2025-03-01'));
    expect(calculateAge('2005-06-15')).toBe(19);
  });

  it('returns correct age on exact birthday', () => {
    vi.setSystemTime(new Date('2025-06-15'));
    expect(calculateAge('2005-06-15')).toBe(20);
  });
});

describe('mapCoacheeToJson', () => {
  const base = {
    prenom: 'Alice',
    nom: 'Dupont',
    date_naissance: '2005-06-15',
    code_postal: '1000',
    date_seance: '2025-04-01',
    ecole_nom: 'Lycée Test',
    choix: 'Sciences',
    loisirs: 'Tennis',
    ennea_base: '1,3,5',
    ennea_sous_type: 'SP',
    mbti: 'INFJ',
    riasec: 'AIR',
    valeurs: 'authenticité,liberté',
    competences: 'leadership,créativité',
    besoins: 'sécurité',
    metiers: [{ nom: 'Architecte' }],
    plan_action: 'Visiter 3 écoles',
    notes_coach: 'Très motivée',
    words_ennea: 300,
    words_mbti: 280,
    words_riasec: 220,
    words_comp_besoins: 260,
    words_metiers: 270,
    words_plan_action: 210,
  };

  beforeEach(() => { vi.setSystemTime(new Date('2025-09-01')); });
  afterEach(() => { vi.useRealTimers(); });

  it('maps all scalar fields', () => {
    const result = mapCoacheeToJson(base);
    expect(result.prenom).toBe('Alice');
    expect(result.nom).toBe('Dupont');
    expect(result.anniversaire).toBe('2005-06-15');
    expect(result.zip).toBe('1000');
    expect(result.date_seance).toBe('2025-04-01');
    expect(result.ecole).toBe('Lycée Test');
    expect(result.choix).toBe('Sciences');
    expect(result.loisirs).toBe('Tennis');
    expect(result.ennea_soustype).toBe('SP');
    expect(result.mbti).toBe('INFJ');
    expect(result.riasec).toBe('AIR');
    expect(result.plan_action).toBe('Visiter 3 écoles');
    expect(result.notes).toBe('Très motivée');
  });

  it('calculates age from date_naissance', () => {
    const result = mapCoacheeToJson(base);
    expect(result.age).toBe(20);
  });

  it('splits ennea_base comma string into array', () => {
    expect(mapCoacheeToJson(base).ennea_bases).toEqual(['1', '3', '5']);
  });

  it('splits valeurs, competences, besoins into arrays', () => {
    const result = mapCoacheeToJson(base);
    expect(result.valeurs).toEqual(['authenticité', 'liberté']);
    expect(result.competences).toEqual(['leadership', 'créativité']);
    expect(result.besoins).toEqual(['sécurité']);
  });

  it('passes through metiers when already an array', () => {
    expect(mapCoacheeToJson(base).metiers).toEqual([{ nom: 'Architecte' }]);
  });

  it('uses provided word count targets', () => {
    const result = mapCoacheeToJson(base);
    expect(result.words_ennea).toBe(300);
    expect(result.words_mbti).toBe(280);
    expect(result.words_riasec).toBe(220);
    expect(result.words_comp_besoins).toBe(260);
    expect(result.words_metiers).toBe(270);
    expect(result.words_plan_action).toBe(210);
  });

  it('applies default word count targets when absent', () => {
    const result = mapCoacheeToJson({ prenom: 'Bob', nom: 'Martin', date_naissance: '2000-01-01' });
    expect(result.words_ennea).toBe(250);
    expect(result.words_mbti).toBe(250);
    expect(result.words_riasec).toBe(200);
    expect(result.words_comp_besoins).toBe(250);
    expect(result.words_metiers).toBe(250);
    expect(result.words_plan_action).toBe(200);
  });

  it('returns empty arrays for null comma fields', () => {
    const result = mapCoacheeToJson({ prenom: 'Bob', nom: 'Martin', date_naissance: '2000-01-01', ennea_base: null, valeurs: null, competences: null, besoins: null });
    expect(result.ennea_bases).toEqual([]);
    expect(result.valeurs).toEqual([]);
    expect(result.competences).toEqual([]);
    expect(result.besoins).toEqual([]);
  });

  it('returns empty array for metiers when not an array', () => {
    expect(mapCoacheeToJson({ ...base, metiers: null }).metiers).toEqual([]);
    expect(mapCoacheeToJson({ ...base, metiers: 'invalid' }).metiers).toEqual([]);
  });

  it('returns age 0 when date_naissance is absent', () => {
    expect(mapCoacheeToJson({ prenom: 'Bob', nom: 'Martin' }).age).toBe(0);
  });
});
