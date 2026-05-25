import { z } from 'zod';
import { codePostalFrancaisSchema, tokenTurnstileSchema } from './auth';

/**
 * Schéma de signature d'une pétition (modale page d'accueil + page pétition).
 *
 * Cf. `01_ARCHITECTURE.md §3` (« Parcours pétition - modale ») :
 *   Nom, prénom, code postal, email, téléphone optionnel.
 *   Cases : newsletter + autorisation de contact par la personne créatrice.
 *
 * Signature **anonyme** (non connectée) autorisée : la modale ne requiert
 * pas d'authentification. Tag de la signature avec l'ID de la pétition
 * et l'origine pour la newsletter (taggage à 3 axes, cf. spec §10).
 */
export const signerPetitionSchema = z
  .object({
    petition_id: z.string().uuid('Identifiant de pétition invalide.'),
    nom: z.string().trim().min(1, 'Le nom est requis.').max(100),
    prenom: z.string().trim().min(1, 'Le prénom est requis.').max(100),
    email: z.string().trim().toLowerCase().email("Le format de l'email semble incorrect."),
    code_postal: codePostalFrancaisSchema,
    telephone: z
      .string()
      .trim()
      .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Format de téléphone français invalide.')
      .optional()
      .or(z.literal('')),
    accepte_newsletter: z.boolean(),
    accepte_contact_createurice: z.boolean(),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesSignerPetition = z.infer<typeof signerPetitionSchema>;

// ============================================================
// Création de pétition (auth requise + modération a priori)
// ============================================================

/**
 * Champs collectés à la création d'une pétition (cf. spec §5A) :
 *   titre, image (URL), texte, destinataire, objectif chiffré.
 *
 * Le slug est dérivé du titre côté serveur (Server Action). La
 * créatrice est la personne authentifiée (`auth.uid()`). Le statut
 * initial est forcé à `en_moderation`.
 *
 * Limites :
 *   - titre 5-200 chars (court mais explicite)
 *   - texte 100-5000 chars (argumentaire substantiel)
 *   - destinataire 5-200 chars (institution, élu·e, entreprise...)
 *   - objectif 100 à 1 000 000 signataires (pas de pétition d'1 signature ou trop pharaonique)
 */
/**
 * Champs de contenu communs à la création et à l'édition d'une pétition.
 * Extraits ici pour rester DRY : un seul endroit définit les règles de
 * titre / texte / destinataire / image / objectif.
 */
const champsContenuPetition = {
  titre: z
    .string()
    .trim()
    .min(5, 'Le titre doit comporter au moins 5 caractères.')
    .max(200, 'Le titre doit faire 200 caractères maximum.'),
  texte: z
    .string()
    .trim()
    .min(100, 'Le texte doit comporter au moins 100 caractères (argumenter clairement).')
    .max(5000, 'Le texte doit faire 5000 caractères maximum.'),
  destinataire: z
    .string()
    .trim()
    .min(5, 'Le destinataire est requis (institution, élu·e, entreprise...).')
    .max(200, 'Le destinataire doit faire 200 caractères maximum.'),
  image_url: z.string().url("URL d'image invalide.").optional().or(z.literal('')),
  objectif: z
    .number()
    .int('L’objectif doit être un nombre entier.')
    .min(100, 'L’objectif minimum est 100 signataires.')
    .max(1_000_000, 'L’objectif maximum est 1 000 000 signataires.'),
} as const;

export const creerPetitionSchema = z
  .object({
    ...champsContenuPetition,
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesCreerPetition = z.infer<typeof creerPetitionSchema>;

// ============================================================
// Édition d'une pétition par l'équipe (admin / modération)
// ============================================================

/**
 * Date optionnelle au format `AAAA-MM-JJ` (input HTML `type="date"`), ou
 * chaîne vide pour « pas de date ». La Server Action convertit la chaîne
 * vide en `null` avant l'écriture en base.
 */
const dateOptionnelleSchema = z
  .string()
  .date('Date invalide (format attendu : AAAA-MM-JJ).')
  .or(z.literal(''))
  .optional();

/**
 * Édition complète d'une pétition par l'équipe : tout le contenu, plus les
 * deux dates métier (lancement et échéance, cf. migration 035).
 *
 * Pas de Turnstile ici : l'action est réservée aux personnes déjà
 * authentifiées ET porteuses d'un droit admin/modération (vérifié côté
 * Server Action + RLS). La cohérence des dates (échéance >= lancement)
 * reflète la contrainte SQL `petition_dates_coherentes`, pour offrir un
 * message clair avant même de toucher la base.
 */
export const editerPetitionSchema = z
  .object({
    petition_id: z.string().uuid(),
    ...champsContenuPetition,
    date_lancement: dateOptionnelleSchema,
    date_echeance: dateOptionnelleSchema,
  })
  .strict()
  .refine(
    (data) =>
      !data.date_lancement || !data.date_echeance || data.date_echeance >= data.date_lancement,
    {
      message: "L'échéance ne peut pas précéder la date de lancement.",
      path: ['date_echeance'],
    },
  );

export type DonneesEditerPetition = z.infer<typeof editerPetitionSchema>;

// ============================================================
// Modération a priori
// ============================================================

/**
 * Action de modération sur une pétition `en_moderation`.
 *
 * Si `decision = 'rejetee'`, `raison_rejet` est requise (transparence
 * envers la créatrice). Sinon, raison_rejet est ignorée.
 */
export const modererPetitionSchema = z
  .object({
    petition_id: z.string().uuid(),
    decision: z.enum(['publiee', 'rejetee']),
    raison_rejet: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.decision !== 'rejetee' ||
      (data.raison_rejet !== undefined && data.raison_rejet.length >= 10),
    {
      message:
        'Une raison de rejet d’au moins 10 caractères est requise pour rejeter une pétition.',
      path: ['raison_rejet'],
    },
  );

export type DonneesModererPetition = z.infer<typeof modererPetitionSchema>;

// ============================================================
// Helper : génère un slug URL-safe depuis un titre.
//
// Pose le slug initial. La Server Action vérifiera l'unicité et
// suffixera avec un compteur (`-2`, `-3`...) si collision.
// ============================================================

/**
 * Plage Unicode des diacritiques combinants (U+0300 à U+036F).
 * Écrite via `String.fromCodePoint` puis recombinée en regex pour
 * éviter d'écrire des combining marks bruts dans la source (Biome
 * `noMisleadingCharacterClass` les refuse) tout en restant lisible.
 */
const REGEX_DIACRITIQUES = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  'g',
);

export function slugifierTitre(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
