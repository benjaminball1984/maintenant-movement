import {
  formaterDateCourte,
  formaterDateHeure,
  formaterDateIso,
  formaterDateLongue,
  formaterDateLongueHeure,
  formaterDateMoyenne,
} from '@/lib/format-date';
import { describe, expect, it } from 'vitest';

const REF_ISO = '2026-05-23T14:00:00.000Z';
const REF_DATE = new Date(REF_ISO);

// Les tests utilisent toContain plutôt que toBe parce que Intl insère
// des espaces insécables et le rendu dépend du fuseau du runtime.

describe('formaterDateCourte', () => {
  it('contient mois abrégé et année (depuis string ISO)', () => {
    const r = formaterDateCourte(REF_ISO);
    expect(r).toContain('2026');
    expect(r).toMatch(/mai|avr|jui/);
  });

  it('accepte un Date directement', () => {
    expect(formaterDateCourte(REF_DATE)).toContain('2026');
  });
});

describe('formaterDateLongue', () => {
  it('contient jour de la semaine en toutes lettres', () => {
    const r = formaterDateLongue(REF_ISO);
    expect(r.toLowerCase()).toMatch(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/);
    expect(r).toContain('2026');
  });
});

describe('formaterDateHeure', () => {
  it('contient heure et minute', () => {
    const r = formaterDateHeure(REF_ISO);
    // 14:00 UTC = différent selon fuseau, mais doit contenir un format HH:MM
    expect(r).toMatch(/\d{2}:\d{2}/);
    expect(r).toContain('2026');
  });
});

describe('formaterDateMoyenne', () => {
  it('contient le mois en toutes lettres et l’année, sans jour de semaine', () => {
    const r = formaterDateMoyenne(REF_ISO);
    expect(r).toContain('mai');
    expect(r).toContain('2026');
    // Pas de jour de semaine en toutes lettres dans ce format.
    expect(r.toLowerCase()).not.toMatch(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/);
  });

  it('accepte un Date directement', () => {
    expect(formaterDateMoyenne(REF_DATE)).toContain('2026');
  });
});

describe('formaterDateLongueHeure', () => {
  it('contient jour de semaine, mois en toutes lettres, année et heure', () => {
    const r = formaterDateLongueHeure(REF_ISO);
    expect(r.toLowerCase()).toMatch(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/);
    expect(r).toContain('mai');
    expect(r).toContain('2026');
    expect(r).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formaterDateIso', () => {
  it('retourne YYYY-MM-DD depuis une string ISO', () => {
    expect(formaterDateIso(REF_ISO)).toBe('2026-05-23');
  });

  it('retourne YYYY-MM-DD depuis un Date', () => {
    expect(formaterDateIso(REF_DATE)).toBe('2026-05-23');
  });

  it('coupe correctement même si la string ISO contient des fractions de seconde', () => {
    expect(formaterDateIso('2026-12-31T23:59:59.999Z')).toBe('2026-12-31');
  });
});
