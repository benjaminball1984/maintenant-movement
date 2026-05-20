import { z } from 'zod';
import { tokenTurnstileSchema } from './auth';

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
export const adhererGratuitSchema = z
  .object({
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesAdhererGratuit = z.infer<typeof adhererGratuitSchema>;

// ============================================================
// Chemin euros (12 €)
// ============================================================

export const adhererEurosSchema = z
  .object({
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesAdhererEuros = z.infer<typeof adhererEurosSchema>;

// ============================================================
// Chemin T99CP (12 unités)
// ============================================================

export const adhererT99CPSchema = z
  .object({
    /**
     * Hash de transaction Polygon. Pour 5.1 v1, on accepte un tx_hash
     * facultatif côté UI (le wallet réel n'est pas encore branché,
     * cohérent avec 3.3 et 4.3) : la Server Action mockera le hash si
     * vide. Quand un tx_hash est fourni, il doit respecter le format.
     */
    tx_hash: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, 'tx_hash invalide (format 0x + 64 hex attendus).')
      .optional()
      .or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesAdhererT99CP = z.infer<typeof adhererT99CPSchema>;
