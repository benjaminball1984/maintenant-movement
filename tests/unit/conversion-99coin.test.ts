import {
  TAUX_PAR_DEFAUT_CENTIMES,
  centimesEnCoins,
  coinsEnCentimes,
  totalCentimes,
} from '@/lib/conversion-99coin';
import { describe, expect, it } from 'vitest';

describe('TAUX_PAR_DEFAUT_CENTIMES', () => {
  it('vaut 10 centimes par 99-coin', () => {
    expect(TAUX_PAR_DEFAUT_CENTIMES).toBe(10);
  });
});

describe('coinsEnCentimes', () => {
  it('100 coins → 1000 centimes (10 €)', () => {
    expect(coinsEnCentimes(100)).toBe(1000);
  });

  it('50.5 coins → 505 centimes', () => {
    expect(coinsEnCentimes(50.5)).toBe(505);
  });

  it('arrondit au centime', () => {
    expect(coinsEnCentimes(0.123)).toBe(1); // 1.23 → 1
    expect(coinsEnCentimes(0.158)).toBe(2); // 1.58 → 2
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
  it('1000 centimes → 100 coins', () => {
    expect(centimesEnCoins(1000)).toBe(100);
  });

  it('505 centimes → 50.5 coins', () => {
    expect(centimesEnCoins(505)).toBe(50.5);
  });

  it('arrondit au 0.01', () => {
    expect(centimesEnCoins(123)).toBe(12.3);
  });

  it('0 si taux 0 (évite division par zéro)', () => {
    expect(centimesEnCoins(1000, 0)).toBe(0);
  });

  it('taux custom', () => {
    expect(centimesEnCoins(500, 5)).toBe(100);
  });
});

describe('totalCentimes', () => {
  it('5 € + 100 coins (taux 10) = 15 €', () => {
    expect(totalCentimes(500, 100)).toBe(1500);
  });

  it('seulement euros', () => {
    expect(totalCentimes(1000, 0)).toBe(1000);
  });

  it('seulement coins', () => {
    expect(totalCentimes(0, 50)).toBe(500);
  });

  it('taux custom', () => {
    expect(totalCentimes(100, 10, 5)).toBe(150);
  });
});
