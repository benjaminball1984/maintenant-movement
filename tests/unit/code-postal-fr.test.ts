import { estCodePostalFrValide, extraireDepartementFr } from '@/lib/code-postal-fr';
import { describe, expect, it } from 'vitest';

describe('estCodePostalFrValide', () => {
  it('accepte Paris', () => {
    expect(estCodePostalFrValide('75001')).toBe(true);
    expect(estCodePostalFrValide('75020')).toBe(true);
  });

  it('accepte Gironde', () => {
    expect(estCodePostalFrValide('33500')).toBe(true);
  });

  it('accepte La Réunion (DROM)', () => {
    expect(estCodePostalFrValide('97400')).toBe(true);
    expect(estCodePostalFrValide('97600')).toBe(true);
  });

  it('refuse 00000', () => {
    expect(estCodePostalFrValide('00000')).toBe(false);
  });

  it('refuse moins de 5 chiffres', () => {
    expect(estCodePostalFrValide('123')).toBe(false);
    expect(estCodePostalFrValide('7500')).toBe(false);
  });

  it('refuse plus de 5 chiffres', () => {
    expect(estCodePostalFrValide('750010')).toBe(false);
  });

  it('refuse lettres ou autres caractères', () => {
    expect(estCodePostalFrValide('7500A')).toBe(false);
    expect(estCodePostalFrValide('75 01')).toBe(false);
  });

  it('refuse vide / null / undefined', () => {
    expect(estCodePostalFrValide('')).toBe(false);
    expect(estCodePostalFrValide(null)).toBe(false);
    expect(estCodePostalFrValide(undefined)).toBe(false);
  });

  it('trim avant validation', () => {
    expect(estCodePostalFrValide('  75001  ')).toBe(true);
  });
});

describe('extraireDepartementFr', () => {
  it('métropole : 2 premiers chiffres', () => {
    expect(extraireDepartementFr('75001')).toBe('75');
    expect(extraireDepartementFr('33500')).toBe('33');
    expect(extraireDepartementFr('01100')).toBe('01');
  });

  it('Corse : retourne 20 générique', () => {
    expect(extraireDepartementFr('20000')).toBe('20');
    expect(extraireDepartementFr('20100')).toBe('20');
  });

  it('DROM : 3 premiers chiffres', () => {
    expect(extraireDepartementFr('97100')).toBe('971'); // Guadeloupe
    expect(extraireDepartementFr('97200')).toBe('972'); // Martinique
    expect(extraireDepartementFr('97300')).toBe('973'); // Guyane
    expect(extraireDepartementFr('97400')).toBe('974'); // La Réunion
    expect(extraireDepartementFr('97600')).toBe('976'); // Mayotte
  });

  it('retourne null si invalide', () => {
    expect(extraireDepartementFr('00000')).toBeNull();
    expect(extraireDepartementFr('abc')).toBeNull();
    expect(extraireDepartementFr(null)).toBeNull();
  });
});
