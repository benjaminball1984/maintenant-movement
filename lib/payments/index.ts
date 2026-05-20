import { MockPaymentService } from './MockPaymentService';
import { StripePaymentService } from './StripePaymentService';
import type { PaymentService } from './types';

export type {
  DonneesCheckout,
  DonneesCompteConnecte,
  PaymentService,
  ResultatCheckout,
  ResultatCompteConnecte,
  StatutPaiement,
} from './types';

/**
 * Factory du service de paiement (chantier 3.3).
 *
 * `PAYMENT_PROVIDER=mock` (défaut) → MockPaymentService.
 * `PAYMENT_PROVIDER=stripe_test`   → StripePaymentService (stub pour l'instant).
 * `PAYMENT_PROVIDER=stripe_live`   → StripePaymentService (stub pour l'instant).
 */
let instance: PaymentService | null = null;

function instancierPaymentService(): PaymentService {
  const provider = process.env.PAYMENT_PROVIDER ?? 'mock';
  switch (provider) {
    case 'stripe_test':
    case 'stripe_live':
      return new StripePaymentService();
    case 'mock':
      return new MockPaymentService();
    default:
      throw new Error(
        `PAYMENT_PROVIDER inconnu : "${provider}". Valeurs attendues : "mock" | "stripe_test" | "stripe_live".`,
      );
  }
}

export function getPaymentService(): PaymentService {
  if (instance === null) {
    instance = instancierPaymentService();
  }
  return instance;
}

/** Réinitialise le singleton. Réservé aux tests. */
export function resetPaymentService(): void {
  instance = null;
}

// ============================================================
// Helpers de calcul de frais (purs, pas de dépendance au service)
// ============================================================

/**
 * Frais Maintenant! sur un don en euros = 5 % du montant net souhaité.
 *
 * Convention « absorbés par la personne donatrice » (spec §5D) :
 *   - la donatrice saisit un montant brut qu'elle accepte de payer.
 *   - on déduit 5 % qui restent côté plateforme, le reste va au porteur.
 *
 * Cf. ADR à venir si le mode bascule sur « ajout au-dessus » (les 5 %
 * s'ajoutent au montant souhaité pour la cagnotte).
 *
 * @param montantTotalCentimes Montant total débité (centimes d'euros).
 * @returns Frais (centimes d'euros). Toujours >= 0.
 */
export function calculerFraisEuros(montantTotalCentimes: number): number {
  if (montantTotalCentimes <= 0) return 0;
  return Math.round(montantTotalCentimes * 0.05);
}

/**
 * Frais Maintenant! sur un don en T99CP = 0 (politique « 0 % T99CP »).
 */
export function calculerFraisT99CP(_montantUnites: bigint): bigint {
  return 0n;
}
