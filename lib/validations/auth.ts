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
 */

// ============================================================
// Helpers communs
// ============================================================

/** Code postal français : 5 chiffres exactement. */
export const codePostalFrancaisSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, 'Le code postal doit comporter 5 chiffres.');

/**
 * Mot de passe : 12 caractères minimum, au moins 1 minuscule, 1 majuscule,
 * 1 chiffre. Pas d'exigence de caractère spécial (recommandation ANSSI :
 * longueur plutôt que complexité forcée).
 */
export const motDePasseSchema = z
  .string()
  .min(12, 'Le mot de passe doit comporter au moins 12 caractères.')
  .refine((v) => /[a-z]/.test(v), 'Le mot de passe doit contenir une minuscule.')
  .refine((v) => /[A-Z]/.test(v), 'Le mot de passe doit contenir une majuscule.')
  .refine((v) => /[0-9]/.test(v), 'Le mot de passe doit contenir un chiffre.');

/**
 * Date de naissance : 15 ans révolus minimum (RGPD §5G).
 * Accepte une chaîne ISO 8601 (`YYYY-MM-DD`) telle qu'envoyée par un
 * input type="date" HTML.
 */
export const dateNaissanceSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide.')
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
  }, 'Tu dois avoir 15 ans révolus pour créer un compte.');

/** Token Turnstile : chaîne non vide. La vérification réelle se fait côté serveur. */
export const tokenTurnstileSchema = z.string().min(1, 'Vérification anti-bot requise.');

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
export const inscriptionSchema = z
  .object({
    nom: z.string().trim().min(1, 'Le nom est requis.').max(100),
    prenom: z.string().trim().min(1, 'Le prénom est requis.').max(100),
    pronom: z.string().trim().min(1, 'Le pronom est requis (signal politique).').max(50),
    email: z.string().trim().toLowerCase().email("Le format de l'email semble incorrect."),
    code_postal: codePostalFrancaisSchema,
    telephone: z
      .string()
      .trim()
      .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Format de téléphone français invalide.')
      .optional()
      .or(z.literal('')),
    date_naissance: dateNaissanceSchema,
    mot_de_passe: motDePasseSchema,
    cgu_acceptees: z
      .boolean()
      .refine(
        (v) => v === true,
        "Tu dois accepter la politique de confidentialité pour t'inscrire.",
      ),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesInscription = z.infer<typeof inscriptionSchema>;

// ============================================================
// Connexion email + mot de passe
// ============================================================

export const connexionMdpSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Le format de l'email semble incorrect."),
    mot_de_passe: z.string().min(1, 'Le mot de passe est requis.'),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesConnexionMdp = z.infer<typeof connexionMdpSchema>;

// ============================================================
// Magic link
// ============================================================

export const magicLinkSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Le format de l'email semble incorrect."),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesMagicLink = z.infer<typeof magicLinkSchema>;

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
