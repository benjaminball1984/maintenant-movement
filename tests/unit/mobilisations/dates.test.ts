import {
  formaterDateLongue,
  formaterPlage,
  formaterRelativeAVenir,
} from '@/lib/mobilisations/dates';
import { describe, expect, it } from 'vitest';

/**
 * Tests des helpers de formatage de dates (chantier 3.2).
 *
 * On ne teste pas le rendu exact (dépend du fuseau de la machine + de
 * la locale Node), juste la présence/absence des bons motifs.
 */
describe('formaterDateLongue', () => {
  it('produit une chaîne lisible en fr-FR', () => {
    const sortie = formaterDateLongue('2026-05-23T14:00:00Z');
    // Doit contenir le mois "mai" (ou un équivalent fr).
    expect(sortie.toLowerCase()).toContain('mai');
    expect(sortie).toContain('2026');
  });
});

describe('formaterPlage', () => {
  it('formate une mobilisation sans date_fin avec "à HH:MM"', () => {
    const sortie = formaterPlage('2026-05-23T14:00:00Z', null);
    expect(sortie).toMatch(/à \d{2}:\d{2}$/);
  });

  it('formate une mobilisation même jour avec flèche entre heures', () => {
    const sortie = formaterPlage('2026-05-23T14:00:00Z', '2026-05-23T18:00:00Z');
    expect(sortie).toContain('→');
  });

  it('formate une mobilisation pluri-jours avec "du X au Y"', () => {
    const sortie = formaterPlage('2026-05-23T14:00:00Z', '2026-05-25T18:00:00Z');
    expect(sortie).toMatch(/du .+ au /);
  });
});

describe('formaterRelativeAVenir', () => {
  const maintenant = new Date('2026-05-20T12:00:00Z');

  it('« Passée » pour une date passée', () => {
    expect(formaterRelativeAVenir('2026-05-19T12:00:00Z', maintenant)).toBe('Passée');
  });

  it('« Dans moins d’une heure » pour < 1h', () => {
    expect(formaterRelativeAVenir('2026-05-20T12:30:00Z', maintenant)).toBe(
      'Dans moins d’une heure',
    );
  });

  it('« Dans 2 heures » pour ~2h', () => {
    expect(formaterRelativeAVenir('2026-05-20T14:00:00Z', maintenant)).toMatch(/Dans \d+ heures?/);
  });

  it('« Demain » pour ~24h', () => {
    expect(formaterRelativeAVenir('2026-05-21T12:00:00Z', maintenant)).toBe('Demain');
  });

  it('« Dans N jours » pour quelques jours', () => {
    expect(formaterRelativeAVenir('2026-05-25T12:00:00Z', maintenant)).toMatch(/Dans \d+ jours/);
  });

  it('« Dans N mois » pour plusieurs mois', () => {
    expect(formaterRelativeAVenir('2026-09-20T12:00:00Z', maintenant)).toMatch(/Dans \d+ mois/);
  });
});
