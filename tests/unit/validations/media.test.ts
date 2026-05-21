import { creerMediaSchema, retirerMediaSchema } from '@/lib/validations/media';
import { describe, expect, it } from 'vitest';

describe('creerMediaSchema', () => {
  const base = {
    titre: 'Pourquoi nous nous mobilisons',
    corps: 'Texte de l’édito qui explique nos motivations et notre démarche politique.',
    type: 'edito' as const,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un édito minimal', () => {
    expect(creerMediaSchema.safeParse(base).success).toBe(true);
  });

  it('refuse un type inconnu', () => {
    expect(
      creerMediaSchema.safeParse({ ...base, type: 'spam' as unknown as 'edito' }).success,
    ).toBe(false);
  });

  it('exige une source_url quand une provenance externe est précisée', () => {
    expect(
      creerMediaSchema.safeParse({
        ...base,
        type: 'breve',
        provenance_externe: 'Reuters',
      }).success,
    ).toBe(false);
  });

  it('accepte une brève Reuters avec source', () => {
    expect(
      creerMediaSchema.safeParse({
        ...base,
        type: 'breve',
        provenance_externe: 'Reuters',
        source_url: 'https://reuters.com/article/xxx',
      }).success,
    ).toBe(true);
  });
});

describe('retirerMediaSchema', () => {
  it('refuse une raison courte', () => {
    expect(
      retirerMediaSchema.safeParse({
        media_id: '11111111-1111-4111-8111-111111111111',
        raison_retrait: 'court',
      }).success,
    ).toBe(false);
  });

  it('accepte une raison valide', () => {
    expect(
      retirerMediaSchema.safeParse({
        media_id: '11111111-1111-4111-8111-111111111111',
        raison_retrait: 'Contenu jugé contraire à la charte (insulte caractérisée).',
      }).success,
    ).toBe(true);
  });
});
