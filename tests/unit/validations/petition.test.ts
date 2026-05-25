import { editerPetitionSchema, signerPetitionSchema } from '@/lib/validations/petition';
import { describe, expect, it } from 'vitest';

/**
 * Tests du schéma de signature de pétition (chantier 2.1).
 *
 * Garantit que la modale de signature et la Server Action partagent
 * exactement la même validation : minimum nom/prenom/email/code_postal +
 * cases booléennes + token Turnstile.
 */
describe('signerPetitionSchema', () => {
  // UUID v4 conforme RFC (Zod 4 valide strictement la version + le variant).
  const valide = {
    petition_id: '11111111-1111-4111-8111-111111111111',
    nom: 'Ball',
    prenom: 'Camille',
    email: 'camille@exemple.fr',
    code_postal: '75011',
    telephone: '',
    accepte_newsletter: false,
    accepte_contact_createurice: false,
    token_turnstile: 'mock-valid-token',
  } as const;

  it('accepte une signature minimale', () => {
    expect(signerPetitionSchema.safeParse(valide).success).toBe(true);
  });

  it('refuse un petition_id non UUID', () => {
    const r = signerPetitionSchema.safeParse({ ...valide, petition_id: 'pas-un-uuid' });
    expect(r.success).toBe(false);
  });

  it('refuse un email invalide', () => {
    const r = signerPetitionSchema.safeParse({ ...valide, email: 'pas-un-email' });
    expect(r.success).toBe(false);
  });

  it('refuse un code postal à 4 chiffres', () => {
    const r = signerPetitionSchema.safeParse({ ...valide, code_postal: '7501' });
    expect(r.success).toBe(false);
  });

  it('accepte un téléphone français valide', () => {
    expect(signerPetitionSchema.safeParse({ ...valide, telephone: '0612345678' }).success).toBe(
      true,
    );
  });

  it('accepte les cases cochées', () => {
    expect(
      signerPetitionSchema.safeParse({
        ...valide,
        accepte_newsletter: true,
        accepte_contact_createurice: true,
      }).success,
    ).toBe(true);
  });

  it('refuse un token Turnstile vide', () => {
    expect(signerPetitionSchema.safeParse({ ...valide, token_turnstile: '' }).success).toBe(false);
  });
});

/**
 * Tests du schéma d'édition d'une pétition par l'équipe (chantier 13.2).
 *
 * Couvre surtout la règle croisée sur les dates (échéance >= lancement), qui
 * reflète la contrainte SQL `petition_dates_coherentes`, et la tolérance des
 * dates optionnelles (chaîne vide ou absente).
 */
describe('editerPetitionSchema', () => {
  const valide = {
    petition_id: '11111111-1111-4111-8111-111111111111',
    titre: 'Pour une cantine bio dans toutes les écoles',
    texte: 'a'.repeat(120),
    destinataire: 'Le conseil municipal',
    image_url: '',
    objectif: 5000,
    date_lancement: '',
    date_echeance: '',
  } as const;

  it('accepte une édition sans dates', () => {
    expect(editerPetitionSchema.safeParse(valide).success).toBe(true);
  });

  it('accepte une échéance postérieure au lancement', () => {
    const r = editerPetitionSchema.safeParse({
      ...valide,
      date_lancement: '2026-01-01',
      date_echeance: '2026-06-01',
    });
    expect(r.success).toBe(true);
  });

  it('refuse une échéance antérieure au lancement', () => {
    const r = editerPetitionSchema.safeParse({
      ...valide,
      date_lancement: '2026-06-01',
      date_echeance: '2026-01-01',
    });
    expect(r.success).toBe(false);
  });

  it('accepte une seule des deux dates', () => {
    expect(editerPetitionSchema.safeParse({ ...valide, date_echeance: '2026-06-01' }).success).toBe(
      true,
    );
  });

  it('refuse un objectif sous le minimum', () => {
    expect(editerPetitionSchema.safeParse({ ...valide, objectif: 10 }).success).toBe(false);
  });

  it('refuse un texte trop court', () => {
    expect(editerPetitionSchema.safeParse({ ...valide, texte: 'trop court' }).success).toBe(false);
  });
});
