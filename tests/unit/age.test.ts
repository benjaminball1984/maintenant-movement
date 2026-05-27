import { calculerAge, estMajeur } from '@/lib/age';
import { describe, expect, it } from 'vitest';

const REF = new Date('2026-05-23T12:00:00.000Z');

describe('calculerAge', () => {
  it('âge exact au jour anniversaire', () => {
    expect(calculerAge('2000-05-23', REF)).toBe(26);
  });

  it('soustrait 1 si anniversaire pas encore passé', () => {
    expect(calculerAge('2000-05-24', REF)).toBe(25);
    expect(calculerAge('2000-06-01', REF)).toBe(25);
  });

  it('âge plein si anniversaire déjà passé', () => {
    expect(calculerAge('2000-05-22', REF)).toBe(26);
    expect(calculerAge('2000-01-01', REF)).toBe(26);
  });

  it('retourne null si date dans le futur', () => {
    expect(calculerAge('2030-01-01', REF)).toBeNull();
  });

  it('retourne null si date invalide', () => {
    expect(calculerAge('pas une date', REF)).toBeNull();
  });

  it('accepte un Date directement', () => {
    expect(calculerAge(new Date('1990-05-23'), REF)).toBe(36);
  });

  it('âge 0 pour bébé né cette année', () => {
    expect(calculerAge('2026-01-01', REF)).toBe(0);
  });
});

describe('estMajeur', () => {
  it('true pour 18 ans pile', () => {
    expect(estMajeur('2008-05-23', REF)).toBe(true);
  });

  it('false pour 17 ans + 364 jours', () => {
    expect(estMajeur('2008-05-24', REF)).toBe(false);
  });

  it('false pour bébé', () => {
    expect(estMajeur('2026-01-01', REF)).toBe(false);
  });

  it('true pour vieille personne', () => {
    expect(estMajeur('1950-01-01', REF)).toBe(true);
  });

  it('false pour date future', () => {
    expect(estMajeur('2030-01-01', REF)).toBe(false);
  });
});
