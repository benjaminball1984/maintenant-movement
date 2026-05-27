import {
  MESSAGES_VALIDATION_AUTH_DEFAUT,
  type MessagesValidationAuth,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Schémas de validation des formulaires d'authentification.
 *
 * Source de vérité côté frontend (react-hook-form) ET côté backend
 * (Server Actions). Les contraintes BDD (CHECK age >= 15, etc.) restent
 * la dernière ligne de défense ; ces schémas servent surtout l'UX
 * (retour immédiat sans aller-retour serveur).
 *
 * Messages d'erreur en français, orientés solution (cf. 03_VOCABULAIRE.md §9).
 *
 * V2.4.139 : factories `creerXxxSchema(messages?)` ajoutees pour permettre
 * la surcharge admin via CMS. Les exports historiques (sans `creer`) restent
 * disponibles et utilisent les defauts.
 */

// ============================================================
// Helpers communs
// ============================================================

/** Code postal français : 5 chiffres exactement. */
export function creerCodePostalFrancaisSchema(messages: MessagesValidationAuth) {
  return z
    .string()
    .trim()
    .regex(/^\d{5}$/, messages.codePostalFormat);
}
export const codePostalFrancaisSchema = creerCodePostalFrancaisSchema(
  MESSAGES_VALIDATION_AUTH_DEFAUT,
);

/**
 * Mot de passe : 12 caractères minimum, au moins 1 minuscule, 1 majuscule,
 * 1 chiffre. Pas d'exigence de caractère spécial (recommandation ANSSI :
 * longueur plutôt que complexité forcée).
 */
export function creerMotDePasseSchema(messages: MessagesValidationAuth) {
  return z
    .string()
    .min(12, messages.motDePasseLongueur)
    .refine((v) => /[a-z]/.test(v), messages.motDePasseMinuscule)
    .refine((v) => /[A-Z]/.test(v), messages.motDePasseMajuscule)
    .refine((v) => /[0-9]/.test(v), messages.motDePasseChiffre);
}
export const motDePasseSchema = creerMotDePasseSchema(MESSAGES_VALIDATION_AUTH_DEFAUT);

/**
 * Date de naissance : 15 ans révolus minimum (RGPD §5G).
 * Accepte une chaîne ISO 8601 (`YYYY-MM-DD`) telle qu'envoyée par un
 * input type="date" HTML.
 */
export function creerDateNaissanceSchema(messages: MessagesValidationAuth) {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, messages.dateFormat)
    .refine((iso) => {
      const naissance = new Date(iso);
      if (Number.isNaN(naissance.getTime())) {
        return false;
      }
      const aujourdHui = new Date();
      const ageMin = new Date(
        aujourdHui.getFullYear() - 15,
        aujourdHui.getMonth(),
        aujourdHui.getDate(),
      );
      return naissance <= ageMin;
    }, messages.ageMin);
}
export const dateNaissanceSchema = creerDateNaissanceSchema(MESSAGES_VALIDATION_AUTH_DEFAUT);

/** Token Turnstile : chaîne non vide. La vérification réelle se fait côté serveur. */
export function creerTokenTurnstileSchema(messages: MessagesValidationAuth) {
  return z.string().min(1, messages.turnstileRequis);
}
export const tokenTurnstileSchema = creerTokenTurnstileSchema(MESSAGES_VALIDATION_AUTH_DEFAUT);

// ============================================================
// Inscription
// ============================================================

/**
 * Champs collectés à l'inscription (cf. 01_ARCHITECTURE.md §9 et §15) :
 * Nom + Prénom + Pronom + Email + Code postal + Téléphone (optionnel)
 * + Date de naissance (15 ans min) + Mot de passe + CGU.
 *
 * Le pronom est obligatoire (signal politique, cf. spec §9).
 */
export function creerInscriptionSchema(
  messages: MessagesValidationAuth = MESSAGES_VALIDATION_AUTH_DEFAUT,
) {
  return z
    .object({
      nom: z.string().trim().min(1, messages.nomRequis).max(100),
      prenom: z.string().trim().min(1, messages.prenomRequis).max(100),
      pronom: z.string().trim().min(1, messages.pronomRequis).max(50),
      email: z.string().trim().toLowerCase().email(messages.emailFormat),
      code_postal: creerCodePostalFrancaisSchema(messages),
      telephone: z
        .string()
        .trim()
        .regex(/^(\+33|0)[1-9](\d{2}){4}$/, messages.telephoneFormat)
        .optional()
        .or(z.literal('')),
      date_naissance: creerDateNaissanceSchema(messages),
      mot_de_passe: creerMotDePasseSchema(messages),
      cgu_acceptees: z.boolean().refine((v) => v === true, messages.cguAcceptees),
      token_turnstile: creerTokenTurnstileSchema(messages),
    })
    .strict();
}
export const inscriptionSchema = creerInscriptionSchema();

