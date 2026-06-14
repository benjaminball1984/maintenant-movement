import {
  OPTIONS_GENRE,
  OPTIONS_LOGEMENT,
  QUESTIONS_PAR_CLE,
  QUESTIONS_QUALIFICATION,
  tirerProchaineQuestion,
  trancheAgeDepuisDateNaissance,
} from '@/lib/sondages/qualification';
import { describe, expect, it } from 'vitest';

describe('panel de qualification (CDC sondages-V2 §7)', () => {
  it('contient exactement 23 questions aux clés uniques', () => {
    expect(QUESTIONS_QUALIFICATION).toHaveLength(23);
    const cles = QUESTIONS_QUALIFICATION.map((q) => q.cle);
    expect(new Set(cles).size).toBe(23);
    expect(QUESTIONS_PAR_CLE.size).toBe(23);
  });

  it('chaque question a un intitulé et au moins 2 options non vides', () => {
    for (const q of QUESTIONS_QUALIFICATION) {
      expect(q.intitule.length).toBeGreaterThan(5);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.every((o) => o.trim() !== '')).toBe(true);
      expect(q.poidsTirage).toBeGreaterThan(0);
    }
  });

  it('les européennes 2024 listent les 38 listes + 4 options de repli (zéro regroupement)', () => {
    const q = QUESTIONS_PAR_CLE.get('europeennes_2024');
    expect(q?.options).toHaveLength(42);
  });

  it('la présidentielle 2022 liste les 12 candidat·es + 4 options de repli', () => {
    const q = QUESTIONS_PAR_CLE.get('presidentielle_2022');
    expect(q?.options).toHaveLength(16);
  });

  it('le genre suit la décision Ben 2026-06-12 (4 options, « Autre » au singulier)', () => {
    expect([...OPTIONS_GENRE]).toEqual(['Homme', 'Femme', 'Non binaire', 'Autre']);
  });

  it('les parts cibles logement (statut d’occupation INSEE, 6 postes) somment à 1', () => {
    const somme = OPTIONS_LOGEMENT.reduce((s, o) => s + o.partCible, 0);
    expect(somme).toBeCloseTo(1, 3);
    expect(OPTIONS_LOGEMENT).toHaveLength(6);
    expect(OPTIONS_LOGEMENT[0]?.partCible).toBeCloseTo(0.575, 3);
  });

  it('la question bénévolat exige son second champ quand la réponse commence par « Oui »', () => {
    const q = QUESTIONS_PAR_CLE.get('benevolat');
    expect(q?.type).toBe('double');
    expect(Array.isArray(q?.secondaire?.requisSi)).toBe(true);
    expect(q?.secondaire?.requisSi).toContain('Oui, régulièrement (chaque semaine ou presque)');
    expect(q?.secondaire?.options.length).toBe(10);
  });

  it('la syndicalisation déclenche son second champ si adhérent·e ou ancien·ne', () => {
    const q = QUESTIONS_PAR_CLE.get('pratique_syndicale');
    expect(q?.type).toBe('double');
    expect(q?.secondaire?.requisSi).toContain('Adhérent·e actuellement');
    expect(q?.secondaire?.requisSi).toContain('Anciennement (plus aujourd’hui)');
  });
});

describe('tirerProchaineQuestion', () => {
  it('ne tire jamais une question exclue (déjà répondue)', () => {
    const exclues = new Set(QUESTIONS_QUALIFICATION.slice(1).map((q) => q.cle));
    const seule = QUESTIONS_QUALIFICATION[0];
    for (const alea of [0, 0.5, 0.999]) {
      expect(tirerProchaineQuestion(exclues, () => alea)?.cle).toBe(seule?.cle);
    }
  });

  it('retourne null quand tout le panel est épuisé', () => {
    const toutes = new Set(QUESTIONS_QUALIFICATION.map((q) => q.cle));
    expect(tirerProchaineQuestion(toutes)).toBeNull();
  });

  it('respecte la pondération (aléa 0 = première candidate, aléa proche de 1 = dernière)', () => {
    const premiere = tirerProchaineQuestion(new Set(), () => 0);
    expect(premiere?.cle).toBe(QUESTIONS_QUALIFICATION[0]?.cle);
    const derniere = tirerProchaineQuestion(new Set(), () => 0.999999);
    expect(derniere?.cle).toBe(QUESTIONS_QUALIFICATION.at(-1)?.cle);
  });
});

describe('trancheAgeDepuisDateNaissance', () => {
  const reference = new Date('2026-06-12T00:00:00Z');

  it.each([
    ['2010-01-01', 'moins_18'],
    ['2008-06-12', '18_24'],
    ['2002-01-01', '18_24'],
    ['2000-01-01', '25_34'],
    ['1990-01-01', '35_49'],
    ['1970-01-01', '50_64'],
    ['1950-01-01', '65_plus'],
  ])('%s -> %s', (date, attendu) => {
    expect(trancheAgeDepuisDateNaissance(date, reference)).toBe(attendu);
  });

  it('retourne null sans date ou avec une date invalide', () => {
    expect(trancheAgeDepuisDateNaissance(null, reference)).toBeNull();
    expect(trancheAgeDepuisDateNaissance('', reference)).toBeNull();
    expect(trancheAgeDepuisDateNaissance('pas-une-date', reference)).toBeNull();
  });
});
