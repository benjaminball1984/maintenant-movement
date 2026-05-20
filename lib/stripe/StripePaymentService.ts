import type { DemandeCheckout, EvenementWebhook, PaymentService, SessionCheckout } from './types';

/**
 * Implémentation Stripe (Checkout + Connect).
 *
 * Volontairement non implémentée au chantier 0.1. La pose réelle se fait
 * au chantier 3.3 (cagnottes : Checkout pour les dons en euros, Connect +
 * KYC pour les porteur·euses) et au chantier 5.1 (adhésion 12 €).
 */
export class StripePaymentService implements PaymentService {
  creerSessionCheckout(_demande: DemandeCheckout): Promise<SessionCheckout> {
    throw new Error('StripePaymentService.creerSessionCheckout : à implémenter au chantier 3.3.');
  }

  verifierWebhook(_corpsBrut: string, _signature: string): Promise<EvenementWebhook> {
    throw new Error('StripePaymentService.verifierWebhook : à implémenter au chantier 3.3.');
  }

  creerCompteConnect(
    _emailPorteur: string,
    _urlRetour: string,
  ): Promise<{ accountId: string; urlOnboarding: string }> {
    throw new Error('StripePaymentService.creerCompteConnect : à implémenter au chantier 3.3.');
  }
}
