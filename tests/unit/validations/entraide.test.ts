import {
  cloturerOffreSchema,
  creerOffreEntraideSchema,
  retirerOffreSchema,
} from '@/lib/validations/entraide';
import { describe, expect, it } from 'vitest';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('creerOffreEntraideSchema', () => {
  const base = {
    titre: 'Chambre à Marseille pour militante de passage',
    description: 'Chambre d’ami chez moi, à Marseille. Disponible week-ends. Calme, près du métro.',
    type: 'hebergement' as const,
    sens: 'propose' as const,
    lieu: 'Marseille, 13003',
    token_turnstile: 'mock-valid-token',
  };

  it('accepte une offre minimale', () => {
    expect(creerOffreEntraideSchema.safeParse(base).success).toBe(true);
  });

  it('refuse un titre trop court', () => {
    expect(creerOffreEntraideSchema.safeParse({ ...base, titre: 'hi' }).success).toBe(false);
  });

  it('refuse une description trop courte', () => {
    expect(creerOffreEntraideSchema.safeParse({ ...base, description: 'court' }).success).toBe(
      false,
    );
  });

  it('refuse une latitude seule (sans longitude)', () => {
    expect(creerOffreEntraideSchema.safeParse({ ...base, latitude: 48.0 }).success).toBe(false);
  });

  it('accepte des coordonnées complètes', () => {
    expect(
      creerOffreEntraideSchema.safeParse({ ...base, latitude: 48.0, longitude: 2.0 }).success,
    ).toBe(true);
  });

  it('refuse un type inconnu', () => {
    expect(
      creerOffreEntraideSchema.safeParse({
        ...base,
        type: 'foobar' as unknown as 'hebergement',
      }).success,
    ).toBe(false);
  });
});

describe('retirerOffreSchema', () => {
  it('refuse une raison < 10 chars', () => {
    expect(retirerOffreSchema.safeParse({ offre_id: UUID, raison_retrait: 'court' }).success).toBe(
      false,
    );
  });

  it('accepte une raison >= 10 chars', () => {
    expect(
      retirerOffreSchema.safeParse({
        offre_id: UUID,
        raison_retrait: "Plus disponible, j'ai déménagé.",
      }).success,
    ).toBe(true);
  });
});

describe('cloturerOffreSchema', () => {
  it('accepte un offre_id valide', () => {
    expect(cloturerOffreSchema.safeParse({ offre_id: UUID }).success).toBe(true);
  });

  it('refuse un offre_id invalide', () => {
    expect(cloturerOffreSchema.safeParse({ offre_id: 'pas-un-uuid' }).success).toBe(false);
  });
});
