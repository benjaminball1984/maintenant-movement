import { z } from 'zod';
import { codePostalFrancaisSchema, tokenTurnstileSchema } from './auth';

/**
 * Validations Zod du sous-espace Cagnottes (chantier 3.3).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §5D` :
 *   3 sous-types (ouverte | lutte | cotisation), Stripe Checkout + Stripe
 *   Connect KYC pour les euros, T99CP via wallet, frais 5%€/0%T99CP.
 */

// ============================================================
// Création d'une cagnotte (auth requise)
// ============================================================

/**
 * Note : les `cotisations` (sécurité sociale du logement / mobilités /
 * alimentation, RBU) ne peuvent être créées que par un·e admin national.
 * La RLS l'enforce déjà ; le schéma ne distingue pas, la Server Action
 * filtre côté serveur si besoin.
 */
export const creerCagnotteSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(5, 'Le titre doit comporter au moins 5 caractères.')
      .max(200, 'Le titre doit faire 200 caractères maximum.'),
    texte: z
      .string()
      .trim()
      .min(100, 'Le texte doit comporter au moins 100 caractères.')
      .max(5000, 'Le texte doit faire 5000 caractères maximum.'),
    type: z.enum(['ouverte', 'lutte', 'cotisation']),
    image_url: z.string().url("URL d'image invalide.").optional().or(z.literal('')),
    /**
     * Objectif en euros (entier, 0 à 1 000 000). 0 = pas d'objectif chiffré.
     */
    objectif_euros: z
      .number()
      .int('L’objectif doit être un nombre entier (en euros).')
      .min(0, 'L’objectif ne peut pas être négatif.')
      .max(1_000_000, 'L’objectif maximum est 1 000 000 €.'),
    /**
     * Adresse wallet T99CP (optionnelle). Si vide, don T99CP désactivé.
     * Format : adresse Ethereum 0x... (40 hex). Validation côté chaîne
     * faite par MockT99CPService / PolygonT99CPService.
     */
    wallet_t99cp: z
      .string()
      .trim()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse wallet invalide (format 0x + 40 hex attendus).')
      .optional()
      .or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesCreerCagnotte = z.infer<typeof creerCagnotteSchema>;

// ============================================================
// Don à une cagnotte
// ============================================================

/**
 * Don en euros. La donatrice peut être anonyme ou connectée.
 *
 * `montant_centimes` est le **montant total débité** ; les frais (5 %) sont
 * déduits par la Server Action avant insertion (cf. `calculerFraisEuros`).
 */
export const faireDonEurosSchema = z
  .object({
    cagnotte_id: z.string().uuid('Identifiant de cagnotte invalide.'),
    montant_centimes: z
      .number()
      .int('Le montant doit être un nombre entier de centimes.')
      .min(100, 'Le don minimum est 1 € (100 centimes).')
      .max(1_000_000_00, 'Le don maximum est 1 000 000 € en une transaction.'),
    prenom: z.string().trim().max(100).optional().or(z.literal('')),
    nom: z.string().trim().max(100).optional().or(z.literal('')),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Le format de l'email semble incorrect.")
      .optional()
      .or(z.literal('')),
    code_postal: codePostalFrancaisSchema.optional().or(z.literal('')),
    accepte_newsletter: z.boolean(),
    accepte_contact_createurice: z.boolean(),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesFaireDonEuros = z.infer<typeof faireDonEurosSchema>;

/**
 * Don en T99CP. Frais 0. Le tx_hash est fourni par le front (après
 * signature de la transaction wallet) ou simulé en mode mock.
 */
export const faireDonT99CPSchema = z
  .object({
    cagnotte_id: z.string().uuid(),
    /**
     * Montant en plus petite unité T99CP (équivalent wei). Sérialisé en
     * string parce que JavaScript Number ne représente pas fidèlement
     * un bigint > 2^53.
     */
    montant_unites: z
      .string()
      .regex(/^\d+$/, 'Montant T99CP invalide.')
      .refine((v) => BigInt(v) > 0n, 'Le montant doit être strictement positif.')
      .refine((v) => BigInt(v) <= 10n ** 27n, 'Montant T99CP déraisonnable.'),
    tx_hash: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, 'tx_hash invalide (format 0x + 64 hex attendus).'),
    prenom: z.string().trim().max(100).optional().or(z.literal('')),
    nom: z.string().trim().max(100).optional().or(z.literal('')),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Le format de l'email semble incorrect.")
      .optional()
      .or(z.literal('')),
    code_postal: codePostalFrancaisSchema.optional().or(z.literal('')),
    accepte_newsletter: z.boolean(),
    accepte_contact_createurice: z.boolean(),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesFaireDonT99CP = z.infer<typeof faireDonT99CPSchema>;

// ============================================================
// Modération a posteriori : suspendre / rétablir / clôturer
// ============================================================

export const suspendreCagnotteSchema = z
  .object({
    cagnotte_id: z.string().uuid(),
    raison_suspension: z
      .string()
      .trim()
      .min(10, 'La raison de suspension doit faire au moins 10 caractères.')
      .max(500),
  })
  .strict();

export type DonneesSuspendreCagnotte = z.infer<typeof suspendreCagnotteSchema>;

export const retablirCagnotteSchema = z
  .object({
    cagnotte_id: z.string().uuid(),
  })
  .strict();

export type DonneesRetablirCagnotte = z.infer<typeof retablirCagnotteSchema>;

export const cloturerCagnotteSchema = z
  .object({
    cagnotte_id: z.string().uuid(),
  })
  .strict();

export type DonneesCloturerCagnotte = z.infer<typeof cloturerCagnotteSchema>;
