import {
  attacherModuleSchema,
  creerCampagneSchema,
  modererCampagneSchema,
} from '@/lib/validations/campagne';
import { describe, expect, it } from 'vitest';

describe('creerCampagneSchema', () => {
  const base = {
    titre: 'Stop à l’autoroute A69',
    texte:
      'Campagne contre la construction de l’autoroute A69 entre Castres et Toulouse. Combat écologique, paysan, démocratique.',
    token_turnstile: 'mock-valid-token',
  };

  it('accepte une campagne minimale', () => {
    expect(creerCampagneSchema.safeParse(base).success).toBe(true);
  });

  it('refuse un texte < 100 chars', () => {
    expect(creerCampagneSchema.safeParse({ ...base, texte: 'court' }).success).toBe(false);
  });
});

describe('modererCampagneSchema', () => {
  const camp = '11111111-1111-4111-8111-111111111111';

  it('publier sans raison OK', () => {
    expect(
      modererCampagneSchema.safeParse({ campagne_id: camp, decision: 'publiee' }).success,
    ).toBe(true);
  });

  it('rejeter sans raison KO', () => {
    expect(
      modererCampagneSchema.safeParse({ campagne_id: camp, decision: 'rejetee' }).success,
    ).toBe(false);
  });

  it('rejeter avec raison >= 10 chars OK', () => {
    expect(
      modererCampagneSchema.safeParse({
        campagne_id: camp,
        decision: 'rejetee',
        raison_rejet: 'Hors charte éditoriale.',
      }).success,
    ).toBe(true);
  });
});

describe('attacherModuleSchema', () => {
  const camp = '11111111-1111-4111-8111-111111111111';
  const cible = '22222222-2222-4222-8222-222222222222';

  it('module pétition avec cible_id OK', () => {
    expect(
      attacherModuleSchema.safeParse({
        campagne_id: camp,
        type_module: 'petition',
        cible_id: cible,
        ordre: 1,
      }).success,
    ).toBe(true);
  });

  it('module pétition sans cible_id KO', () => {
    expect(
      attacherModuleSchema.safeParse({
        campagne_id: camp,
        type_module: 'petition',
        ordre: 1,
      }).success,
    ).toBe(false);
  });

  it('page éditoriale avec contenu OK', () => {
    expect(
      attacherModuleSchema.safeParse({
        campagne_id: camp,
        type_module: 'page_editoriale',
        contenu_editorial:
          'Voici le manifeste de cette campagne, qui explique le contexte et les objectifs.',
        ordre: 1,
      }).success,
    ).toBe(true);
  });

  it('page éditoriale avec contenu trop court KO', () => {
    expect(
      attacherModuleSchema.safeParse({
        campagne_id: camp,
        type_module: 'page_editoriale',
        contenu_editorial: 'court',
        ordre: 1,
      }).success,
    ).toBe(false);
  });

  it('page éditoriale avec cible_id KO (cohérence)', () => {
    expect(
      attacherModuleSchema.safeParse({
        campagne_id: camp,
        type_module: 'page_editoriale',
        contenu_editorial: 'Un manifeste bien écrit, plus de 20 caractères.',
        cible_id: cible,
        ordre: 1,
      }).success,
    ).toBe(false);
  });
});
