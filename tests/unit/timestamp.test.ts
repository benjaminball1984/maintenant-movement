import {
  estTimestampValide,
  isoEnSecondes,
  maintenantEnSecondes,
  secondesEnIso,
} from '@/lib/timestamp';
import { describe, expect, it } from 'vitest';

describe('isoEnSecondes', () => {
  it('convertit ISO en Unix secondes', () => {
    expect(isoEnSecondes('2026-05-23T14:00:00.000Z')).toBe(1779544800);
  });

  it('null si invalide', () => {
    expect(isoEnSecondes('pas une date')).toBeNull();
  });

  it('arrondit en bas (Math.floor)', () => {
    // 2026-05-23T14:00:00.999Z = 1779544800.999 → 1779544800
    expect(isoEnSecondes('2026-05-23T14:00:00.999Z')).toBe(1779544800);
  });
});

describe('secondesEnIso', () => {
  it('convertit Unix en ISO UTC', () => {
    expect(secondesEnIso(1779544800)).toBe('2026-05-23T14:00:00.000Z');
  });

  it('round-trip iso ↔ secondes', () => {
    const iso = '2026-05-23T14:00:00.000Z';
    const s = isoEnSecondes(iso);
    expect(s).not.toBeNull();
    expect(secondesEnIso(s as number)).toBe(iso);
  });
});

describe('maintenantEnSecondes', () => {
  it('retourne un timestamp Unix plausible', () => {
    const t = maintenantEnSecondes();
    expect(estTimestampValide(t)).toBe(true);
  });

  it('proche de Date.now() / 1000', () => {
    const a = maintenantEnSecondes();
    const b = Math.floor(Date.now() / 1000);
    expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
  });
});

describe('estTimestampValide', () => {
  it('true pour timestamp 2026', () => {
    expect(estTimestampValide(1779793200)).toBe(true);
  });

  it('true pour 2000-01-01', () => {
    expect(estTimestampValide(946_684_800)).toBe(true);
  });

  it('false pour timestamp en millisecondes (×1000 trop grand)', () => {
    expect(estTimestampValide(1779793200000)).toBe(false);
  });

  it('false pour timestamp avant 2000', () => {
    expect(estTimestampValide(0)).toBe(false);
    expect(estTimestampValide(1000)).toBe(false);
  });

  it('false pour Infinity / NaN', () => {
    expect(estTimestampValide(Number.POSITIVE_INFINITY)).toBe(false);
    expect(estTimestampValide(Number.NaN)).toBe(false);
  });

  it('false pour null/undefined', () => {
    expect(estTimestampValide(null)).toBe(false);
    expect(estTimestampValide(undefined)).toBe(false);
  });
});
