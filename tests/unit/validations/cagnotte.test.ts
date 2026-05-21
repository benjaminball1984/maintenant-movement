import {
  creerCagnotteSchema,
  faireDonEurosSchema,
  faireDonT99CPSchema,
  suspendreCagnotteSchema,
} from '@/lib/validations/cagnotte';
import { describe, expect, it } from 'vitest';

const UUID = '11111111-1111-4111-8111-111111111111';
const TX_HASH = `0x${'a'.repeat(64)}`;
const WALLET = `0x${'b'.repeat(40)}`;

describe('creerCagnotteSchema', () => {
  const base = {
    titre: 'Caisse de grève des cheminot·es',
    texte:
      'Soutien matériel pour les cheminot·es en grève reconductible. Chaque don aide à tenir la durée du mouvement et à couvrir les pertes de salaire.',
    type: 'lutte' as const,
    objectif_euros: 5000,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte une cagnotte minimale', () => {
    expect(creerCagnotteSchema.safeParse(base).success).toBe(true);
  });

  it('accepte objectif 0 (cagnotte sans seuil)', () => {
    expect(creerCagnotteSchema.safeParse({ ...base, objectif_euros: 0 }).success).toBe(true);
  });

  it('refuse objectif négatif', () => {
    expect(creerCagnotteSchema.safeParse({ ...base, objectif_euros: -100 }).success).toBe(false);
  });

  it('refuse un wallet mal formé', () => {
    expect(creerCagnotteSchema.safeParse({ ...base, wallet_t99cp: '0xpasvalide' }).success).toBe(
      false,
    );
  });

  it('accepte un wallet bien formé', () => {
    expect(creerCagnotteSchema.safeParse({ ...base, wallet_t99cp: WALLET }).success).toBe(true);
  });

  it('refuse un type invalide', () => {
    expect(
      creerCagnotteSchema.safeParse({
        ...base,
        type: 'foobar' as unknown as 'ouverte',
      }).success,
    ).toBe(false);
  });
});

describe('faireDonEurosSchema', () => {
  const base = {
    cagnotte_id: UUID,
    montant_centimes: 2000,
    accepte_newsletter: false,
    accepte_contact_createurice: false,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un don 20 €', () => {
    expect(faireDonEurosSchema.safeParse(base).success).toBe(true);
  });

  it('refuse un montant < 100 centimes', () => {
    expect(faireDonEurosSchema.safeParse({ ...base, montant_centimes: 50 }).success).toBe(false);
  });

  it('refuse un email mal formé', () => {
    expect(faireDonEurosSchema.safeParse({ ...base, email: 'pas-un-email' }).success).toBe(false);
  });
});

describe('faireDonT99CPSchema', () => {
  const base = {
    cagnotte_id: UUID,
    montant_unites: '10',
    tx_hash: TX_HASH,
    accepte_newsletter: false,
    accepte_contact_createurice: false,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un don T99CP minimal', () => {
    expect(faireDonT99CPSchema.safeParse(base).success).toBe(true);
  });

  it('refuse un montant 0', () => {
    expect(faireDonT99CPSchema.safeParse({ ...base, montant_unites: '0' }).success).toBe(false);
  });

  it('refuse un tx_hash mal formé', () => {
    expect(faireDonT99CPSchema.safeParse({ ...base, tx_hash: '0xinvalide' }).success).toBe(false);
  });
});

describe('suspendreCagnotteSchema', () => {
  it('refuse une raison < 10 chars', () => {
    expect(
      suspendreCagnotteSchema.safeParse({
        cagnotte_id: UUID,
        raison_suspension: 'court',
      }).success,
    ).toBe(false);
  });

  it('accepte une raison valide', () => {
    expect(
      suspendreCagnotteSchema.safeParse({
        cagnotte_id: UUID,
        raison_suspension: 'Signalements multiples, vérification en cours.',
      }).success,
    ).toBe(true);
  });
});
