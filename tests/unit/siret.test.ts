import { estSirenValide, estSiretValide, formaterSiren, formaterSiret } from '@/lib/siret';
import { describe, expect, it } from 'vitest';

// SIREN/SIRET officiels Carrefour (utilisés comme exemples publics dans la doc INSEE).
const SIREN_CARREFOUR = '652014051';
const SIRET_CARREFOUR_SIEGE = '65201405100013';

describe('estSirenValide', () => {
  it('accepte un SIREN Carrefour officiel', () => {
    expect(estSirenValide(SIREN_CARREFOUR)).toBe(true);
  });

  it('accepte avec espaces', () => {
    expect(estSirenValide('652 014 051')).toBe(true);
  });

  it('refuse une clé Luhn fausse', () => {
    expect(estSirenValide('123456789')).toBe(false);
  });

  it('refuse moins de 9 chiffres', () => {
    expect(estSirenValide('12345')).toBe(false);
  });

  it('refuse plus de 9 chiffres', () => {
    expect(estSirenValide('1234567890')).toBe(false);
  });

  it('refuse lettres', () => {
    expect(estSirenValide('12345678X')).toBe(false);
  });

  it('refuse null/undefined/vide', () => {
    expect(estSirenValide(null)).toBe(false);
    expect(estSirenValide(undefined)).toBe(false);
    expect(estSirenValide('')).toBe(false);
  });
});

describe('estSiretValide', () => {
  it('accepte un SIRET Carrefour officiel', () => {
    expect(estSiretValide(SIRET_CARREFOUR_SIEGE)).toBe(true);
  });

  it('accepte avec espaces', () => {
    expect(estSiretValide('652 014 051 00013')).toBe(true);
  });

  it('refuse une clé Luhn fausse', () => {
    expect(estSiretValide('12345678901234')).toBe(false);
  });

  it('refuse moins de 14 chiffres', () => {
    expect(estSiretValide('652014051')).toBe(false); // c'est un SIREN
  });

  it('refuse plus de 14 chiffres', () => {
    expect(estSiretValide('652014051000130')).toBe(false);
  });

  it('refuse null/vide', () => {
    expect(estSiretValide(null)).toBe(false);
    expect(estSiretValide('')).toBe(false);
  });
});

describe('formaterSiret', () => {
  it('formate en groupes 3-3-3-5', () => {
    expect(formaterSiret(SIRET_CARREFOUR_SIEGE)).toBe('652 014 051 00013');
  });

  it('retire les espaces avant formatage', () => {
    expect(formaterSiret('652 014 051 00013')).toBe('652 014 051 00013');
  });

  it('retourne chaîne vide si invalide', () => {
    expect(formaterSiret('12345678901234')).toBe('');
  });
});

describe('formaterSiren', () => {
  it('formate en groupes 3-3-3', () => {
    expect(formaterSiren(SIREN_CARREFOUR)).toBe('652 014 051');
  });

  it('retourne chaîne vide si invalide', () => {
    expect(formaterSiren('123456789')).toBe('');
  });
});