export type DonneesInscription = z.infer<typeof inscriptionSchema>;

// ============================================================
// Connexion email + mot de passe
// ============================================================

export function creerConnexionMdpSchema(
  messages: MessagesValidationAuth = MESSAGES_VALIDATION_AUTH_DEFAUT,
) {
  return z
    .object({
      email: z.string().trim().toLowerCase().email(messages.emailFormat),
      mot_de_passe: z.string().min(1, messages.motDePasseRequis),
      token_turnstile: creerTokenTurnstileSchema(messages),
    })
    .strict();
}
export const connexionMdpSchema = creerConnexionMdpSchema();

export type DonneesConnexionMdp = z.infer<typeof connexionMdpSchema>;

// ============================================================
// Magic link
// ============================================================

export function creerMagicLinkSchema(
  messages: MessagesValidationAuth = MESSAGES_VALIDATION_AUTH_DEFAUT,
) {
  return z
    .object({
      email: z.string().trim().toLowerCase().email(messages.emailFormat),
      token_turnstile: creerTokenTurnstileSchema(messages),
    })
    .strict();
}
export const magicLinkSchema = creerMagicLinkSchema();

export type DonneesMagicLink = z.infer<typeof magicLinkSchema>;

// ============================================================
// Reset du mot de passe (demande + nouveau mot de passe)
// ============================================================

/**
 * Demande de reinitialisation : email + Turnstile, identique au magic link.
 * Le clic sur le lien recu par mail amene sur la page de nouveau mot de
 * passe avec une session temporaire (cf. /reinitialiser-mot-de-passe).
 */
export function creerDemandeResetSchema(
  messages: MessagesValidationAuth = MESSAGES_VALIDATION_AUTH_DEFAUT,
) {
  return z
    .object({
      email: z.string().trim().toLowerCase().email(messages.emailFormat),
      token_turnstile: creerTokenTurnstileSchema(messages),
    })
    .strict();
}
export const demandeResetSchema = creerDemandeResetSchema();

export type DonneesDemandeReset = z.infer<typeof demandeResetSchema>;

/**
 * Definition du nouveau mot de passe : meme regle que l'inscription.
 * Pas de Turnstile : on est deja authentifie par la session temporaire
 * issue du clic sur le lien email.
 */
export function creerNouveauMotDePasseSchema(
  messages: MessagesValidationAuth = MESSAGES_VALIDATION_AUTH_DEFAUT,
) {
  return z
    .object({
      mot_de_passe: creerMotDePasseSchema(messages),
    })
    .strict();
}
export const nouveauMotDePasseSchema = creerNouveauMotDePasseSchema();

export type DonneesNouveauMotDePasse = z.infer<typeof nouveauMotDePasseSchema>;

// ============================================================
// Providers OAuth (cf. 01_ARCHITECTURE.md §9 « 4 portes »)
// ============================================================

/** OAuth GAFAM : supporté nativement par Supabase Auth. */
export const PROVIDERS_GAFAM = ['google', 'apple', 'azure'] as const;
export type ProviderGafam = (typeof PROVIDERS_GAFAM)[number];

/**
 * OAuth éthique : posé en UI mais branchement nécessite un setup custom
 * (Keycloak intermédiaire ou OIDC custom). Voir MANIFEST chantier 1.2.
 */
export const PROVIDERS_ETHIQUES = ['mastodon', 'framasoft', 'solid'] as const;
export type ProviderEthique = (typeof PROVIDERS_ETHIQUES)[number];

export type ProviderOAuth = ProviderGafam | ProviderEthique;

/** Libellés affichés en UI. Stockés ici pour cohérence. */
export const LIBELLES_PROVIDERS: Record<ProviderOAuth, string> = {
  google: 'Google',
  apple: 'Apple',
  azure: 'Microsoft',
  mastodon: 'Mastodon',
  framasoft: 'Framasoft',
  solid: 'Solid',
};
