import { formaterRelativeAVenir, formaterRelativePassee } from '@/lib/mobilisations/dates';
import { describe, expect, it } from 'vitest';

// Référence fixe pour des tests déterministes : samedi 23 mai 2026 14:00 UTC.
const MAINTENANT = new Date('2026-05-23T14:00:00.000Z');

describe('formaterRelativeAVenir', () => {
  it('retourne "Passée" pour une date passée', () => {
    expect(formaterRelativeAVenir('2026-05-23T13:00:00.000Z', MAINTENANT)).toBe('Passée');
  });

  it('« Dans moins d’une heure » sous 60 min', () => {
    expect(formaterRelativeAVenir('2026-05-23T14:30:00.000Z', MAINTENANT)).toBe(
      'Dans moins d’une heure',
    );
  });

  it('« Dans 2 heures »', () => {
    expect(formaterRelativeAVenir('2026-05-23T16:00:00.000Z', MAINTENANT)).toBe('Dans 2 heures');
  });

  it('« Demain » à J+1', () => {
    expect(formaterRelativeAVenir('2026-05-24T14:00:00.000Z', MAINTENANT)).toBe('Demain');
  });

  it('« Dans 5 jours » à J+5', () => {
    expect(formaterRelativeAVenir('2026-05-28T14:00:00.000Z', MAINTENANT)).toBe('Dans 5 jours');
  });

  it('« Dans X mois » au-delà de 30 jours', () => {
    expect(formaterRelativeAVenir('2026-08-23T14:00:00.000Z', MAINTENANT)).toMatch(/Dans \d mois/);
  });
});

describe('formaterRelativePassee', () => {
  it('retourne "à venir" pour une date future', () => {
    expect(formaterRelativePassee('2026-05-23T15:00:00.000Z', MAINTENANT)).toBe('à venir');
  });

  it('« à l’instant » sous 60s', () => {
    expect(formaterRelativePassee('2026-05-23T13:59:30.000Z', MAINTENANT)).toBe('à l’instant');
  });

  it('« il y a 5 min »', () => {
    expect(formaterRelativePassee('2026-05-23T13:55:00.000Z', MAINTENANT)).toBe('il y a 5 min');
  });

  it('« il y a 2 h »', () => {
    expect(formaterRelativePassee('2026-05-23T12:00:00.000Z', MAINTENANT)).toBe('il y a 2 h');
  });

  it('« hier » à J-1', () => {
    expect(formaterRelativePassee('2026-05-22T14:00:00.000Z', MAINTENANT)).toBe('hier');
  });

  it('« il y a 5 jours » à J-5', () => {
    expect(formaterRelativePassee('2026-05-18T14:00:00.000Z', MAINTENANT)).toBe('il y a 5 jours');
  });

  it('« il y a X mois » au-delà de 30 jours', () => {
    expect(formaterRelativePassee('2026-02-23T14:00:00.000Z', MAINTENANT)).toMatch(
      /il y a \d mois/,
    );
  });

  it('« il y a 1 an » au-delà de 12 mois', () => {
    expect(formaterRelativePassee('2025-04-23T14:00:00.000Z', MAINTENANT)).toBe('il y a 1 an');
  });

  it('« il y a 2 ans » au-delà de 24 mois', () => {
    expect(formaterRelativePassee('2024-04-23T14:00:00.000Z', MAINTENANT)).toBe('il y a 2 ans');
  });
});
