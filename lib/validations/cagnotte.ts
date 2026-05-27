import {
  MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
  type MessagesValidationCagnotte,
} from '@/lib/messages-validation';
import { z } from 'zod';

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
export function creerCagnotteFactory(
  messages: MessagesValidationCagnotte = MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      texte: z.string().trim().min(100, messages.texteMin).max(5000, messages.texteMax),
      type: z.enum(['ouverte', 'lutte', 'cotisation']),
      image_url: z.string().url(messages.imageUrl).optional().or(z.literal('')),
      objectif_euros: z
        .number()
        .int(messages.objectifEntier)
        .min(0, messages.objectifMin)
        .max(1_000_000, messages.objectifMax),
      wallet_t99cp: z
        .string()
        .trim()
        .regex(/^0x[a-fA-F0-9]{40}$/, messages.walletFormat)
        .optional()
        .or(z.literal('')),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const creerCagnotteSchema = creerCagnotteFactory();

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
export function creerFaireDonEurosSchema(
  messages: MessagesValidationCagnotte = MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
) {
  return z
    .object({
      cagnotte_id: z.string().uuid(messages.cagnotteUuid),
      montant_centimes: z
        .number()
        .int(messages.montantEntier)
        .min(100, messages.montantMin)
        .max(1_000_000_00, messages.montantMax),
      prenom: z.string().trim().max(100).optional().or(z.literal('')),
      nom: z.string().trim().max(100).optional().or(z.literal('')),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email(messages.emailFormat)
        .optional()
        .or(z.literal('')),
      code_postal: z
        .string()
        .trim()
        .regex(/^\d{5}$/, messages.codePostalFormat)
        .optional()
        .or(z.literal('')),
      accepte_newsletter: z.boolean(),
      accepte_contact_createurice: z.boolean(),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const faireDonEurosSchema = creerFaireDonEurosSchema();

export type DonneesFaireDonEuros = z.infer<typeof faireDonEurosSchema>;

/**
 * Don en T99CP. Frais 0. Le tx_hash est fourni par le front (après
 * signature de la transaction wallet) ou simulé en mode mock.
 */
export function creerFaireDonT99CPSchema(
  messages: MessagesValidationCagnotte = MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
) {
  return z
    .object({
      cagnotte_id: z.string().uuid(),
      /**
       * Montant en plus petite unité T99CP (équivalent wei). Sérialisé en
       * string parce que JavaScript Number ne représente pas fidèlement
       * un bigint > 2^53.
       */
      montant_unites: z
        .string()
        .regex(/^\d+$/, messages.t99cpMontantFormat)
        .refine((v) => BigInt(v) > 0n, messages.t99cpMontantPositif)
        .refine((v) => BigInt(v) <= 10n ** 27n, messages.t99cpMontantMax),
      tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, messages.txHashFormat),
      prenom: z.string().trim().max(100).optional().or(z.literal('')),
      nom: z.string().trim().max(100).optional().or(z.literal('')),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email(messages.emailFormat)
        .optional()
        .or(z.literal('')),
      code_postal: z
        .string()
        .trim()
        .regex(/^\d{5}$/, messages.codePostalFormat)
        .optional()
        .or(z.literal('')),
      accepte_newsletter: z.boolean(),
      accepte_contact_createurice: z.boolean(),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const faireDonT99CPSchema = creerFaireDonT99CPSchema();

export type DonneesFaireDonT99CP = z.infer<typeof faireDonT99CPSchema>;

// ============================================================
// Modération a posteriori : suspendre / rétablir / clôturer
// ============================================================

export function creerSuspendreCagnotteSchema(
  messages: MessagesValidationCagnotte = MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
) {
  return z
    .object({
      cagnotte_id: z.string().uuid(),
      raison_suspension: z.string().trim().min(10, messages.suspensionRaisonMin).max(500),
    })
    .strict();
}
export const suspendreCagnotteSchema = creerSuspendreCagnotteSchema();

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
