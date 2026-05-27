import { formaterDureeCompacte, formaterDureeLongue } from '@/lib/duree';
import { describe, expect, it } from 'vitest';

describe('formaterDureeCompacte', () => {
  it('0ms → 0s', () => {
    expect(formaterDureeCompacte(0)).toBe('0s');
  });

  it('45s', () => {
    expect(formaterDureeCompacte(45_000)).toBe('45s');
  });

  it('2min 5s', () => {
    expect(formaterDureeCompacte(125_000)).toBe('2min 5s');
  });

  it('5min pile', () => {
    expect(formaterDureeCompacte(300_000)).toBe('5min');
  });

  it('1h pile', () => {
    expect(formaterDureeCompacte(3_600_000)).toBe('1h');
  });

  it('2h 15min', () => {
    expect(formaterDureeCompacte(8_100_000)).toBe('2h 15min');
  });

  it('1j 1h', () => {
    expect(formaterDureeCompacte(90_000_000)).toBe('1j 1h');
  });

  it('3j pile', () => {
    expect(formaterDureeCompacte(3 * 86_400_000)).toBe('3j');
  });

  it('valeur négative → 0s (sécurité)', () => {
    expect(formaterDureeCompacte(-100)).toBe('0s');
  });
});

describe('formaterDureeLongue', () => {
  it('< 1s → 0 seconde', () => {
    expect(formaterDureeLongue(500)).toBe('0 seconde');
  });

  it('singulier 1 seconde', () => {
    expect(formaterDureeLongue(1000)).toBe('1 seconde');
  });

  it('pluriel 5 secondes', () => {
    expect(formaterDureeLongue(5000)).toBe('5 secondes');
  });

  it('2 minutes et 5 secondes', () => {
    expect(formaterDureeLongue(125_000)).toBe('2 minutes et 5 secondes');
  });

  it('1 heure pile', () => {
    expect(formaterDureeLongue(3_600_000)).toBe('1 heure');
  });

  it('3 jours et 2 heures', () => {
    expect(formaterDureeLongue(3 * 86_400_000 + 2 * 3_600_000)).toBe('3 jours et 2 heures');
  });

  it('1 jour, 2 heures, 30 minutes ignore minutes/secondes si jour présent', () => {
    // Au-delà du jour : on ne mentionne plus minutes/secondes
    expect(formaterDureeLongue(86_400_000 + 7_200_000 + 1_800_000)).toBe('1 jour et 2 heures');
  });
});
