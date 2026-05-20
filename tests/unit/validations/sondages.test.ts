import { creerSondageSchema, voterSondageSchema } from '@/lib/validations/sondages';
import { describe, expect, it } from 'vitest';

describe('creerSondageSchema', () => {
  const base = {
    titre: 'Sondage sur le quartier',
    question: 'Quelle priorité pour le quartier ?',
    options: ['Espaces verts', 'Sécurité', 'Transports', 'Logement'],
    mode: 'classique' as const,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un sondage minimal', () => {
    expect(creerSondageSchema.safeParse(base).success).toBe(true);
  });

  it('refuse moins de 2 options', () => {
    expect(creerSondageSchema.safeParse({ ...base, options: ['Une seule'] }).success).toBe(false);
  });

  it('refuse plus de 10 options', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options: Array.from({ length: 11 }, (_, i) => `O${i}`),
      }).success,
    ).toBe(false);
  });
});

describe('voterSondageSchema', () => {
  const base = {
    sondage_id: '11111111-1111-4111-8111-111111111111',
    option_index: 2,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un vote simple', () => {
    expect(voterSondageSchema.safeParse(base).success).toBe(true);
  });

  it('refuse option_index négatif', () => {
    expect(voterSondageSchema.safeParse({ ...base, option_index: -1 }).success).toBe(false);
  });

  it('accepte une tranche d’âge', () => {
    expect(voterSondageSchema.safeParse({ ...base, tranche_age: '25_34' as const }).success).toBe(
      true,
    );
  });

  it('refuse un code postal mal formé', () => {
    expect(voterSondageSchema.safeParse({ ...base, code_postal: '7507' }).success).toBe(false);
  });
});
