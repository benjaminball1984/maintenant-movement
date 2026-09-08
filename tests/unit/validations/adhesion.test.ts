import {
  MONTANT_ADHESION_EUR_CENTIMES,
  MONTANT_ADHESION_T99CP_UNITES,
  adhererEurosSchema,
  adhererGratuitSchema,
  adhererSansCompteSchema,
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
  // C17 / doctrine §19 : la plateforme ne signe aucune transaction, donc le
  // tx_hash payé par la personne depuis son propre wallet est OBLIGATOIRE.
  it('refuse sans tx_hash (désormais obligatoire)', () => {
    expect(adhererT99CPSchema.safeParse({ token_turnstile: 'mock-valid-token' }).success).toBe(
      false,
    );
  });

  it('refuse un tx_hash vide', () => {
    expect(
      adhererT99CPSchema.safeParse({ tx_hash: '', token_turnstile: 'mock-valid-token' }).success,
    ).toBe(false);
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

describe('adhererSansCompteSchema (V2.6.141)', () => {
  const valide = {
    prenom: 'Camille',
    nom: 'Durand',
    email: 'Camille.Durand@Example.org',
    code_postal: '95100',
    telephone: '0612345678',
    date_naissance: '1984-03-12',
    accepte_newsletter: true,
    token_turnstile: 'mock-valid-token',
  };

  /** Date ISO d'un anniversaire tombant il y a `ans` années et `jours` jours. */
  function ilYaAns(ans: number, jours = 0): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - ans);
    d.setDate(d.getDate() - jours);
    return d.toISOString().slice(0, 10);
  }

  it('accepte une adhésion complète et normalise l’email en minuscules', () => {
    const resultat = adhererSansCompteSchema.safeParse(valide);
    expect(resultat.success).toBe(true);
    if (resultat.success) {
      expect(resultat.data.email).toBe('camille.durand@example.org');
    }
  });

  it('refuse un téléphone vide : il est obligatoire pour adhérer (08/09/2026)', () => {
    expect(adhererSansCompteSchema.safeParse({ ...valide, telephone: '' }).success).toBe(false);
  });

  it('refuse un code postal qui n’a pas 5 chiffres', () => {
    expect(adhererSansCompteSchema.safeParse({ ...valide, code_postal: '951' }).success).toBe(
      false,
    );
  });

  it('refuse un email mal formé', () => {
    expect(adhererSansCompteSchema.safeParse({ ...valide, email: 'camille' }).success).toBe(false);
  });

  it('refuse un prénom vide : l’identité est le minimum d’une adhésion', () => {
    expect(adhererSansCompteSchema.safeParse({ ...valide, prenom: '  ' }).success).toBe(false);
  });

  it('refuse l’absence de jeton anti-robot', () => {
    expect(adhererSansCompteSchema.safeParse({ ...valide, token_turnstile: '' }).success).toBe(
      false,
    );
  });

  // Le seuil est celui de l'inscription classique, au caractère près
  // (`creerDateNaissanceSchema` dans `lib/validations/auth.ts`) : la date
  // saisie est lue en UTC tandis que le seuil est calculé en heure locale,
  // si bien qu'un anniversaire tombant le jour même passe le lendemain en
  // France. Décalage d'un jour assumé, hérité et volontairement identique
  // partout : une seule règle d'âge, un seul comportement.
  it('accepte une personne de 15 ans et un jour', () => {
    expect(
      adhererSansCompteSchema.safeParse({ ...valide, date_naissance: ilYaAns(15, 1) }).success,
    ).toBe(true);
  });

  it('refuse une personne de moins de 15 ans (RGPD §5G)', () => {
    expect(
      adhererSansCompteSchema.safeParse({ ...valide, date_naissance: ilYaAns(14) }).success,
    ).toBe(false);
  });

  it('refuse une date de naissance absente', () => {
    const { date_naissance: _ignore, ...sansDate } = valide;
    expect(adhererSansCompteSchema.safeParse(sansDate).success).toBe(false);
  });

  it('refuse un mot de passe glissé dans la charge utile (schéma strict)', () => {
    expect(
      adhererSansCompteSchema.safeParse({ ...valide, mot_de_passe: 'Secret!2026' }).success,
    ).toBe(false);
  });
});
