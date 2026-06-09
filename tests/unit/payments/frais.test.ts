import {
  FRAIS_FIXE_EUR_CENTIMES,
  TAUX_FRAIS_EUR,
  calculerFraisEuros,
  calculerFraisT99CP,
  totalAvecFraisEuros,
} from '@/lib/payments';
import { describe, expect, it } from 'vitest';

/**
 * Tests des helpers de calcul de frais.
 *
 * Doctrine des frais (décision Lilou/Ben 2026-06-09) : 3 % + 0,30 € sur
 * les paiements en euros (ajoutés au-dessus, à la charge du payeur),
 * 0 % sur T99CP. Cf. `lib/payments/frais.ts`.
 */
describe('constantes de frais euros', () => {
  it('taux = 3 % et part fixe = 0,30 €', () => {
    expect(TAUX_FRAIS_EUR).toBe(0.03);
    expect(FRAIS_FIXE_EUR_CENTIMES).toBe(30);
  });
});

describe('calculerFraisEuros', () => {
  it('retourne 3 % du montant + 0,30 €', () => {
    expect(calculerFraisEuros(10000)).toBe(330); // 100 € → 3,30 €
    expect(calculerFraisEuros(2000)).toBe(90); // 20 € → 0,90 €
    expect(calculerFraisEuros(1000)).toBe(60); // 10 € → 0,60 €
    expect(calculerFraisEuros(100)).toBe(33); // 1 € → 0,33 €
  });

  it('arrondit la part proportionnelle au centime le plus proche', () => {
    // 333 centimes → 3 % = 9,99 → 10 centimes, + 30 = 40 centimes.
    expect(calculerFraisEuros(333)).toBe(40);
  });

  it('retourne 0 pour montant 0 (pas de paiement, pas de frais)', () => {
    expect(calculerFraisEuros(0)).toBe(0);
  });

  it('retourne 0 pour montant négatif (garde-fou)', () => {
    expect(calculerFraisEuros(-100)).toBe(0);
  });
});

describe('totalAvecFraisEuros', () => {
  it('ajoute les frais au montant destiné au bénéficiaire', () => {
    expect(totalAvecFraisEuros(10000)).toBe(10330); // 100 € payés 103,30 €
    expect(totalAvecFraisEuros(2000)).toBe(2090); // 20 € payés 20,90 €
    expect(totalAvecFraisEuros(100)).toBe(133); // 1 € payé 1,33 €
  });

  it('retourne 0 pour montant 0 ou négatif', () => {
    expect(totalAvecFraisEuros(0)).toBe(0);
    expect(totalAvecFraisEuros(-50)).toBe(0);
  });
});

describe('calculerFraisT99CP', () => {
  it('retourne toujours 0n (politique 0 %, seul coût = gas Polygon)', () => {
    expect(calculerFraisT99CP(1n)).toBe(0n);
    expect(calculerFraisT99CP(10n ** 18n)).toBe(0n);
    expect(calculerFraisT99CP(0n)).toBe(0n);
  });
});
