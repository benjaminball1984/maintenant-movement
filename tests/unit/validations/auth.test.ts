import {
  codePostalFrancaisSchema,
  connexionMdpSchema,
  dateNaissanceSchema,
  inscriptionSchema,
  magicLinkSchema,
  motDePasseSchema,
} from '@/lib/validations/auth';
import { describe, expect, it } from 'vitest';

/**
 * Tests des schémas Zod d'authentification.
 *
 * Couvrent les règles métier critiques :
 * - âge ≥ 15 ans (RGPD §5G)
 * - mot de passe (12+ chars, complexité minimale)
 * - code postal français (5 chiffres)
 * - email valide
 * - CGU obligatoire (literal true)
 * - token Turnstile non vide
 *
 * Si une de ces règles passe à la trappe, c'est tout un pan de la
 * conformité qui tombe. Donc tests systématiques.
 */

describe('motDePasseSchema', () => {
  it('refuse un mot de passe trop court', () => {
    const r = motDePasseSchema.safeParse('Abc12345');
    expect(r.success).toBe(false);
  });

  it('refuse un mot de passe sans majuscule', () => {
    const r = motDePasseSchema.safeParse('motdepasse1234');
    expect(r.success).toBe(false);
  });

  it('refuse un mot de passe sans minuscule', () => {
    const r = motDePasseSchema.safeParse('MOTDEPASSE1234');
    expect(r.success).toBe(false);
  });

  it('refuse un mot de passe sans chiffre', () => {
    const r = motDePasseSchema.safeParse('MotDePasseSurpr');
    expect(r.success).toBe(false);
  });

  it('accepte un mot de passe conforme (12+ chars, complexité)', () => {
    const r = motDePasseSchema.safeParse('MonMotDePasse1');
    expect(r.success).toBe(true);
  });
});

describe('codePostalFrancaisSchema', () => {
  it('refuse moins de 5 chiffres', () => {
    expect(codePostalFrancaisSchema.safeParse('1234').success).toBe(false);
  });

  it('refuse les lettres', () => {
    expect(codePostalFrancaisSchema.safeParse('1234A').success).toBe(false);
  });

  it('accepte un code postal français standard', () => {
    expect(codePostalFrancaisSchema.safeParse('75001').success).toBe(true);
  });
});

describe('dateNaissanceSchema (15 ans minimum, RGPD §5G)', () => {
  function isoDeIlYa(annees: number): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - annees);
    return d.toISOString().slice(0, 10);
  }

  it('refuse une personne de 14 ans', () => {
    const r = dateNaissanceSchema.safeParse(isoDeIlYa(14));
    expect(r.success).toBe(false);
  });

  it('accepte une personne de 15 ans', () => {
    // Hier : décale d'un jour pour éviter de tomber sur exactement aujourd'hui.
    const d = new Date();
    d.setFullYear(d.getFullYear() - 15);
    d.setDate(d.getDate() - 1);
    const iso = d.toISOString().slice(0, 10);
    expect(dateNaissanceSchema.safeParse(iso).success).toBe(true);
  });

  it('accepte une personne de 40 ans', () => {
    const r = dateNaissanceSchema.safeParse(isoDeIlYa(40));
    expect(r.success).toBe(true);
  });

  it('refuse un format non ISO', () => {
    expect(dateNaissanceSchema.safeParse('15/05/1990').success).toBe(false);
  });
});

describe('inscriptionSchema', () => {
  const champsValides = {
    nom: 'Ball',
    prenom: 'Camille',
    pronom: 'iel',
    email: 'camille@exemple.fr',
    code_postal: '75011',
    date_naissance: '1990-05-15',
    mot_de_passe: 'MonMotDePasse1',
    cgu_acceptees: true,
    token_turnstile: 'mock-valid-token',
    telephone: '0612345678',
  } as const;

  it('accepte une inscription complète et conforme', () => {
    expect(inscriptionSchema.safeParse(champsValides).success).toBe(true);
  });

  it('refuse si CGU non acceptées', () => {
    const r = inscriptionSchema.safeParse({ ...champsValides, cgu_acceptees: false });
    expect(r.success).toBe(false);
  });

  it('refuse si pronom vide (signal politique, cf. spec §9)', () => {
    const r = inscriptionSchema.safeParse({ ...champsValides, pronom: '' });
    expect(r.success).toBe(false);
  });

  it('accepte téléphone optionnel absent', () => {
    const { telephone: _ignore, ...sansTelephone } = champsValides;
    expect(inscriptionSchema.safeParse(sansTelephone).success).toBe(true);
  });

  it('accepte téléphone format français', () => {
    expect(inscriptionSchema.safeParse({ ...champsValides, telephone: '0612345678' }).success).toBe(
      true,
    );
  });

  it('refuse téléphone format invalide', () => {
    expect(inscriptionSchema.safeParse({ ...champsValides, telephone: '123' }).success).toBe(false);
  });

  it('normalise email en minuscules', () => {
    const r = inscriptionSchema.parse({ ...champsValides, email: 'CAMILLE@EXEMPLE.FR' });
    expect(r.email).toBe('camille@exemple.fr');
  });
});

describe('connexionMdpSchema', () => {
  it('accepte un email + mot de passe + token', () => {
    expect(
      connexionMdpSchema.safeParse({
        email: 'a@b.fr',
        mot_de_passe: 'pas-vide',
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });

  it('refuse un token Turnstile vide', () => {
    expect(
      connexionMdpSchema.safeParse({
        email: 'a@b.fr',
        mot_de_passe: 'pas-vide',
        token_turnstile: '',
      }).success,
    ).toBe(false);
  });
});

describe('magicLinkSchema', () => {
  it('accepte email + token', () => {
    expect(
      magicLinkSchema.safeParse({
        email: 'a@b.fr',
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(true);
  });

  it('refuse email invalide', () => {
    expect(
      magicLinkSchema.safeParse({
        email: 'pas-un-email',
        token_turnstile: 'mock-valid-token',
      }).success,
    ).toBe(false);
  });
});
