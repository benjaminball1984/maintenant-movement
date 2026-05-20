import { MockPaymentService } from './MockPaymentService';
import { StripePaymentService } from './StripePaymentService';
import type { PaymentService } from './types';

export type {
  DemandeCheckout,
  EvenementWebhook,
  PaymentService,
  SessionCheckout,
} from './types';

/**
 * Factory du service de paiement.
 *
 * `PAYMENT_PROVIDER=mock` (défaut) → MockPaymentService.
 * `PAYMENT_PROVIDER=stripe_test` ou `stripe_live` → StripePaymentService.
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
