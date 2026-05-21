import {
  contesterPrestationSchema,
  creerServiceSelSchema,
  declarerRealiseeSchema,
  reserverPrestationSchema,
} from '@/lib/validations/sel';
import { describe, expect, it } from 'vitest';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('creerServiceSelSchema', () => {
  const base = {
    titre: 'Coup de main jardinage le samedi',
    description: 'Je peux donner un coup de main pour de l’entretien jardin sur Marseille.',
    categorie: 'service' as const,
    sens: 'propose' as const,
    duree_minutes_estimee: 60,
    lieu: 'Marseille 13003',
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un service minimal', () => {
    expect(creerServiceSelSchema.safeParse(base).success).toBe(true);
  });

  it('refuse une durée trop courte', () => {
    expect(creerServiceSelSchema.safeParse({ ...base, duree_minutes_estimee: 5 }).success).toBe(
      false,
    );
  });

  it('refuse une durée > 480 minutes', () => {
    expect(creerServiceSelSchema.safeParse({ ...base, duree_minutes_estimee: 600 }).success).toBe(
      false,
    );
  });

  it('refuse une catégorie inconnue', () => {
    expect(
      creerServiceSelSchema.safeParse({ ...base, categorie: 'travail' as unknown as 'service' })
        .success,
    ).toBe(false);
  });
});

describe('reserverPrestationSchema', () => {
  it('accepte un service_id UUID + token', () => {
    expect(
      reserverPrestationSchema.safeParse({
        service_id: UUID,
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });
});

describe('declarerRealiseeSchema', () => {
  it('accepte une durée réelle de 90 minutes', () => {
    expect(
      declarerRealiseeSchema.safeParse({
        prestation_id: UUID,
        duree_minutes_reelle: 90,
      }).success,
    ).toBe(true);
  });

  it('refuse une durée 0', () => {
    expect(
      declarerRealiseeSchema.safeParse({
        prestation_id: UUID,
        duree_minutes_reelle: 0,
      }).success,
    ).toBe(false);
  });
});

describe('contesterPrestationSchema', () => {
  it('refuse une raison trop courte', () => {
    expect(
      contesterPrestationSchema.safeParse({
        prestation_id: UUID,
        raison: 'court',
      }).success,
    ).toBe(false);
  });

  it('accepte une raison valide', () => {
    expect(
      contesterPrestationSchema.safeParse({
        prestation_id: UUID,
        raison: "Service n'a pas été réalisé dans les conditions convenues.",
      }).success,
    ).toBe(true);
  });
});
