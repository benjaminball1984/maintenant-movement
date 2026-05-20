import {
  MONTANT_ADHESION_EUR_CENTIMES,
  MONTANT_ADHESION_T99CP_UNITES,
  adhererEurosSchema,
  adhererGratuitSchema,
  adhererT99CPSchema,
} from '@/lib/validations/adhesion';
import { describe, expect, it } from 'vitest';

describe('Adhésion — constantes', () => {
  it('12 € = 1200 centimes', () => {
    expect(MONTANT_ADHESION_EUR_CENTIMES).toBe(1200);
  });

  it('12 T99CP en plus petite unité = 12 * 10^18', () => {
    expect(MONTANT_ADHESION_T99CP_UNITES).toBe('12000000000000000000');
    // Sanity: BigInt(...) ne plante pas.
    expect(BigInt(MONTANT_ADHESION_T99CP_UNITES)).toBe(12n * 10n ** 18n);
  });
});

describe('adhererGratuitSchema', () => {
  it('accepte un token Turnstile valide', () => {
    expect(adhererGratuitSchema.safeParse({ token_turnstile: 'mock-valid-token' }).success).toBe(
      true,
    );
  });

  it('refuse un token vide', () => {
    expect(adhererGratuitSchema.safeParse({ token_turnstile: '' }).success).toBe(false);
  });
});

describe('adhererEurosSchema', () => {
  it('accepte un token Turnstile valide', () => {
    expect(adhererEurosSchema.safeParse({ token_turnstile: 'mock-valid-token' }).success).toBe(
      true,
    );
  });
});

describe('adhererT99CPSchema', () => {
  it('accepte sans tx_hash (mode mock)', () => {
    expect(adhererT99CPSchema.safeParse({ token_turnstile: 'mock-valid-token' }).success).toBe(
      true,
    );
  });

  it('accepte avec un tx_hash valide', () => {
    expect(
      adhererT99CPSchema.safeParse({
        tx_hash: `0x${'a'.repeat(64)}`,
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });

  it('refuse un tx_hash mal formaté', () => {
    expect(
      adhererT99CPSchema.safeParse({
        tx_hash: '0xnope',
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(false);
  });
});
