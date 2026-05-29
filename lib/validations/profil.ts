import {
  MESSAGES_VALIDATION_PROFIL_DEFAUT,
  type MessagesValidationProfil,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Schémas de validation des actions de profil.
 *
 * Source de vérité côté UI (react-hook-form) ET côté Server Actions.
 * La BDD reste la dernière ligne de défense via CHECK constraints + RLS.
 */

// ============================================================
// Visibilité par champ (cf. 01_ARCHITECTURE.md §9 et 04_DESIGN-TOKENS.md §3)
// ============================================================

/** Quatre niveaux de visibilité, du plus ouvert au plus fermé. */
export const NIVEAUX_VISIBILITE = ['publique', 'membres', 'amies', 'privee'] as const;
export type NiveauVisibilite = (typeof NIVEAUX_VISIBILITE)[number];

/**
 * Champs du profil dont la visibilité est configurable.
 * Hors champs identifiants (email, nom légal) qui ne sont jamais publics
 * sans action explicite, et hors champs techniques.
 */
export const CHAMPS_VISIBILITE = [
  'nom',
  'prenom',
  'pronom',
  'code_postal',
  'telephone',
  'photo_url',
  'bio',
] as const;
export type ChampVisibilite = (typeof CHAMPS_VISIBILITE)[number];

export const niveauVisibiliteSchema = z.enum(NIVEAUX_VISIBILITE);

/**
 * Préférences de visibilité : un niveau par champ. Tous optionnels.
 * Stocké en jsonb dans `personne.preferences_visibilite`.
 *
 * Défaut applicatif quand le champ est absent : `membres` (visible aux
 * personnes connectées au site, pas en clair sur le web).
 */
export const preferencesVisibiliteSchema = z
  .object({
    nom: niveauVisibiliteSchema.optional(),
    prenom: niveauVisibiliteSchema.optional(),
    pronom: niveauVisibiliteSchema.optional(),
    code_postal: niveauVisibiliteSchema.optional(),
    telephone: niveauVisibiliteSchema.optional(),
    photo_url: niveauVisibiliteSchema.optional(),
    bio: niveauVisibiliteSchema.optional(),
  })
  .strict();

export type PreferencesVisibilite = z.infer<typeof preferencesVisibiliteSchema>;

// ============================================================
// Préférences de notifications (cf. 01_ARCHITECTURE.md §10)
// ============================================================

/**
 * Cinq canaux hiérarchisés (cf. spec §10). Les deux premiers (messagerie
 * interne, cloche) sont toujours actifs : on respecte l'attention sans
 * la couper. Les trois suivants sont opt-in/opt-out.
 *
 * V2.5.38 sous-chantier V2.5.30.a : ajoute 3 préférences par type de
 * notification réseau. Modes possibles :
 *  - `cloche` (défaut) : seulement la notification cloche in-app.
 *  - `mail_immediat` : cloche + email immédiat.
 *  - `digest_quotidien` : cloche + email digest une fois par jour.
 *  - `digest_hebdo` : cloche + email digest une fois par semaine.
 *  - `aucune` : ni cloche ni email (silence total).
 *
 * Les digests nécessitent un cron qui sera branché ultérieurement.
 * Pour cette V2.5.38, les modes valides sont posés mais seuls
 * `cloche` et `mail_immediat` et `aucune` sont effectivement traités
 * (les digests tombent en `cloche` en attendant le cron).
 */
export const modeNotifReseauSchema = z.enum([
  'cloche',
  'mail_immediat',
  'digest_quotidien',
  'digest_hebdo',
  'aucune',
]);

export type ModeNotifReseau = z.infer<typeof modeNotifReseauSchema>;

export const preferencesNotificationsSchema = z
  .object({
    push: z.boolean(),
    push_son: z.boolean(),
    push_vibration: z.boolean(),
    mardi_recap: z.boolean(),
    vendredi_newsletter: z.boolean(),
    /** V2.5.38 — préf pour les messages directs reçus sur le réseau.
     *  Pas de .default() Zod : ça rendrait le champ optionnel à l'input,
     *  ce qui casse l'inférence côté react-hook-form. Le fallback se
     *  fait dans la lecture côté page (`PREFERENCES_NOTIFICATIONS_DEFAUT`). */
    reseau_message_recu: modeNotifReseauSchema,
    /** V2.5.38 — préf pour les commentaires sur les publications de la personne. */
    reseau_post_commente: modeNotifReseauSchema,
    /** V2.5.38 — préf pour les soutiens (cœurs) sur les publications. */
    reseau_post_soutenu: modeNotifReseauSchema,
  })
  .strict();

export type PreferencesNotifications = z.infer<typeof preferencesNotificationsSchema>;

export const PREFERENCES_NOTIFICATIONS_DEFAUT: PreferencesNotifications = {
  push: false,
  push_son: false,
  push_vibration: false,
  mardi_recap: true,
  vendredi_newsletter: true,
  reseau_message_recu: 'cloche',
  reseau_post_commente: 'cloche',
  reseau_post_soutenu: 'cloche',
};

// ============================================================
// Mise à jour des informations de profil
// ============================================================

export function creerMettreAJourProfilSchema(
  messages: MessagesValidationProfil = MESSAGES_VALIDATION_PROFIL_DEFAUT,
) {
  return z
    .object({
      nom: z.string().trim().min(1, messages.nomRequis).max(100),
      prenom: z.string().trim().min(1, messages.prenomRequis).max(100),
      pronom: z.string().trim().min(1, messages.pronomRequis).max(50),
      code_postal: z
        .string()
        .trim()
        .regex(/^\d{5}$/, messages.codePostalFormat),
      telephone: z
        .string()
        .trim()
        .regex(/^(\+33|0)[1-9](\d{2}){4}$/, messages.telephoneFormat)
        .optional()
        .or(z.literal('')),
      photo_url: z.string().url(messages.photoUrlFormat).optional().or(z.literal('')),
      cover_url: z.string().url(messages.photoUrlFormat).optional().or(z.literal('')),
      bio: z.string().max(500, messages.bioLongueur).optional().or(z.literal('')),
      mode_theme: z.enum(['auto', 'light', 'dark']),
    })
    .strict();
}
export const mettreAJourProfilSchema = creerMettreAJourProfilSchema();

export type DonneesMiseAJourProfil = z.infer<typeof mettreAJourProfilSchema>;

// ============================================================
// Demande de suppression de compte (RGPD §5A)
// ============================================================

/**
 * Demande de suppression : la personne doit retaper son email pour
 * confirmer (anti-action accidentelle). Match l'email en BDD côté
 * Server Action.
 */
export function creerDemanderSuppressionSchema(
  messages: MessagesValidationProfil = MESSAGES_VALIDATION_PROFIL_DEFAUT,
) {
  return z
    .object({
      confirmation_email: z.string().trim().toLowerCase().email(messages.emailFormat),
    })
    .strict();
}
export const demanderSuppressionSchema = creerDemanderSuppressionSchema();

export type DonneesDemanderSuppression = z.infer<typeof demanderSuppressionSchema>;

// ============================================================
// 2FA TOTP (RGPD §5F)
// ============================================================

export function creerVerifierTotpSchema(
  messages: MessagesValidationProfil = MESSAGES_VALIDATION_PROFIL_DEFAUT,
) {
  return z
    .object({
      factor_id: z.string().min(1),
      code: z
        .string()
        .trim()
        .regex(/^\d{6}$/, messages.totpFormat),
    })
    .strict();
}
export const verifierTotpSchema = creerVerifierTotpSchema();

export type DonneesVerifierTotp = z.infer<typeof verifierTotpSchema>;

// ============================================================
// Réglage de recontact par pétition signée (RGPD : consentement
// granulaire, modifiable a posteriori depuis /profil/contributions)
// ============================================================

/**
 * Réglage du consentement « la créatrice peut me recontacter » pour UNE
 * signature donnée. Ce consentement est par pétition (il ne remonte jamais
 * au profil) : une personne peut l'autoriser pour une pétition et pas une
 * autre. Cf. `signature_petition.accepte_contact_createurice`.
 */
export function creerDefinirRecontactSignatureSchema(
  messages: MessagesValidationProfil = MESSAGES_VALIDATION_PROFIL_DEFAUT,
) {
  return z
    .object({
      signature_id: z.string().uuid(messages.signatureUuid),
      autorise: z.boolean(),
    })
    .strict();
}
export const definirRecontactSignatureSchema = creerDefinirRecontactSignatureSchema();

export type DonneesDefinirRecontactSignature = z.infer<typeof definirRecontactSignatureSchema>;
