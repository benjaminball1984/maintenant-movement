import { calculerFraisEuros, calculerFraisT99CP } from '@/lib/payments';
import { describe, expect, it } from 'vitest';

/**
 * Tests des helpers de calcul de frais (chantier 3.3).
 *
 * Spec §5D : 5 % sur les euros (absorbés par la donatrice), 0 % sur T99CP.
 */
describe('calculerFraisEuros', () => {
  it('retourne 5% du montant total', () => {
    expect(calculerFraisEuros(10000)).toBe(500); // 100 € → 5 €
    expect(calculerFraisEuros(2000)).toBe(100); // 20 € → 1 €
    expect(calculerFraisEuros(100)).toBe(5); // 1 € → 5 centimes
  });

  it('arrondit au centime le plus proche', () => {
    // 333 centimes → 5 % = 16.65 → 17 centimes (arrondi sup)
    expect(calculerFraisEuros(333)).toBe(17);
  });

  it('retourne 0 pour montant 0', () => {
    expect(calculerFraisEuros(0)).toBe(0);
  });

  it('retourne 0 pour montant négatif (garde-fou)', () => {
    expect(calculerFraisEuros(-100)).toBe(0);
  });
});

describe('calculerFraisT99CP', () => {
  it('retourne toujours 0n (politique 0 %)', () => {
    expect(calculerFraisT99CP(1n)).toBe(0n);
    expect(calculerFraisT99CP(10n ** 18n)).toBe(0n);
    expect(calculerFraisT99CP(0n)).toBe(0n);
  });
});
