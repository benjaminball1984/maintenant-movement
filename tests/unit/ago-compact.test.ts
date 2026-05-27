import { agoCompact } from '@/lib/ago-compact';
import { describe, expect, it } from 'vitest';

const REF = new Date('2026-05-23T14:00:00.000Z');

describe('agoCompact', () => {
  it('"maintenant" sous 60 secondes', () => {
    expect(agoCompact('2026-05-23T13:59:30.000Z', REF)).toBe('maintenant');
  });

  it('"Nmin" sous 60 minutes', () => {
    expect(agoCompact('2026-05-23T13:55:00.000Z', REF)).toBe('5min');
    expect(agoCompact('2026-05-23T13:00:30.000Z', REF)).toBe('59min');
  });

  it('"Nh" sous 24 heures', () => {
    expect(agoCompact('2026-05-23T12:00:00.000Z', REF)).toBe('2h');
    expect(agoCompact('2026-05-22T15:00:00.000Z', REF)).toBe('23h');
  });

  it('"Nj" sous 30 jours', () => {
    expect(agoCompact('2026-05-22T14:00:00.000Z', REF)).toBe('1j');
    expect(agoCompact('2026-05-18T14:00:00.000Z', REF)).toBe('5j');
  });

  it('"Nmo" sous 12 mois', () => {
    expect(agoCompact('2026-02-23T14:00:00.000Z', REF)).toMatch(/^\dmo$/);
  });

  it('"Na" au-delà de 12 mois', () => {
    expect(agoCompact('2025-04-23T14:00:00.000Z', REF)).toBe('1a');
    expect(agoCompact('2024-04-23T14:00:00.000Z', REF)).toBe('2a');
  });

  it('"futur" pour date à venir', () => {
    expect(agoCompact('2026-05-23T15:00:00.000Z', REF)).toBe('futur');
  });
});
