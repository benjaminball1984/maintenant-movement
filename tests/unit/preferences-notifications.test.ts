import {
  PREFERENCES_NOTIFICATIONS_DEFAUT,
  modeNotifReseauSchema,
  preferencesNotificationsSchema,
} from '@/lib/validations/profil';
import { describe, expect, it } from 'vitest';

/**
 * Tests des invariants des préférences de notifications (V2.5.42).
 *
 * Le DEFAUT est consommé partout où une pref n'est pas posée : nouvel
 * inscription, vieille pref sans les nouveaux champs (fallback merge),
 * lecture qui échoue (helper `lirePrefNotifReseau`). Si on change ces
 * valeurs par inadvertance, ça impacte tout le routage cloche/email.
 *
 * On verrouille donc :
 *  - L'ensemble des modes notif réseau (5 valeurs exactes).
 *  - Le défaut des 3 prefs réseau (`cloche` = pas de mail = comportement
 *    le plus prudent).
 *  - Le défaut des canaux historiques (push off, mardi/vendredi on).
 *  - Le schema accepte un objet conforme et refuse un mode hors enum.
 */

describe('modeNotifReseauSchema', () => {
  it('accepte les 5 modes valides', () => {
    for (const m of ['cloche', 'mail_immediat', 'digest_quotidien', 'digest_hebdo', 'aucune']) {
      expect(modeNotifReseauSchema.safeParse(m).success).toBe(true);
    }
  });

  it('refuse une chaîne hors enum', () => {
    expect(modeNotifReseauSchema.safeParse('mail').success).toBe(false);
    expect(modeNotifReseauSchema.safeParse('CLOCHE').success).toBe(false);
    expect(modeNotifReseauSchema.safeParse('').success).toBe(false);
  });

  it('refuse les valeurs non-string', () => {
    expect(modeNotifReseauSchema.safeParse(null).success).toBe(false);
    expect(modeNotifReseauSchema.safeParse(0).success).toBe(false);
    expect(modeNotifReseauSchema.safeParse(true).success).toBe(false);
  });
});

describe('PREFERENCES_NOTIFICATIONS_DEFAUT', () => {
  it('canaux historiques inchangés (push off, mardi/vendredi on)', () => {
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.push).toBe(false);
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.push_son).toBe(false);
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.push_vibration).toBe(false);
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.mardi_recap).toBe(true);
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.vendredi_newsletter).toBe(true);
  });

  it('les 3 prefs réseau sont à "cloche" (comportement le plus prudent : pas d\'email)', () => {
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.reseau_message_recu).toBe('cloche');
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.reseau_post_commente).toBe('cloche');
    expect(PREFERENCES_NOTIFICATIONS_DEFAUT.reseau_post_soutenu).toBe('cloche');
  });

  it('le DEFAUT entier passe la validation Zod', () => {
    expect(preferencesNotificationsSchema.safeParse(PREFERENCES_NOTIFICATIONS_DEFAUT).success).toBe(
      true,
    );
  });
});

describe('preferencesNotificationsSchema — strict', () => {
  it('refuse une clé inconnue (.strict)', () => {
    const r = preferencesNotificationsSchema.safeParse({
      ...PREFERENCES_NOTIFICATIONS_DEFAUT,
      cle_inventee: 'valeur',
    });
    expect(r.success).toBe(false);
  });

  it('refuse un mode réseau hors enum', () => {
    const r = preferencesNotificationsSchema.safeParse({
      ...PREFERENCES_NOTIFICATIONS_DEFAUT,
      reseau_message_recu: 'mail',
    });
    expect(r.success).toBe(false);
  });

  it("refuse l'absence d'un champ obligatoire", () => {
    const { reseau_message_recu: _ignore, ...incomplete } = PREFERENCES_NOTIFICATIONS_DEFAUT;
    const r = preferencesNotificationsSchema.safeParse(incomplete);
    expect(r.success).toBe(false);
  });
});
