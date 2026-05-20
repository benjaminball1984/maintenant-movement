import {
  creerCommuneLibreSchema,
  creerConfederationSchema,
  creerFederationSchema,
  quitterCommuneSchema,
  rejoindreCommuneSchema,
  tirerAuSortAssembleeSchema,
} from '@/lib/validations/communes';
import { describe, expect, it } from 'vitest';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('rejoindreCommuneSchema', () => {
  it('accepte commune_id + token', () => {
    expect(
      rejoindreCommuneSchema.safeParse({
        commune_id: UUID,
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });

  it('accepte le flag confirme', () => {
    expect(
      rejoindreCommuneSchema.safeParse({
        commune_id: UUID,
        confirme: true,
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });

  it('refuse un commune_id non-UUID', () => {
    expect(
      rejoindreCommuneSchema.safeParse({
        commune_id: 'pas-un-uuid',
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(false);
  });
});

describe('quitterCommuneSchema', () => {
  it('exige un UUID', () => {
    expect(quitterCommuneSchema.safeParse({ commune_id: 'nope' }).success).toBe(false);
    expect(quitterCommuneSchema.safeParse({ commune_id: UUID }).success).toBe(true);
  });
});

describe('creerCommuneLibreSchema', () => {
  const base = {
    nom: 'Commune libre du Plateau',
    description_courte: 'Quartier auto-organisé',
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un nom + token', () => {
    expect(creerCommuneLibreSchema.safeParse(base).success).toBe(true);
  });

  it('refuse code postal non FR', () => {
    expect(
      creerCommuneLibreSchema.safeParse({ ...base, code_postal_principal: 'abcd' }).success,
    ).toBe(false);
  });

  it('refuse latitude sans longitude', () => {
    expect(
      creerCommuneLibreSchema.safeParse({ ...base, latitude: 48.85, longitude: null }).success,
    ).toBe(false);
  });
});

describe('creerFederationSchema', () => {
  const base = {
    nom: 'Fédération des quartiers populaires',
    type: 'mixte' as const,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte une fédération mixte', () => {
    expect(creerFederationSchema.safeParse(base).success).toBe(true);
  });

  it('refuse un type inconnu', () => {
    expect(
      creerFederationSchema.safeParse({
        ...base,
        type: 'religieuse' as unknown as 'mixte',
      }).success,
    ).toBe(false);
  });
});

describe('creerConfederationSchema', () => {
  it('accepte un nom + token', () => {
    expect(
      creerConfederationSchema.safeParse({
        nom: 'Confédération populaire de France',
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });
});

describe('tirerAuSortAssembleeSchema', () => {
  it('accepte un tirage à 1 binôme', () => {
    expect(
      tirerAuSortAssembleeSchema.safeParse({
        entite_type: 'commune',
        entite_id: UUID,
        nb_binomes: 1,
      }).success,
    ).toBe(true);
  });

  it('refuse plus de 10 binômes', () => {
    expect(
      tirerAuSortAssembleeSchema.safeParse({
        entite_type: 'commune',
        entite_id: UUID,
        nb_binomes: 11,
      }).success,
    ).toBe(false);
  });
});
