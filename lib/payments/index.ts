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
// Helpers de calcul de frais — extraits dans `./frais` pour pouvoir
// être importés côté client sans tirer le PaymentService (et donc
// `node:crypto`). On réexporte ici pour préserver l'API publique.
// ============================================================

export { TAUX_FRAIS_EUR, calculerFraisEuros, calculerFraisT99CP } from './frais';
