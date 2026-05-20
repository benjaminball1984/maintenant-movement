import { signerPetitionSchema } from '@/lib/validations/petition';
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
