import {
  MESSAGES_VALIDATION_ADHESION_DEFAUT,
  type MessagesValidationAdhesion,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Validations Zod du sous-espace Adhérer (chantier 5.1).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7A` :
 *   « 3 chemins (gratuit, T99CP, euros). Onboarding contextualisé. »
 * Cf. plan §5.1 : adhésion 12 € ou 12 T99CP, mail de relance J+365.
 *
 * Trois schémas distincts, un par chemin. La Server Action décide
 * lequel utiliser selon le route paramètre.
 */

// ============================================================
// Constantes du chantier 5.1
// ============================================================

/** Montant unitaire d'une adhésion en euros : 12 € (1200 centimes). */
export const MONTANT_ADHESION_EUR_CENTIMES = 1200;

/**
 * Montant unitaire d'une adhésion en T99CP : 12 unités (12 * 10^18
 * en plus petite unité). Sérialisé en string bigint-safe.
 */
export const MONTANT_ADHESION_T99CP_UNITES = (12n * 10n ** 18n).toString();

// ============================================================
// Chemin gratuit
// ============================================================

/**
 * Adhésion par le chemin gratuit. Auth requise. Pas de montant à
 * passer (forcé à 0 côté Server Action). Turnstile pour éviter les
 * inscriptions massives par bots.
 */
export function creerAdhererGratuitSchema(
  messages: MessagesValidationAdhesion = MESSAGES_VALIDATION_ADHESION_DEFAUT,
) {
  return z
    .object({
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const adhererGratuitSchema = creerAdhererGratuitSchema();

export type DonneesAdhererGratuit = z.infer<typeof adhererGratuitSchema>;

// ============================================================
// Chemin euros (12 €)
// ============================================================

export function creerAdhererEurosSchema(
  messages: MessagesValidationAdhesion = MESSAGES_VALIDATION_ADHESION_DEFAUT,
) {
  return z
    .object({
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const adhererEurosSchema = creerAdhererEurosSchema();

export type DonneesAdhererEuros = z.infer<typeof adhererEurosSchema>;

// ============================================================
// Chemin T99CP (12 unités)
// ============================================================

export function creerAdhererT99CPSchema(
  messages: MessagesValidationAdhesion = MESSAGES_VALIDATION_ADHESION_DEFAUT,
) {
  return z
    .object({
      /**
       * Hash de transaction Polygon, OBLIGATOIRE (C17, doctrine §19 : la
       * plateforme ne signe aucune transaction). La personne paie depuis son
       * propre wallet sur the99coinproject.org puis recopie ici le hash
       * retourné. Format Polygon : `0x` + 64 caractères hexadécimaux.
       */
      tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, messages.txHashFormat),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const adhererT99CPSchema = creerAdhererT99CPSchema();

export type DonneesAdhererT99CP = z.infer<typeof adhererT99CPSchema>;
