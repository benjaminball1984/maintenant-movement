import { SEPT_RDV, TYPES_MOMENTS, gabaritFlyerPortAPorte } from '@/lib/moments/config';
import {
  ajouterTupperwareSchema,
  creerMomentSolidaireSchema,
  participerMomentSchema,
} from '@/lib/validations/moments';
import { describe, expect, it } from 'vitest';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('creerMomentSolidaireSchema', () => {
  const base = {
    titre: 'Repas solidaire Belleville',
    description: 'Auberge espagnole + surplus végétarien dans le 20e arrondissement.',
    type: 'repas_solidaire' as const,
    lieu: 'Belleville, Paris 20e',
    commence_le: '2026-06-01T19:00:00.000Z',
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un repas solidaire minimal', () => {
    expect(creerMomentSolidaireSchema.safeParse(base).success).toBe(true);
  });

  it('accepte un porte-à-porte (qui déclenche la génération des 7 RDV)', () => {
    expect(creerMomentSolidaireSchema.safeParse({ ...base, type: 'porte_a_porte' }).success).toBe(
      true,
    );
  });

  it('refuse un type inconnu', () => {
    expect(
      creerMomentSolidaireSchema.safeParse({
        ...base,
        type: 'fete' as unknown as typeof base.type,
      }).success,
    ).toBe(false);
  });

  it('refuse une date de fin avant le début', () => {
    expect(
      creerMomentSolidaireSchema.safeParse({
        ...base,
        commence_le: '2026-06-01T20:00:00.000Z',
        termine_le: '2026-06-01T18:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});

describe('participerMomentSchema', () => {
  it('accepte une participation anonyme', () => {
    expect(
      participerMomentSchema.safeParse({
        moment_id: UUID,
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });

  it('accepte une participation avec coordonnées', () => {
    expect(
      participerMomentSchema.safeParse({
        moment_id: UUID,
        prenom: 'Sam',
        email: 'sam@example.com',
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });
});

describe('ajouterTupperwareSchema', () => {
  it('refuse sans prénom porteureuse', () => {
    expect(
      ajouterTupperwareSchema.safeParse({
        moment_id: UUID,
        porteureuse_prenom: '',
      }).success,
    ).toBe(false);
  });

  it('accepte un tupperware minimal', () => {
    expect(
      ajouterTupperwareSchema.safeParse({
        moment_id: UUID,
        porteureuse_prenom: 'Lou',
      }).success,
    ).toBe(true);
  });
});

describe('SEPT_RDV (cf. spec §7C porte-à-porte solidaire en 7 moments)', () => {
  it('contient exactement 7 RDV', () => {
    expect(SEPT_RDV.length).toBe(7);
  });

  it('les décalages sont en ordre croissant', () => {
    for (let i = 1; i < SEPT_RDV.length; i += 1) {
      const courant = SEPT_RDV[i];
      const precedent = SEPT_RDV[i - 1];
      if (courant === undefined || precedent === undefined) continue;
      expect(courant.decalageJours).toBeGreaterThanOrEqual(precedent.decalageJours);
    }
  });

  it('le 1er RDV est à J = 0', () => {
    expect(SEPT_RDV[0]?.decalageJours).toBe(0);
  });
});

describe('TYPES_MOMENTS', () => {
  it('contient les 8 types', () => {
    expect(Object.keys(TYPES_MOMENTS).length).toBe(8);
  });

  it('seul porte_a_porte génère 7 RDV', () => {
    const genere = Object.values(TYPES_MOMENTS).filter((t) => t.genere7RDV);
    expect(genere.length).toBe(1);
    expect(genere[0]?.type).toBe('porte_a_porte');
  });
});

describe('gabaritFlyerPortAPorte', () => {
  it('contient le slogan « Entrez dans nous » sans écriture inclusive (spec §7C)', () => {
    const texte = gabaritFlyerPortAPorte({
      lieu: 'Belleville',
      dateHumaine: '15 juin',
      contact: 'contact@exemple.org',
    });
    expect(texte).toContain('Entrez dans nous');
    // Pas de point médian (accessibilité tactique).
    expect(texte).not.toContain('·');
  });
});
