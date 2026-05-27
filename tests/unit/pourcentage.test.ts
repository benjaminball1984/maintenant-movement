import {
  formaterPourcentage,
  pourcentage,
  pourcentageArrondi,
  pourcentageClampe,
} from '@/lib/pourcentage';
import { describe, expect, it } from 'vitest';

describe('pourcentage', () => {
  it('50/100 = 50', () => {
    expect(pourcentage(50, 100)).toBe(50);
  });

  it('peut dépasser 100', () => {
    expect(pourcentage(150, 100)).toBe(150);
  });

  it('total 0 → 0 (pas de division par zéro)', () => {
    expect(pourcentage(50, 0)).toBe(0);
    expect(pourcentage(50, -10)).toBe(0);
  });

  it('partie négative → 0', () => {
    expect(pourcentage(-10, 100)).toBe(0);
  });

  it('décimaux', () => {
    expect(pourcentage(1, 3)).toBeCloseTo(33.333, 2);
  });
});

describe('pourcentageArrondi', () => {
  it('arrondit à l’entier', () => {
    expect(pourcentageArrondi(33, 100)).toBe(33);
    expect(pourcentageArrondi(33.7, 100)).toBe(34);
    expect(pourcentageArrondi(33.4, 100)).toBe(33);
  });
});

describe('pourcentageClampe', () => {
  it('150/100 clampé à 100', () => {
    expect(pourcentageClampe(150, 100)).toBe(100);
  });

  it('partie négative clampée à 0', () => {
    expect(pourcentageClampe(-50, 100)).toBe(0);
  });

  it('total 0 → 0', () => {
    expect(pourcentageClampe(50, 0)).toBe(0);
  });

  it('cas normal entre 0 et 100', () => {
    expect(pourcentageClampe(75, 100)).toBe(75);
  });
});

describe('formaterPourcentage', () => {
  it('arrondit et ajoute « % »', () => {
    expect(formaterPourcentage(75)).toBe('75 %');
    expect(formaterPourcentage(75.7)).toBe('76 %');
    expect(formaterPourcentage(0)).toBe('0 %');
  });
});
