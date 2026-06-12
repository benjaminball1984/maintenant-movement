import { creerSondageSchema, voterSondageSchema } from '@/lib/validations/sondages';
import { describe, expect, it } from 'vitest';

describe('creerSondageSchema', () => {
  const base = {
    titre: 'Sondage sur le quartier',
    question: 'Quelle priorité pour le quartier ?',
    options: ['Espaces verts', 'Sécurité', 'Transports', 'Logement'],
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un sondage minimal', () => {
    expect(creerSondageSchema.safeParse(base).success).toBe(true);
  });

  it('refuse moins de 2 options', () => {
    expect(creerSondageSchema.safeParse({ ...base, options: ['Une seule'] }).success).toBe(false);
  });

  it('accepte 20 options (revue 2026-06-12)', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options: Array.from({ length: 20 }, (_, i) => `O${i}`),
      }).success,
    ).toBe(true);
  });

  it('refuse plus de 20 options', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options: Array.from({ length: 21 }, (_, i) => `O${i}`),
      }).success,
    ).toBe(false);
  });

  it("refuse l'ancien champ mode (retiré : affichage automatique)", () => {
    expect(creerSondageSchema.safeParse({ ...base, mode: 'classique' }).success).toBe(false);
  });

  it('accepte des images d’options alignées (null = option sans image)', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options_images: ['https://exemple.org/a.jpg', null, null, 'https://exemple.org/d.jpg'],
      }).success,
    ).toBe(true);
  });

  it('refuse des images d’options de longueur différente des options', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options_images: ['https://exemple.org/a.jpg', null],
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

  it('accepte option_index 19 (20 options possibles)', () => {
    expect(voterSondageSchema.safeParse({ ...base, option_index: 19 }).success).toBe(true);
  });

  it('refuse option_index 20 (hors plage)', () => {
    expect(voterSondageSchema.safeParse({ ...base, option_index: 20 }).success).toBe(false);
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
