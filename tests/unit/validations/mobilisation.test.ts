import {
  creerMobilisationSchema,
  participerMobilisationSchema,
  retirerMobilisationSchema,
  slugifierTitreMobilisation,
} from '@/lib/validations/mobilisation';
import { describe, expect, it } from 'vitest';

/**
 * Tests des schémas Zod et helpers de validation Mobilisations (chantier 3.2).
 */
describe('creerMobilisationSchema', () => {
  const base = {
    titre: 'Manifestation climat samedi',
    description:
      'Rassemblement citoyen pour la justice climatique. Départ du métro République, marche jusqu’à Bastille, prises de parole.',
    lieu: 'Place de la République, Paris 11e',
    date_debut: '2026-06-15T14:00:00.000Z',
    token_turnstile: 'mock-valid-token',
  } as const;

  it('accepte une mobilisation minimale', () => {
    expect(creerMobilisationSchema.safeParse(base).success).toBe(true);
  });

  it('refuse un titre trop court', () => {
    const r = creerMobilisationSchema.safeParse({ ...base, titre: 'hi' });
    expect(r.success).toBe(false);
  });

  it('refuse une description < 50 chars', () => {
    const r = creerMobilisationSchema.safeParse({ ...base, description: 'trop court' });
    expect(r.success).toBe(false);
  });

  it('accepte des coordonnées complètes', () => {
    const r = creerMobilisationSchema.safeParse({ ...base, latitude: 48.8676, longitude: 2.3631 });
    expect(r.success).toBe(true);
  });

  it('refuse une latitude seule (sans longitude)', () => {
    const r = creerMobilisationSchema.safeParse({ ...base, latitude: 48.8676 });
    expect(r.success).toBe(false);
  });

  it('refuse une date_fin antérieure à date_debut', () => {
    const r = creerMobilisationSchema.safeParse({
      ...base,
      date_fin: '2026-06-14T18:00:00.000Z',
    });
    expect(r.success).toBe(false);
  });

  it('accepte une date_fin postérieure à date_debut', () => {
    const r = creerMobilisationSchema.safeParse({
      ...base,
      date_fin: '2026-06-15T18:00:00.000Z',
    });
    expect(r.success).toBe(true);
  });

  it('refuse une latitude hors plage', () => {
    const r = creerMobilisationSchema.safeParse({ ...base, latitude: 200, longitude: 2 });
    expect(r.success).toBe(false);
  });
});

describe('participerMobilisationSchema', () => {
  const base = {
    mobilisation_id: '11111111-1111-4111-8111-111111111111',
    accepte_notifications: false,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un clic minimal anonyme', () => {
    expect(participerMobilisationSchema.safeParse(base).success).toBe(true);
  });

  it('accepte un code postal optionnel', () => {
    expect(participerMobilisationSchema.safeParse({ ...base, code_postal: '75011' }).success).toBe(
      true,
    );
  });

  it('refuse un code postal mal formé', () => {
    expect(participerMobilisationSchema.safeParse({ ...base, code_postal: 'ABCDE' }).success).toBe(
      false,
    );
  });
});

describe('retirerMobilisationSchema', () => {
  it('refuse une raison trop courte', () => {
    const r = retirerMobilisationSchema.safeParse({
      mobilisation_id: '11111111-1111-4111-8111-111111111111',
      raison_retrait: 'court',
    });
    expect(r.success).toBe(false);
  });

  it('accepte une raison >= 10 chars', () => {
    const r = retirerMobilisationSchema.safeParse({
      mobilisation_id: '11111111-1111-4111-8111-111111111111',
      raison_retrait: 'Lieu mensonger, signalé par plusieurs sources.',
    });
    expect(r.success).toBe(true);
  });
});

describe('slugifierTitreMobilisation', () => {
  it('retire les diacritiques', () => {
    expect(slugifierTitreMobilisation('Manif à République')).toBe('manif-a-republique');
  });

  it('limite à 80 caractères', () => {
    expect(slugifierTitreMobilisation('a'.repeat(200)).length).toBeLessThanOrEqual(80);
  });
});
