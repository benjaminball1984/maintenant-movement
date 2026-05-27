import { comparerPermissif, contientTexte, normaliserRecherche } from '@/lib/normaliser-recherche';
import { describe, expect, it } from 'vitest';

describe('normaliserRecherche', () => {
  it('retire accents', () => {
    expect(normaliserRecherche('Édition')).toBe('edition');
    expect(normaliserRecherche('élémentaire')).toBe('elementaire');
  });

  it('lowercase', () => {
    expect(normaliserRecherche('BONJOUR')).toBe('bonjour');
  });

  it('trim + collapse espaces multiples', () => {
    expect(normaliserRecherche('  Salut   le monde  ')).toBe('salut le monde');
  });

  it('ne touche pas aux chiffres ni autres caractères', () => {
    expect(normaliserRecherche('Édition n°42')).toBe('edition n°42');
  });

  it('chaîne vide → chaîne vide', () => {
    expect(normaliserRecherche('')).toBe('');
    expect(normaliserRecherche('   ')).toBe('');
  });
});

describe('contientTexte', () => {
  it('match permissif accent + casse', () => {
    expect(contientTexte('École élémentaire', 'ELE')).toBe(true);
    expect(contientTexte('École élémentaire', 'élé')).toBe(true);
    expect(contientTexte('École élémentaire', 'ecole')).toBe(true);
  });

  it('refuse si vraiment pas présent', () => {
    expect(contientTexte('école', 'xy')).toBe(false);
  });

  it('aiguille vide → true', () => {
    expect(contientTexte('quelconque', '')).toBe(true);
  });

  it('ignore casse de l’aiguille', () => {
    expect(contientTexte('Bonjour', 'JOUR')).toBe(true);
  });
});

describe('comparerPermissif', () => {
  it('tri alphabétique ignorant accents', () => {
    const arr = ['École', 'Aéro', 'Zoo'];
    expect(arr.sort(comparerPermissif)).toEqual(['Aéro', 'École', 'Zoo']);
  });

  it('égalité si même normalisation', () => {
    expect(comparerPermissif('École', 'ecole')).toBe(0);
  });

  it('ignore casse', () => {
    expect(comparerPermissif('zoo', 'AERO') > 0).toBe(true);
  });
});
