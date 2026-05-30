import {
  TAUX_PAR_DEFAUT_CENTIMES,
  centimesEnCoins,
  coinsEnCentimes,
  totalCentimes,
} from '@/lib/conversion-99coin';
import { describe, expect, it } from 'vitest';

describe('TAUX_PAR_DEFAUT_CENTIMES', () => {
  it('vaut 100 centimes par 99-coin (parité 1 99-coin = 1 €)', () => {
    expect(TAUX_PAR_DEFAUT_CENTIMES).toBe(100);
  });
});

describe('coinsEnCentimes', () => {
  it('100 coins → 10000 centimes (100 €)', () => {
    expect(coinsEnCentimes(100)).toBe(10000);
  });

  it('50.5 coins → 5050 centimes (50,50 €)', () => {
    expect(coinsEnCentimes(50.5)).toBe(5050);
  });

  it('arrondit au centime', () => {
    expect(coinsEnCentimes(0.123)).toBe(12); // 12.3 → 12
    expect(coinsEnCentimes(0.158)).toBe(16); // 15.8 → 16
  });

  it('0 coins → 0', () => {
    expect(coinsEnCentimes(0)).toBe(0);
  });

  it('taux custom', () => {
    expect(coinsEnCentimes(100, 5)).toBe(500);
    expect(coinsEnCentimes(100, 20)).toBe(2000);
  });
});

describe('centimesEnCoins', () => {
  it('1000 centimes (10 €) → 10 coins', () => {
    expect(centimesEnCoins(1000)).toBe(10);
  });

  it('505 centimes → 5.05 coins', () => {
    expect(centimesEnCoins(505)).toBe(5.05);
  });

  it('arrondit au 0.01', () => {
    expect(centimesEnCoins(123)).toBe(1.23);
  });

  it('0 si taux 0 (évite division par zéro)', () => {
    expect(centimesEnCoins(1000, 0)).toBe(0);
  });

  it('taux custom', () => {
    expect(centimesEnCoins(500, 5)).toBe(100);
  });
});

describe('totalCentimes', () => {
  it('5 € + 100 coins (parité 1:1) = 105 €', () => {
    expect(totalCentimes(500, 100)).toBe(10500);
  });

  it('seulement euros', () => {
    expect(totalCentimes(1000, 0)).toBe(1000);
  });

  it('seulement coins (50 coins = 50 €)', () => {
    expect(totalCentimes(0, 50)).toBe(5000);
  });

  it('taux custom', () => {
    expect(totalCentimes(100, 10, 5)).toBe(150);
  });
});
