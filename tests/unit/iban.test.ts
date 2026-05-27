import { estIbanValide, formaterIban, normaliserIban } from '@/lib/iban';
import { describe, expect, it } from 'vitest';

describe('normaliserIban', () => {
  it('retire les espaces et met en majuscules', () => {
    expect(normaliserIban('fr14 2004 1010 0505 0001 3m02 606')).toBe('FR1420041010050500013M02606');
  });
});

describe('estIbanValide', () => {
  it('accepte un IBAN français valide (exemple officiel)', () => {
    expect(estIbanValide('FR1420041010050500013M02606')).toBe(true);
    expect(estIbanValide('FR14 2004 1010 0505 0001 3M02 606')).toBe(true);
  });

  it('accepte un IBAN allemand valide', () => {
    expect(estIbanValide('DE89370400440532013000')).toBe(true);
  });

  it('accepte un IBAN britannique valide', () => {
    expect(estIbanValide('GB82WEST12345698765432')).toBe(true);
  });

  it('accepte case insensible', () => {
    expect(estIbanValide('fr1420041010050500013m02606')).toBe(true);
  });

  it('refuse une clé incorrecte', () => {
    expect(estIbanValide('FR99 9999 9999 9999 9999 9999 999')).toBe(false);
    expect(estIbanValide('DE99370400440532013000')).toBe(false);
  });

  it('refuse une longueur incorrecte pour la France (27 attendus)', () => {
    expect(estIbanValide('FR140000000')).toBe(false);
  });

  it('refuse caractères invalides', () => {
    expect(estIbanValide('FR14 2004 1010 0505 0001 3M02-606')).toBe(false);
  });

  it('refuse null/undefined/vide', () => {
    expect(estIbanValide(null)).toBe(false);
    expect(estIbanValide(undefined)).toBe(false);
    expect(estIbanValide('')).toBe(false);
  });

  it('refuse si moins de 15 caractères', () => {
    expect(estIbanValide('FR140000')).toBe(false);
  });

  it('refuse si pas 2 lettres + 2 chiffres en tête', () => {
    expect(estIbanValide('1414 2004 1010 0505 0001 3M02 606')).toBe(false);
  });
});

describe('formaterIban', () => {
  it('formate en groupes de 4', () => {
    expect(formaterIban('FR1420041010050500013M02606')).toBe('FR14 2004 1010 0505 0001 3M02 606');
  });

  it('accepte un IBAN déjà formaté', () => {
    expect(formaterIban('FR14 2004 1010 0505 0001 3M02 606')).toBe(
      'FR14 2004 1010 0505 0001 3M02 606',
    );
  });

  it('retourne chaîne vide si invalide', () => {
    expect(formaterIban('FR99 9999 9999 9999 9999 9999 999')).toBe('');
  });
});
