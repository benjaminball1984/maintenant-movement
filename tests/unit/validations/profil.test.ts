import {
  CHAMPS_VISIBILITE,
  NIVEAUX_VISIBILITE,
  PREFERENCES_NOTIFICATIONS_DEFAUT,
  demanderSuppressionSchema,
  mettreAJourProfilSchema,
  preferencesNotificationsSchema,
  preferencesVisibiliteSchema,
  verifierTotpSchema,
} from '@/lib/validations/profil';
import { describe, expect, it } from 'vitest';

/**
 * Tests des schémas Zod du profil.
 *
 * Garantissent que les Server Actions et les formulaires applicatifs
 * partagent une définition unique des règles métier, et que les
 * défauts (notifications opt-in/opt-out) restent corrects.
 */

describe('preferencesVisibiliteSchema', () => {
  it('accepte un objet vide (tout en défaut applicatif `membres`)', () => {
    expect(preferencesVisibiliteSchema.safeParse({}).success).toBe(true);
  });

  it('accepte les 4 niveaux valides', () => {
    for (const niveau of NIVEAUX_VISIBILITE) {
      expect(preferencesVisibiliteSchema.safeParse({ nom: niveau }).success).toBe(true);
    }
  });

  it('refuse un niveau inconnu', () => {
    expect(preferencesVisibiliteSchema.safeParse({ nom: 'banane' }).success).toBe(false);
  });

  it('refuse une clé non listée (strict)', () => {
    expect(preferencesVisibiliteSchema.safeParse({ champ_inexistant: 'publique' }).success).toBe(
      false,
    );
  });

  it('couvre tous les champs de profil censés être visibilités', () => {
    expect(CHAMPS_VISIBILITE.length).toBe(7);
  });
});

describe('preferencesNotificationsSchema', () => {
  it('accepte les 5 préférences booléennes', () => {
    expect(preferencesNotificationsSchema.safeParse(PREFERENCES_NOTIFICATIONS_DEFAUT).success).toBe(
      true,
    );
  });

  it('refuse une préférence absente', () => {
    const { push: _ignore, ...partiel } = PREFERENCES_NOTIFICATIONS_DEFAUT;
    expect(preferencesNotificationsSchema.safeParse(partiel).success).toBe(false);
  });

  it('défaut : mails opt-out activés, push opt-in désactivé', () => {
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.mardi_recap).toBe(true);
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.vendredi_newsletter).toBe(true);
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.push).toBe(false);
  });
});

describe('mettreAJourProfilSchema', () => {
  const valide = {
    nom: 'Ball',
    prenom: 'Camille',
    pronom: 'iel',
    code_postal: '75011',
    telephone: '',
    photo_url: '',
    bio: '',
    mode_theme: 'auto' as const,
  };

  it('accepte un payload minimal complet', () => {
    expect(mettreAJourProfilSchema.safeParse(valide).success).toBe(true);
  });

  it('accepte une URL de photo valide', () => {
    expect(
      mettreAJourProfilSchema.safeParse({
        ...valide,
        photo_url: 'https://exemple.fr/photo.jpg',
      }).success,
    ).toBe(true);
  });

  it('refuse une URL de photo invalide', () => {
    expect(mettreAJourProfilSchema.safeParse({ ...valide, photo_url: 'pas-une-url' }).success).toBe(
      false,
    );
  });

  it('refuse une bio de plus de 500 caractères', () => {
    const longueBio = 'a'.repeat(501);
    expect(mettreAJourProfilSchema.safeParse({ ...valide, bio: longueBio }).success).toBe(false);
  });

  it('refuse un mode_theme inconnu', () => {
    expect(mettreAJourProfilSchema.safeParse({ ...valide, mode_theme: 'banana' }).success).toBe(
      false,
    );
  });
});

describe('demanderSuppressionSchema', () => {
  it('accepte un email valide', () => {
    expect(
      demanderSuppressionSchema.safeParse({ confirmation_email: 'camille@exemple.fr' }).success,
    ).toBe(true);
  });

  it('refuse un email invalide', () => {
    expect(
      demanderSuppressionSchema.safeParse({ confirmation_email: 'pas-un-email' }).success,
    ).toBe(false);
  });

  it('normalise en minuscules', () => {
    const r = demanderSuppressionSchema.parse({
      confirmation_email: 'CAMILLE@EXEMPLE.FR',
    });
    expect(r.confirmation_email).toBe('camille@exemple.fr');
  });
});

describe('verifierTotpSchema', () => {
  it('accepte un code à 6 chiffres', () => {
    expect(verifierTotpSchema.safeParse({ factor_id: 'abc', code: '123456' }).success).toBe(true);
  });

  it('refuse un code à 5 chiffres', () => {
    expect(verifierTotpSchema.safeParse({ factor_id: 'abc', code: '12345' }).success).toBe(false);
  });

  it('refuse un code avec lettres', () => {
    expect(verifierTotpSchema.safeParse({ factor_id: 'abc', code: '12345a' }).success).toBe(false);
  });

  it('refuse un factor_id vide', () => {
    expect(verifierTotpSchema.safeParse({ factor_id: '', code: '123456' }).success).toBe(false);
  });
});
